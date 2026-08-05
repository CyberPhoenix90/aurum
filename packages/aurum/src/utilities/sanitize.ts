export interface HTMLSanitizeConfig {
    attributeBlacklist?: string[];
    attributeWhitelist?: string[];
    tagBlacklist?: string[];
    tagWhitelist?: string[];
}

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

// These elements either execute code, create a new parsing context, alter URL
// resolution, or can activate content that was not inspected by this sanitizer.
const UNSAFE_ELEMENTS = new Set([
    'base',
    'embed',
    'frame',
    'frameset',
    'iframe',
    'link',
    'meta',
    'noembed',
    'noframes',
    'noscript',
    'object',
    'plaintext',
    'script',
    'style',
    'template',
    'xmp'
]);

const URL_ATTRIBUTES = new Set([
    'action',
    'background',
    'cite',
    'formaction',
    'href',
    'longdesc',
    'poster',
    'src',
    'xlink:href'
]);

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const UNSAFE_STYLE = /(?:url\s*\(|image-set\s*\(|@import|expression\s*\(|-moz-binding|behavior\s*:|javascript\s*:|\\)/i;

interface NormalizedSanitizeConfig {
    attributeBlacklist?: Set<string>;
    attributeWhitelist?: Set<string>;
    tagBlacklist?: Set<string>;
    tagWhitelist?: Set<string>;
}

/**
 * Sanitizes HTML and returns its serialized representation.
 *
 * Prefer setSanitizedHTML when inserting the result into the DOM. Sanitization
 * is context-sensitive, so serializing and reparsing HTML in a different
 * element can reintroduce mutation-XSS hazards.
 */
export function sanitizeHTML(html: string, config: HTMLSanitizeConfig = {}): string {
    const container = document.createElement('div');
    setSanitizedHTML(container, html, config);
    return container.innerHTML;
}

/**
 * Safely replaces an element's children with sanitized HTML.
 *
 * The native safe HTML Sanitizer API is used when available. Browsers without
 * it parse into a detached element and apply the same mandatory safety policy
 * before any nodes are connected to the document.
 */
export function setSanitizedHTML(target: HTMLElement, html: string, config: HTMLSanitizeConfig = {}): void {
    const normalizedConfig = normalizeConfig(config);
    if (setHTMLNatively(target, html)) {
        applyPolicy(target, normalizedConfig);
        return;
    }

    const staging = target.cloneNode(false) as HTMLElement;
    staging.innerHTML = html;
    applyPolicy(staging, normalizedConfig);
    target.replaceChildren(...Array.from(staging.childNodes));
}

/** Safely appends or prepends sanitized HTML without rebuilding existing nodes. */
export function insertSanitizedHTML(
    target: HTMLElement,
    html: string,
    position: 'append' | 'prepend',
    config: HTMLSanitizeConfig = {}
): void {
    const staging = target.cloneNode(false) as HTMLElement;
    setSanitizedHTML(staging, html, config);
    const fragment = target.ownerDocument.createDocumentFragment();
    fragment.append(...Array.from(staging.childNodes));
    if (position === 'append') {
        target.append(fragment);
    } else {
        target.prepend(fragment);
    }
}

function setHTMLNatively(target: HTMLElement, html: string): boolean {
    const setHTML = (target as HTMLElement & { setHTML?: (html: string, options?: unknown) => void }).setHTML;
    if (typeof setHTML !== 'function') {
        return false;
    }

    try {
        // setHTML always applies the browser's XSS-safe baseline, even when a
        // custom removal configuration is supplied.
        setHTML.call(target, html, {
            sanitizer: {
                removeElements: Array.from(UNSAFE_ELEMENTS)
            }
        });
    } catch {
        // Early implementations used a different configuration shape. Their
        // default safe sanitizer is preferable to falling back to innerHTML.
        setHTML.call(target, html);
    }
    return true;
}

function applyPolicy(root: ParentNode, config: NormalizedSanitizeConfig): void {
    const elements = Array.from(root.querySelectorAll('*'));
    for (const element of elements) {
        if (!root.contains(element)) {
            continue;
        }

        const tag = element.localName.toLowerCase();
        if (element.namespaceURI !== HTML_NAMESPACE || UNSAFE_ELEMENTS.has(tag)) {
            element.remove();
            continue;
        }

        if (!isAllowed(tag, config.tagWhitelist, config.tagBlacklist)) {
            element.replaceWith(...Array.from(element.childNodes));
            continue;
        }

        sanitizeAttributes(element, config);
    }
}

function sanitizeAttributes(element: Element, config: NormalizedSanitizeConfig): void {
    for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        const localName = attribute.localName.toLowerCase();

        if (!isAllowed(name, config.attributeWhitelist, config.attributeBlacklist)) {
            element.removeAttributeNode(attribute);
            continue;
        }
        if (localName.startsWith('on') || localName === 'srcdoc') {
            element.removeAttributeNode(attribute);
            continue;
        }
        if (URL_ATTRIBUTES.has(name) && !isSafeURL(attribute.value, element.ownerDocument)) {
            element.removeAttributeNode(attribute);
            continue;
        }
        if (localName === 'srcset' && !isSafeSrcSet(attribute.value, element.ownerDocument)) {
            element.removeAttributeNode(attribute);
            continue;
        }
        if (localName === 'style' && UNSAFE_STYLE.test(attribute.value)) {
            element.removeAttributeNode(attribute);
        }
    }

    if (element.localName === 'a' && element.getAttribute('target')?.toLowerCase() === '_blank') {
        const rel = new Set((element.getAttribute('rel') ?? '').toLowerCase().split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        element.setAttribute('rel', Array.from(rel).join(' '));
    }
}

function isSafeURL(value: string, document: Document): boolean {
    const normalized = value.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
    if (normalized === '' || normalized.startsWith('#')) {
        return true;
    }
    if (/^(?:javascript|vbscript|data):/i.test(normalized)) {
        return false;
    }

    try {
        return SAFE_URL_PROTOCOLS.has(new URL(normalized, document.baseURI).protocol);
    } catch {
        return false;
    }
}

function isSafeSrcSet(value: string, document: Document): boolean {
    if (/(?:javascript|vbscript|data)\s*:/i.test(value.replace(/[\u0000-\u0020\u007f-\u009f]/g, ''))) {
        return false;
    }
    return value
        .split(',')
        .map((candidate) => candidate.trim().split(/\s+/)[0])
        .filter(Boolean)
        .every((candidate) => isSafeURL(candidate, document));
}

function normalizeConfig(config: HTMLSanitizeConfig): NormalizedSanitizeConfig {
    return {
        attributeBlacklist: toLowerCaseSet(config.attributeBlacklist),
        attributeWhitelist: toLowerCaseSet(config.attributeWhitelist),
        tagBlacklist: toLowerCaseSet(config.tagBlacklist),
        tagWhitelist: toLowerCaseSet(config.tagWhitelist)
    };
}

function toLowerCaseSet(values?: string[]): Set<string> | undefined {
    return values ? new Set(values.map((value) => value.toLowerCase())) : undefined;
}

function isAllowed(value: string, allowList?: Set<string>, rejectList?: Set<string>): boolean {
    if (rejectList?.has(value)) {
        return false;
    }
    return !allowList || allowList.has(value);
}
