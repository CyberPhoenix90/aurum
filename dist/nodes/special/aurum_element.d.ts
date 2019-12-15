import { ArrayDataSource, DataSource } from '../../stream/data_source';
import { CancellationToken } from '../../utilities/cancellation_token';
import { Callback, ClassType, DataDrain, MapLike, StringSource } from '../../utilities/common';
import { EventEmitter } from '../../utilities/event_emitter';
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
export declare type ChildNode = AurumElement | string | DataSource<string> | ArrayDataSource<AurumElement>;
export declare abstract class AurumElement {
    private onAttach?;
    private onDetach?;
    private onDispose?;
    private children;
    protected needAttach: boolean;
    protected cancellationToken: CancellationToken;
    node: HTMLElement;
    template: Template<any>;
    constructor(props: AurumElementProps, children: ChildNode[], domNodeName: string);
    private initialize;
    protected bindProps(keys: string[], props: any, dynamicProps?: string[]): void;
    protected createEventHandlers(events: MapLike<string>, props: any): void;
    protected render(): void;
    private renderChild;
    protected assignStringSourceToAttribute(data: StringSource, key: string): void;
    protected handleAttach(parent: AurumElement): void;
    private handleDetach;
    private handleClass;
    protected resolveStringSource(source: StringSource): string;
    protected create(domNodeName: string): HTMLElement;
    protected getChildIndex(node: HTMLElement): number;
    protected hasChild(node: HTMLElement): boolean;
    protected addChildDom(child: AurumElement): void;
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
    ref?: string | number;
}
export declare class Template<T> extends AurumElement {
    generate: (model: T) => AurumElement;
    ref: string | number;
    constructor(props: TemplateProps<T>, children: ChildNode[]);
}
export interface AurumFragmentProps {
    repeatModel?: ArrayDataSource<AurumElement>;
}
export declare class AurumFragment {
    children: AurumElement[];
    onChange: EventEmitter<void>;
    constructor(props: AurumFragmentProps);
    private handleRepeat;
}
//# sourceMappingURL=aurum_element.d.ts.map