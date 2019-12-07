import { StringSource } from '../utilities/common';
export declare class AurumTextElement {
    node: HTMLElement | Text;
    private source;
    constructor(text?: StringSource);
    protected resolveStringSource(source: StringSource): string;
    protected create(text?: StringSource): HTMLElement | Text;
    remove(): void;
    hasParent(): boolean;
    dispose(): void;
}
//# sourceMappingURL=aurum_text.d.ts.map