import { StringSource } from '../../utilities/common';
export declare class AurumTextElement {
    node: Text;
    private subscription;
    constructor(text?: StringSource);
    protected resolveStringSource(source: StringSource): string;
    protected create(text?: StringSource): Text;
    remove(): void;
    hasParent(): boolean;
    dispose(): void;
}
//# sourceMappingURL=aurum_text.d.ts.map