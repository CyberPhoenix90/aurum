import { DataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { DataDrain, StringSource, ClassType } from '../utilities/common';
import { ArrayDataSource } from '../stream/array_data_source';
export interface AurumElementProps {
    id?: StringSource;
    draggable?: StringSource;
    class?: ClassType;
    tabindex?: ClassType;
    style?: StringSource;
    title?: StringSource;
    repeatModel?: ArrayDataSource<any> | any[];
    onClick?: DataDrain<MouseEvent>;
    onKeydown?: DataDrain<KeyboardEvent>;
    onKeyup?: DataDrain<KeyboardEvent>;
    onMousedown?: DataDrain<KeyboardEvent>;
    onMouseup?: DataDrain<KeyboardEvent>;
    onMouseenter?: DataDrain<KeyboardEvent>;
    onMouseleave?: DataDrain<KeyboardEvent>;
    onMousewheel?: DataDrain<WheelEvent>;
    onAttach?: (node: AurumElement) => void;
    template?: Template<any>;
}
export declare abstract class AurumElement {
    protected cancellationToken: CancellationToken;
    private cachedChildren;
    protected repeatData: ArrayDataSource<any>;
    private rerenderPending;
    readonly node: HTMLElement;
    readonly domNodeName: string;
    template: Template<any>;
    onClick: DataSource<MouseEvent>;
    onKeydown: DataSource<KeyboardEvent>;
    onKeyup: DataSource<KeyboardEvent>;
    onMousedown: DataSource<KeyboardEvent>;
    onMouseup: DataSource<KeyboardEvent>;
    onMouseenter: DataSource<KeyboardEvent>;
    onMouseleave: DataSource<KeyboardEvent>;
    constructor(props: AurumElementProps, domNodeName: string);
    private initialize;
    protected bindProps(keys: string[], props: any): void;
    protected createEventHandlers(keys: string[], props: any): void;
    private handleRepeat;
    protected renderRepeat(): void;
    protected assignStringSourceToAttribute(data: StringSource, key: string): void;
    private handleClass;
    create(props: AurumElementProps): HTMLElement;
    protected getChildIndex(node: HTMLElement): number;
    protected hasChild(node: HTMLElement): boolean;
    setInnerText(value: string): void;
    swapChildren(indexA: number, indexB: number): void;
    protected addDomNodeAt(node: HTMLElement, index: number): void;
    addChildAt(child: AurumElement, index: number): void;
    addChildren(nodes: AurumElement[]): void;
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
//# sourceMappingURL=aurum_element.d.ts.map