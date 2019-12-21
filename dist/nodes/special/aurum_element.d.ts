import { ArrayDataSource, DataSource } from '../../stream/data_source';
import { Callback, ClassType, DataDrain, MapLike, StringSource } from '../../utilities/common';
import { AurumTextElement } from './aurum_text';
import { EventEmitter } from '../../utilities/event_emitter';
export declare const aurumElementModelIdentitiy: unique symbol;
export interface AurumElementModel {
    [aurumElementModelIdentitiy]: boolean;
    constructor: (props: AurumElementProps, innerNodes: ChildNode[]) => AurumElement;
    props: AurumElementProps;
    innerNodes: ChildNode[];
}
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
}
export declare function buildRenderableFromModel(model: AurumElementModel): AurumElement;
export declare type Renderable = AurumElement | string | Promise<Renderable> | DataSource<string> | DataSource<AurumElement> | DataSource<AurumElement[]> | ArrayDataSource<AurumElement> | ChildNode[];
export declare type ChildNode = AurumElementModel | string | Promise<ChildNode> | DataSource<string> | DataSource<AurumElementModel> | DataSource<AurumElementModel[]> | ArrayDataSource<AurumElementModel> | ChildNode[];
export declare abstract class AurumElement {
    private onAttach?;
    private onDetach?;
    private children;
    protected needAttach: boolean;
    node: HTMLElement;
    constructor(props: AurumElementProps, children: ChildNode[], domNodeName: string);
    private initialize;
    protected bindProps(keys: string[], props: any, dynamicProps?: string[]): void;
    protected createEventHandlers(events: MapLike<string>, props: any): void;
    protected render(): void;
    protected renderFragment(fragment: AurumFragment, absoluteIndex: number): number;
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
}
export interface AurumFragmentProps {
    repeatModel?: ArrayDataSource<AurumElementModel>;
}
export declare class AurumFragment {
    children: Array<AurumElement | AurumTextElement | AurumFragment>;
    onChange: EventEmitter<void>;
    constructor(props: AurumFragmentProps, children?: ChildNode[]);
    addChildren(children: ChildNode[]): void;
    private handleSourceChild;
    private handleRepeat;
}
//# sourceMappingURL=aurum_element.d.ts.map