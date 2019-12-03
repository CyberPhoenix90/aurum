import { DataSource, ArrayDataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DataDrain, StringSource, ClassType, Callback } from '../utilities/common';
export interface AurumElementProps {
    id?: StringSource;
    name?: StringSource;
    draggable?: StringSource;
    class?: ClassType;
    tabindex?: ClassType;
    style?: StringSource;
    title?: StringSource;
    role?: StringSource;
    contentEditable?: StringSource;
    repeatModel?: ArrayDataSource<any> | any[];
    onDblclick?: DataDrain<MouseEvent>;
    onClick?: DataDrain<MouseEvent>;
    onKeydown?: DataDrain<KeyboardEvent>;
    onKeyup?: DataDrain<KeyboardEvent>;
    onMousedown?: DataDrain<KeyboardEvent>;
    onMouseup?: DataDrain<KeyboardEvent>;
    onMouseenter?: DataDrain<KeyboardEvent>;
    onMouseleave?: DataDrain<KeyboardEvent>;
    onMousewheel?: DataDrain<WheelEvent>;
    onBlur?: DataDrain<FocusEvent>;
    onFocus?: DataDrain<FocusEvent>;
    onDrag?: DataDrain<DragEvent>;
    onDragend?: DataDrain<DragEvent>;
    onDragenter?: DataDrain<DragEvent>;
    onDragexit?: DataDrain<DragEvent>;
    onDragleave?: DataDrain<DragEvent>;
    onDragover?: DataDrain<DragEvent>;
    onDragstart?: DataDrain<DragEvent>;
    onAttach?: Callback<AurumElement>;
    onDetach?: Callback<AurumElement>;
    onCreate?: Callback<AurumElement>;
    onDispose?: Callback<AurumElement>;
    template?: Template<any>;
}
export declare type ChildNode = AurumElement | string | DataSource<string>;
export declare abstract class AurumElement {
    private onAttach?;
    private onDetach?;
    private onDispose?;
    private rerenderPending;
    private children;
    protected cancellationToken: CancellationToken;
    protected repeatData: ArrayDataSource<any>;
    readonly node: HTMLElement | Text;
    readonly domNodeName: string;
    template: Template<any>;
    onClick: DataSource<MouseEvent>;
    onKeydown: DataSource<KeyboardEvent>;
    onKeyup: DataSource<KeyboardEvent>;
    onMousedown: DataSource<KeyboardEvent>;
    onMouseup: DataSource<KeyboardEvent>;
    onMouseenter: DataSource<KeyboardEvent>;
    onMouseleave: DataSource<KeyboardEvent>;
    onFocus: DataSource<FocusEvent>;
    onBlur: DataSource<FocusEvent>;
    onDrag: DataSource<DragEvent>;
    onDragend: DataSource<DragEvent>;
    onDragenter: DataSource<DragEvent>;
    onDragexit: DataSource<DragEvent>;
    onDragleave: DataSource<DragEvent>;
    onDragover: DataSource<DragEvent>;
    onDragstart: DataSource<DragEvent>;
    constructor(props: AurumElementProps, domNodeName: string);
    private initialize;
    protected bindProps(keys: string[], props: any): void;
    protected createEventHandlers(keys: string[], props: any): void;
    private handleRepeat;
    protected render(): void;
    protected assignStringSourceToAttribute(data: StringSource, key: string): void;
    private handleAttach;
    private handleDetach;
    private handleClass;
    protected resolveStringSource(source: StringSource): string;
    protected create(props: AurumElementProps): HTMLElement | Text;
    protected getChildIndex(node: HTMLElement | Text): number;
    protected hasChild(node: HTMLElement): boolean;
    protected addChildrenDom(children: AurumElement[]): void;
    protected swapChildrenDom(indexA: number, indexB: number): void;
    protected addDomNodeAt(node: HTMLElement | Text, index: number): void;
    remove(): void;
    hasParent(): boolean;
    isConnected(): boolean;
    removeChild(child: AurumElement): void;
    removeChildAt(index: number): void;
    swapChildren(indexA: number, indexB: number): void;
    clearChildren(): void;
    addChild(child: ChildNode): void;
    private childNodeToAurum;
    addChildAt(child: ChildNode, index: number): void;
    addChildren(nodes: ChildNode[]): void;
    dispose(): void;
    private internalDispose;
}
export interface TemplateProps<T> extends AurumElementProps {
    onAttach?(entity: Template<T>): void;
    onDetach?(entity: Template<T>): void;
    generator(model: T): AurumElement;
    ref?: string;
}
export declare class Template<T> extends AurumElement {
    generate: (model: T) => AurumElement;
    ref: string;
    constructor(props: TemplateProps<T>);
}
export interface TextNodeProps extends AurumElementProps {
    onAttach?: (node: TextNode) => void;
    onDetach?: (node: TextNode) => void;
    text?: StringSource;
}
export declare class TextNode extends AurumElement {
    constructor(props: TextNodeProps);
    protected create(props: TextNodeProps): HTMLElement | Text;
}
//# sourceMappingURL=aurum_element.d.ts.map