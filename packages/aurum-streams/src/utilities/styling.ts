import { ReadOnlyDataSource } from '../stream/data_source.js';
import { CancellationToken } from './cancellation_token.js';

const aurumStyleClassMarker = Symbol('aurum-style-class');
const styleDefinitions = new Map<string, AurumStyleClass>();
const globalDefinitions = new Map<string, { name: string; cssText: string }>();
const sourceIds = new WeakMap<object, number>();
let nextSourceId = 1;

export type CSSInterpolation = string | number | null | undefined | false | ReadOnlyDataSource<string | number | null | undefined>;

export interface AurumStyleClass {
    readonly [aurumStyleClassMarker]: true;
    readonly className: string;
    readonly cssText: string;
    attach(cancellationToken: CancellationToken): string;
    toString(): string;
}

class NativeAurumStyleClass implements AurumStyleClass {
    public readonly [aurumStyleClassMarker] = true as const;
    public readonly className: string;
    public readonly cssText: string;

    private readonly sources: Array<{ source: ReadOnlyDataSource<string | number | null | undefined>; variableName: string }>;
    private activeAttachments = 0;
    private subscriptionToken: CancellationToken | undefined;
    private styleElement: HTMLStyleElement | undefined;
    private variableRule: CSSStyleRule | undefined;

    public constructor(className: string, cssText: string, sources: Array<{ source: ReadOnlyDataSource<string | number | null | undefined>; variableName: string }>) {
        this.className = className;
        this.cssText = cssText;
        this.sources = sources;
    }

    public attach(cancellationToken: CancellationToken): string {
        this.ensureStyleElement();
        this.activeAttachments++;
        if (this.activeAttachments === 1) {
            this.activate();
        }

        let attached = true;
        cancellationToken.addCancellable(() => {
            if (!attached) {
                return;
            }
            attached = false;
            this.activeAttachments--;
            if (this.activeAttachments === 0) {
                this.subscriptionToken?.cancel();
                this.subscriptionToken = undefined;
            }
        });

        return this.className;
    }

    public toString(): string {
        return this.className;
    }

    public getSerializedCSS(): string {
        const variables = this.sources
            .map(({ source, variableName }) => `${variableName}:${serializeCSSValue(source.value)};`)
            .join('');
        return `.${this.className}{${variables}}\n.${this.className}{${this.cssText}}`;
    }

    private activate(): void {
        this.subscriptionToken = new CancellationToken();
        for (const binding of this.sources) {
            binding.source.listenAndRepeat((value) => {
                this.setVariable(binding.variableName, value);
            }, this.subscriptionToken);
        }
    }

    private ensureStyleElement(): void {
        if (typeof document === 'undefined') {
            return;
        }

        ensureGlobalStyleElements();

        if (this.styleElement?.isConnected) {
            return;
        }

        const existing = Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-aurum-style]')).find(
            (element) => element.dataset.aurumStyle === this.className
        );
        this.styleElement = existing ?? document.createElement('style');
        if (!existing) {
            this.styleElement.dataset.aurumStyle = this.className;
            this.styleElement.textContent = `.${this.className}{}\n.${this.className}{${this.cssText}}`;
            document.head.appendChild(this.styleElement);
        }

        this.variableRule = Array.from(this.styleElement.sheet?.cssRules ?? []).find(
            (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === `.${this.className}`
        );
    }

    private setVariable(name: string, value: string | number | null | undefined): void {
        this.ensureStyleElement();
        if (value === undefined || value === null) {
            this.variableRule?.style.removeProperty(name);
        } else {
            this.variableRule?.style.setProperty(name, String(value));
        }
    }
}

export function css(strings: TemplateStringsArray, ...interpolations: CSSInterpolation[]): AurumStyleClass {
    const sourceBindings: Array<{ source: ReadOnlyDataSource<string | number | null | undefined>; variableName: string }> = [];
    const identityParts: string[] = [];

    for (let index = 0; index < interpolations.length; index++) {
        const interpolation = interpolations[index];
        identityParts.push(isReadOnlyDataSource(interpolation) ? `source:${getSourceId(interpolation)}` : `value:${String(interpolation ?? '')}`);
    }

    const identity = strings.join('\u0001') + '\u0002' + identityParts.join('\u0001');
    const className = `aurum-${hash(identity)}`;
    const existing = styleDefinitions.get(identity);
    if (existing) {
        return existing;
    }

    let ruleBody = strings[0];
    for (let index = 0; index < interpolations.length; index++) {
        const interpolation = interpolations[index];
        if (isReadOnlyDataSource(interpolation)) {
            const variableName = `--${className}-${index}`;
            sourceBindings.push({ source: interpolation, variableName });
            ruleBody += `var(${variableName})`;
        } else {
            ruleBody += interpolation === false || interpolation === null || interpolation === undefined ? '' : String(interpolation);
        }
        ruleBody += strings[index + 1];
    }

    const result = new NativeAurumStyleClass(className, ruleBody, sourceBindings);
    styleDefinitions.set(identity, result);
    return result;
}

/** Registers a globally scoped keyframe rule and returns its stable animation name. */
export function keyframes(strings: TemplateStringsArray, ...interpolations: Array<string | number>): string {
    let body = strings[0];
    for (let index = 0; index < interpolations.length; index++) {
        body += String(interpolations[index]) + strings[index + 1];
    }

    const identity = `keyframes:${body}`;
    const existing = globalDefinitions.get(identity);
    if (existing) {
        return existing.name;
    }

    const name = `aurum-keyframes-${hash(identity)}`;
    globalDefinitions.set(identity, { name, cssText: `@keyframes ${name}{${body}}` });
    ensureGlobalStyleElements();
    return name;
}

export function isAurumStyleClass(value: unknown): value is AurumStyleClass {
    return typeof value === 'object' && value !== null && aurumStyleClassMarker in value;
}

/** Returns all registered rules for insertion into an SSR document's style element. */
export function getAurumStyleText(): string {
    return [
        ...Array.from(globalDefinitions.values(), (definition) => definition.cssText),
        ...Array.from(styleDefinitions.values(), (style) => (style as NativeAurumStyleClass).getSerializedCSS())
    ].join('\n');
}

function ensureGlobalStyleElements(): void {
    if (typeof document === 'undefined') {
        return;
    }
    for (const definition of globalDefinitions.values()) {
        const exists = Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-aurum-global-style]')).some(
            (element) => element.dataset.aurumGlobalStyle === definition.name
        );
        if (!exists) {
            const element = document.createElement('style');
            element.dataset.aurumGlobalStyle = definition.name;
            element.textContent = definition.cssText;
            document.head.appendChild(element);
        }
    }
}

function isReadOnlyDataSource(value: CSSInterpolation): value is ReadOnlyDataSource<string | number | null | undefined> {
    return typeof value === 'object' && value !== null && 'value' in value && typeof value.listenAndRepeat === 'function';
}

function getSourceId(source: object): number {
    let id = sourceIds.get(source);
    if (id === undefined) {
        id = nextSourceId++;
        sourceIds.set(source, id);
    }
    return id;
}

function hash(value: string): string {
    let result = 2166136261;
    for (let index = 0; index < value.length; index++) {
        result ^= value.charCodeAt(index);
        result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
}

function serializeCSSValue(value: string | number | null | undefined): string {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value)
        .replace(/\\/g, '\\5C ')
        .replace(/;/g, '\\3B ')
        .replace(/[{}]/g, (character) => (character === '{' ? '\\7B ' : '\\7D '))
        .replace(/</g, '\\3C ');
}
