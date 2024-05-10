export interface HTMLSanitizeConfig {
    attributeBlacklist?: string[];
    attributeWhitelist?: string[];
    tagBlacklist?: string[];
    tagWhitelist?: string[];
    allowEventHandlers?: boolean;
    allowJavaScriptUrls?: boolean;
    allowStyleUrls?: boolean;
}

const extractTags: RegExp = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
const extractAttributes: RegExp = /\s(\w+)="(.*?)"/gi;

export function sanitizeHTML(
    html: string,
    config: HTMLSanitizeConfig = {
        tagBlacklist: ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta'],
        allowEventHandlers: false,
        allowJavaScriptUrls: false,
        allowStyleUrls: false
    }
): string {
    const tagAllowList: string = config.tagWhitelist?.join('').toLowerCase() ?? null;
    const tagRejectList: string = config.tagBlacklist?.join('').toLowerCase() ?? null;
    const attributeAllowList: string = config.attributeWhitelist?.join('').toLowerCase() ?? null;
    const attributeRejectList: string = config.attributeBlacklist?.join('').toLowerCase() ?? null;

    return html.replace(extractTags, (htmlElement: string, tag: string) => {
        if (isAllowed(tag.toLowerCase(), tagAllowList, tagRejectList)) {
            return htmlElement.replace(extractAttributes, (attributeValue: string, attribute: string) => {
                if (isAllowed(attribute.toLowerCase(), attributeAllowList, attributeRejectList)) {
                    if (!config.allowEventHandlers && attribute.startsWith('on')) {
                        return '';
                    }

                    if (attribute === 'href' && !config.allowJavaScriptUrls && attributeValue.includes('javascript:')) {
                        return '';
                    }
                    if (attribute === 'src' && !config.allowJavaScriptUrls && attributeValue.includes('javascript:')) {
                        return '';
                    }
                    if (attribute === 'style' && !config.allowJavaScriptUrls && attributeValue.includes('javascript:')) {
                        return '';
                    }
                    if (attribute === 'style' && !config.allowStyleUrls && attributeValue.includes('url(')) {
                        return '';
                    }
                    return attributeValue;
                }
                return '';
            });
        } else {
            return '';
        }
    });
}

function isAllowed(value: string, allowList: string | null, rejectList: string | null): boolean {
    if (rejectList && rejectList.includes(value)) {
        return false;
    }

    if (allowList && !allowList.includes(value)) {
        return false;
    }

    return true;
}
