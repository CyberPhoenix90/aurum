declare module "utilities/common" {
    import { DataSource } from "stream/data_source";
    export type StringSource = string | DataSource<string>;
    export type ClassType = string | DataSource<string> | DataSource<string[]> | Array<string | DataSource<string>>;
    export type Callback<T> = (data?: T) => void;
    export type Delegate = () => void;
    export type Predicate<T> = (data: T) => boolean;
    export type Provider<T> = () => T;
    export type Comparator<T1, T2> = (value1: T1, value2: T2) => boolean;
    export type Constructor<T> = new (...args: any[]) => T;
    export type MapLike<T> = {
        [key: string]: T;
    };
    export type Primitive = number | string | boolean | null | undefined;
    export type JSONObject<T> = {
        [key: string]: T | JSONObject<T>;
    };
    export type ValueOrProvider<T> = T | Provider<T>;
    export type ValueOrArray<T> = T | T[];
    export interface PointLike {
        x: number;
        y: number;
    }
    export type DataDrain<T> = Callback<T> | DataSource<T>;
}
declare module "utilities/linkedlist/linked_list_node" {
    export class LinkedListNode<T> {
        next: LinkedListNode<T>;
        previous: LinkedListNode<T>;
        data: T;
        constructor(data: T);
        deleteNext(): void;
        deletePrevious(): void;
    }
}
declare module "utilities/linkedlist/linked_list" {
    import { LinkedListNode } from "utilities/linkedlist/linked_list_node";
    import { Predicate } from "utilities/common";
    export class LinkedList<T> {
        rootNode: LinkedListNode<T>;
        lastNode: LinkedListNode<T>;
        length: number;
        constructor(data?: T[]);
        find(predicate: Predicate<LinkedListNode<T>>): LinkedListNode<T>;
        append(element: T): T;
        forEach(cb: (d: T) => void): void;
        prepend(element: T): T;
        remove(element: T): void;
    }
}
declare module "utilities/cancellation_token" {
    import { Delegate, Callback } from "utilities/common";
    export class CancellationToken {
        private cancelables;
        private _isCancelled;
        get isCanceled(): boolean;
        constructor(...cancellables: Delegate[]);
        addCancelable(delegate: Delegate): this;
        removeCancelable(delegate: Delegate): this;
        addDisposable(disposable: {
            dispose(): any;
        }): this;
        callIfNotCancelled(action: Delegate): void;
        setTimeout(cb: Delegate, time?: number): void;
        setInterval(cb: Delegate, time: number): void;
        requestAnimationFrame(cb: Callback<number>): void;
        animationLoop(cb: Callback<number>): void;
        throwIfCancelled(msg: string): void;
        chain(target: CancellationToken, twoWays?: boolean): CancellationToken;
        registerDomEvent(eventEmitter: HTMLElement | Document, event: string, callback: (e: Event) => void): this;
        cancel(): void;
    }
}
declare module "stream/event_emitter" {
    import { CancellationToken } from "utilities/cancellation_token";
    export interface EventSubscriptionFacade {
        cancel(): void;
    }
    export type EventCallback<T> = (data: T) => void;
    export interface EventConfig {
        observable?: boolean;
        cancellationToken?: CancellationToken;
        throttled?: number;
    }
    export class EventEmitter<T> {
        onSubscribe: EventEmitter<void> | undefined;
        onSubscribeOnce: EventEmitter<void> | undefined;
        onCancelAll: EventEmitter<void> | undefined;
        onCancel: EventEmitter<void> | undefined;
        private isFiring;
        private onAfterFire;
        get subscriptions(): number;
        get oneTimeSubscriptions(): number;
        private linkedEvents;
        private subscribeChannel;
        private subscribeOnceChannel;
        private readonly throttle;
        private throttleCount;
        constructor(config?: EventConfig);
        linkEvent(eventToLink: EventEmitter<T>): void;
        unlinkEvent(eventToUnlink: EventEmitter<T>): void;
        makeObservable(): void;
        swapSubscriptions(event: EventEmitter<T>): void;
        subscribe(callback: EventCallback<T>, cancellationToken?: CancellationToken): EventSubscriptionFacade;
        hasSubscriptions(): boolean;
        subscribeOnce(cancellationToken?: CancellationToken): Promise<T>;
        cancelAll(): void;
        fire(data?: T, data2?: T, data3?: T, data4?: T, data5?: T): void;
        private createSubscription;
        private cancel;
    }
}
declare module "stream/data_source" {
    import { CancellationToken } from "utilities/cancellation_token";
    import { Callback } from "utilities/common";
    import { EventEmitter } from "stream/event_emitter";
    import { Predicate } from "utilities/common";
    export class DataSource<T> {
        value: T;
        private listeners;
        constructor(initialValue?: T);
        update(newValue: T): void;
        listen(callback: (value: T) => void, cancellationToken?: CancellationToken): Callback<void>;
        filter(callback: (value: T) => boolean, cancellationToken?: CancellationToken): DataSource<T>;
        pipe(targetDataSource: DataSource<T>, cancellationToken?: CancellationToken): void;
        map<D>(callback: (value: T) => D, cancellationToken?: CancellationToken): DataSource<D>;
        unique(cancellationToken?: CancellationToken): DataSource<T>;
        reduce(reducer: (p: T, c: T) => T, initialValue: T, cancellationToken?: CancellationToken): DataSource<T>;
        aggregate<D, E>(otherSource: DataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E>;
        combine(otherSource: DataSource<T>, cancellationToken?: CancellationToken): DataSource<T>;
        debounce(time: number, cancellationToken?: CancellationToken): DataSource<T>;
        buffer(time: number, cancellationToken?: CancellationToken): DataSource<T[]>;
        queue(time: number, cancellationToken?: CancellationToken): ArrayDataSource<T>;
        pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]>;
        cancelAll(): void;
    }
    export interface CollectionChange<T> {
        operation: 'replace' | 'append' | 'prepend' | 'remove' | 'swap';
        count?: number;
        index: number;
        index2?: number;
        target?: T;
        items: T[];
        newState: T[];
    }
    export class ArrayDataSource<T> {
        protected data: T[];
        onChange: EventEmitter<CollectionChange<T>>;
        constructor(initialData?: T[]);
        get length(): number;
        getData(): T[];
        get(index: number): T;
        set(index: number, item: T): void;
        swap(indexA: number, indexB: number): void;
        swapItems(itemA: T, itemB: T): void;
        push(...items: T[]): void;
        unshift(...items: T[]): void;
        pop(): T;
        merge(newData: T[]): void;
        removeRight(count: number): void;
        removeLeft(count: number): void;
        remove(item: T): void;
        clear(): void;
        shift(): T;
        toArray(): T[];
        filter(callback: Predicate<T>, cancellationToken?: CancellationToken): FilteredArrayView<T>;
        forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
        toDataSource(): DataSource<T[]>;
    }
    export class FilteredArrayView<T> extends ArrayDataSource<T> {
        private viewFilter;
        private parent;
        constructor(parent: ArrayDataSource<T>, filter: Predicate<T>, cancellationToken?: CancellationToken);
        updateFilter(filter: Predicate<T>): void;
        protected refresh(): void;
    }
}
declare module "utilities/owner_symbol" {
    export const ownerSymbol: unique symbol;
}
declare module "nodes/aurum_element" {
    import { DataSource, ArrayDataSource } from "stream/data_source";
    import { CancellationToken } from "utilities/cancellation_token";
    import { DataDrain, StringSource, ClassType, Callback } from "utilities/common";
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
    export type ChildNode = AurumElement | string | DataSource<string>;
    export abstract class AurumElement {
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
    export class Template<T> extends AurumElement {
        generate: (model: T) => AurumElement;
        ref: string;
        constructor(props: TemplateProps<T>);
    }
    interface TextNodeProps extends AurumElementProps {
        onAttach?: (node: TextNode) => void;
        onDetach?: (node: TextNode) => void;
        text?: StringSource;
    }
    export class TextNode extends AurumElement {
        constructor(props: TextNodeProps);
        protected create(props: TextNodeProps): HTMLElement | Text;
    }
}
declare module "nodes/a" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface AProps extends AurumElementProps {
        onAttach?: Callback<A>;
        onDetach?: Callback<A>;
        onCreate?: Callback<A>;
        onDispose?: Callback<A>;
        href?: StringSource;
        target?: StringSource;
    }
    export class A extends AurumElement {
        readonly node: HTMLAnchorElement;
        constructor(props: AProps);
    }
}
declare module "nodes/abbr" {
    import { Callback } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface AbbrProps extends AurumElementProps {
        onAttach?: Callback<Abbr>;
        onDetach?: Callback<Abbr>;
        onCreate?: Callback<Abbr>;
        onDispose?: Callback<Abbr>;
    }
    export class Abbr extends AurumElement {
        constructor(props: AbbrProps);
    }
}
declare module "nodes/area" {
    import { Callback } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface AreaProps extends AurumElementProps {
        onAttach?: Callback<Area>;
        onDetach?: Callback<Area>;
        onCreate?: Callback<Area>;
        onDispose?: Callback<Area>;
    }
    export class Area extends AurumElement {
        readonly node: HTMLAreaElement;
        constructor(props: AreaProps);
    }
}
declare module "nodes/article" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface ArticleProps extends AurumElementProps {
        onAttach?: Callback<Article>;
        onDetach?: Callback<Article>;
        onCreate?: Callback<Article>;
        onDispose?: Callback<Article>;
    }
    export class Article extends AurumElement {
        constructor(props: ArticleProps);
    }
}
declare module "nodes/aside" {
    import { Callback } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface AsideProps extends AurumElementProps {
        onAttach?: Callback<Aside>;
        onDetach?: Callback<Aside>;
        onCreate?: Callback<Aside>;
        onDispose?: Callback<Aside>;
    }
    export class Aside extends AurumElement {
        constructor(props: AsideProps);
    }
}
declare module "nodes/audio" {
    import { Callback, StringSource } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface AudioProps extends AurumElementProps {
        onAttach?: Callback<Audio>;
        onDetach?: Callback<Audio>;
        onCreate?: Callback<Audio>;
        onDispose?: Callback<Audio>;
        controls?: StringSource;
        autoplay?: StringSource;
        loop?: StringSource;
        muted?: StringSource;
        preload?: StringSource;
        src?: StringSource;
    }
    export class Audio extends AurumElement {
        readonly node: HTMLAudioElement;
        constructor(props: AudioProps);
    }
}
declare module "nodes/b" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface BProps extends AurumElementProps {
        onAttach?: Callback<B>;
        onDetach?: Callback<B>;
        onCreate?: Callback<B>;
        onDispose?: Callback<B>;
    }
    export class B extends AurumElement {
        constructor(props: BProps);
    }
}
declare module "nodes/br" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface BrProps extends AurumElementProps {
        onAttach?: Callback<Br>;
        onDetach?: Callback<Br>;
        onCreate?: Callback<Br>;
        onDispose?: Callback<Br>;
    }
    export class Br extends AurumElement {
        readonly node: HTMLBRElement;
        constructor(props: BrProps);
    }
}
declare module "nodes/button" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface ButtonProps extends AurumElementProps {
        disabled?: StringSource;
        onAttach?: Callback<Button>;
        onDetach?: Callback<Button>;
        onCreate?: Callback<Button>;
        onDispose?: Callback<Button>;
    }
    export class Button extends AurumElement {
        readonly node: HTMLButtonElement;
        constructor(props: ButtonProps);
    }
}
declare module "nodes/canvas" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface CanvasProps extends AurumElementProps {
        onAttach?: Callback<Canvas>;
        onDetach?: Callback<Canvas>;
        onCreate?: Callback<Canvas>;
        onDispose?: Callback<Canvas>;
        width?: StringSource;
        height?: StringSource;
    }
    export class Canvas extends AurumElement {
        readonly node: HTMLCanvasElement;
        constructor(props: CanvasProps);
    }
}
declare module "nodes/data" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface DataProps extends AurumElementProps {
        onAttach?: Callback<Data>;
        onDetach?: Callback<Data>;
        onCreate?: Callback<Data>;
        onDispose?: Callback<Data>;
        value?: StringSource;
    }
    export class Data extends AurumElement {
        node: HTMLDataElement;
        constructor(props: DataProps);
    }
}
declare module "nodes/details" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface DetailsProps extends AurumElementProps {
        onAttach?: Callback<Details>;
        onDetach?: Callback<Details>;
        onCreate?: Callback<Details>;
        onDispose?: Callback<Details>;
    }
    export class Details extends AurumElement {
        readonly node: HTMLDetailsElement;
        constructor(props: DetailsProps);
    }
}
declare module "nodes/div" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface DivProps extends AurumElementProps {
        onAttach?: Callback<Div>;
        onDetach?: Callback<Div>;
        onCreate?: Callback<Div>;
        onDispose?: Callback<Div>;
    }
    export class Div extends AurumElement {
        readonly node: HTMLDivElement;
        constructor(props: DivProps);
    }
}
declare module "nodes/em" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface EmProps extends AurumElementProps {
        onAttach?: Callback<Em>;
        onDetach?: Callback<Em>;
        onCreate?: Callback<Em>;
        onDispose?: Callback<Em>;
    }
    export class Em extends AurumElement {
        constructor(props: EmProps);
    }
}
declare module "nodes/footer" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface FooterProps extends AurumElementProps {
        onAttach?: Callback<Footer>;
        onDetach?: Callback<Footer>;
        onCreate?: Callback<Footer>;
        onDispose?: Callback<Footer>;
    }
    export class Footer extends AurumElement {
        constructor(props: FooterProps);
    }
}
declare module "nodes/form" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface FormProps extends AurumElementProps {
        onAttach?: Callback<Form>;
        onDetach?: Callback<Form>;
        onCreate?: Callback<Form>;
        onDispose?: Callback<Form>;
    }
    export class Form extends AurumElement {
        readonly node: HTMLFormElement;
        constructor(props: FormProps);
    }
}
declare module "nodes/h1" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface H1Props extends AurumElementProps {
        onAttach?: Callback<H1>;
        onDetach?: Callback<H1>;
        onCreate?: Callback<H1>;
        onDispose?: Callback<H1>;
    }
    export class H1 extends AurumElement {
        constructor(props: H1Props);
    }
}
declare module "nodes/h2" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface H2Props extends AurumElementProps {
        onAttach?: Callback<H2>;
        onDetach?: Callback<H2>;
        onCreate?: Callback<H2>;
        onDispose?: Callback<H2>;
    }
    export class H2 extends AurumElement {
        constructor(props: H2Props);
    }
}
declare module "nodes/h3" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface H3Props extends AurumElementProps {
        onAttach?: Callback<H3>;
        onDetach?: Callback<H3>;
        onCreate?: Callback<H3>;
        onDispose?: Callback<H3>;
    }
    export class H3 extends AurumElement {
        constructor(props: H3Props);
    }
}
declare module "nodes/h4" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface H4Props extends AurumElementProps {
        onAttach?: Callback<H4>;
        onDetach?: Callback<H4>;
        onCreate?: Callback<H4>;
        onDispose?: Callback<H4>;
    }
    export class H4 extends AurumElement {
        constructor(props: H4Props);
    }
}
declare module "nodes/h5" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface H5Props extends AurumElementProps {
        onAttach?: Callback<H5>;
        onDetach?: Callback<H5>;
        onCreate?: Callback<H5>;
        onDispose?: Callback<H5>;
    }
    export class H5 extends AurumElement {
        constructor(props: H5Props);
    }
}
declare module "nodes/h6" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface H6Props extends AurumElementProps {
        onAttach?: Callback<H6>;
        onDetach?: Callback<H6>;
        onCreate?: Callback<H6>;
        onDispose?: Callback<H6>;
    }
    export class H6 extends AurumElement {
        constructor(props: H6Props);
    }
}
declare module "nodes/header" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface HeaderProps extends AurumElementProps {
        onAttach?: Callback<Header>;
        onDetach?: Callback<Header>;
        onCreate?: Callback<Header>;
        onDispose?: Callback<Header>;
    }
    export class Header extends AurumElement {
        constructor(props: HeaderProps);
    }
}
declare module "nodes/heading" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface HeadingProps extends AurumElementProps {
        onAttach?: Callback<Heading>;
        onDetach?: Callback<Heading>;
        onCreate?: Callback<Heading>;
        onDispose?: Callback<Heading>;
    }
    export class Heading extends AurumElement {
        readonly node: HTMLHeadingElement;
        constructor(props: HeadingProps);
    }
}
declare module "nodes/i" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface IProps extends AurumElementProps {
        onAttach?: Callback<I>;
        onDetach?: Callback<I>;
        onCreate?: Callback<I>;
        onDispose?: Callback<I>;
    }
    export class I extends AurumElement {
        constructor(props: IProps);
    }
}
declare module "nodes/iframe" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface IFrameProps extends AurumElementProps {
        onAttach?: Callback<IFrame>;
        onDetach?: Callback<IFrame>;
        onCreate?: Callback<IFrame>;
        onDispose?: Callback<IFrame>;
        src?: StringSource;
        allow?: StringSource;
        allowFullscreen?: StringSource;
        allowPaymentRequest?: StringSource;
        width?: StringSource;
        height?: StringSource;
        srcdoc?: StringSource;
    }
    export class IFrame extends AurumElement {
        readonly node: HTMLIFrameElement;
        constructor(props: IFrameProps);
    }
}
declare module "nodes/img" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface ImgProps extends AurumElementProps {
        onAttach?: Callback<Img>;
        onDetach?: Callback<Img>;
        onCreate?: Callback<Img>;
        onDispose?: Callback<Img>;
        src?: StringSource;
        alt?: StringSource;
        width?: StringSource;
        height?: StringSource;
        referrerPolicy?: StringSource;
        sizes?: StringSource;
        srcset?: StringSource;
        useMap?: StringSource;
    }
    export class Img extends AurumElement {
        readonly node: HTMLImageElement;
        constructor(props: ImgProps);
    }
}
declare module "nodes/input" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { DataSource } from "stream/data_source";
    import { DataDrain, StringSource, Callback } from "utilities/common";
    export interface InputProps extends AurumElementProps {
        onAttach?: Callback<Input>;
        onDetach?: Callback<Input>;
        onCreate?: Callback<Input>;
        onDispose?: Callback<Input>;
        placeholder?: StringSource;
        readonly?: StringSource;
        disabled?: StringSource;
        onChange?: DataDrain<InputEvent>;
        onInput?: DataDrain<InputEvent>;
        inputValueSource?: DataSource<string>;
        initialValue?: string;
        accept?: StringSource;
        alt?: StringSource;
        autocomplete?: StringSource;
        autofocus?: StringSource;
        checked?: StringSource;
        defaultChecked?: StringSource;
        formAction?: StringSource;
        formEnctype?: StringSource;
        formMethod?: StringSource;
        formNoValidate?: StringSource;
        formTarget?: StringSource;
        max?: StringSource;
        maxLength?: StringSource;
        min?: StringSource;
        minLength?: StringSource;
        pattern?: StringSource;
        multiple?: StringSource;
        required?: StringSource;
        type?: StringSource;
    }
    export class Input extends AurumElement {
        node: HTMLInputElement;
        onChange: DataSource<InputEvent>;
        onInput: DataSource<InputEvent>;
        constructor(props: InputProps);
    }
}
declare module "nodes/label" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface LabelProps extends AurumElementProps {
        onAttach?: Callback<Label>;
        onDetach?: Callback<Label>;
        onCreate?: Callback<Label>;
        onDispose?: Callback<Label>;
        for?: StringSource;
    }
    export class Label extends AurumElement {
        node: HTMLLabelElement;
        constructor(props: LabelProps);
    }
}
declare module "nodes/li" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface LiProps extends AurumElementProps {
        onAttach?: Callback<Li>;
        onDetach?: Callback<Li>;
        onCreate?: Callback<Li>;
        onDispose?: Callback<Li>;
    }
    export class Li extends AurumElement {
        node: HTMLLIElement;
        constructor(props: LiProps);
    }
}
declare module "nodes/link" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface LinkProps extends AurumElementProps {
        onAttach?: Callback<Link>;
        onDetach?: Callback<Link>;
        onCreate?: Callback<Link>;
        onDispose?: Callback<Link>;
        href?: StringSource;
        rel?: StringSource;
        media?: StringSource;
        as?: StringSource;
        disabled?: StringSource;
        type?: StringSource;
    }
    export class Link extends AurumElement {
        node: HTMLLinkElement;
        constructor(props: LinkProps);
    }
}
declare module "nodes/nav" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface NavProps extends AurumElementProps {
        onAttach?: Callback<Nav>;
        onDetach?: Callback<Nav>;
        onCreate?: Callback<Nav>;
        onDispose?: Callback<Nav>;
    }
    export class Nav extends AurumElement {
        constructor(props: NavProps);
    }
}
declare module "nodes/noscript" {
    import { Callback } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface NoScriptProps extends AurumElementProps {
        onAttach?: Callback<NoScript>;
        onDetach?: Callback<NoScript>;
        onCreate?: Callback<NoScript>;
        onDispose?: Callback<NoScript>;
    }
    export class NoScript extends AurumElement {
        constructor(props: NoScriptProps);
    }
}
declare module "nodes/ol" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface OlProps extends AurumElementProps {
        onAttach?: Callback<Ol>;
        onDetach?: Callback<Ol>;
        onCreate?: Callback<Ol>;
        onDispose?: Callback<Ol>;
    }
    export class Ol extends AurumElement {
        node: HTMLOListElement;
        constructor(props: OlProps);
    }
}
declare module "nodes/option" {
    import { Callback } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface OptionProps extends AurumElementProps {
        onAttach?: Callback<Option>;
        onDetach?: Callback<Option>;
        onCreate?: Callback<Option>;
        onDispose?: Callback<Option>;
    }
    export class Option extends AurumElement {
        readonly node: HTMLOptionElement;
        constructor(props: OptionProps);
    }
}
declare module "nodes/p" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface PProps extends AurumElementProps {
        onAttach?: Callback<P>;
        onDetach?: Callback<P>;
        onCreate?: Callback<P>;
        onDispose?: Callback<P>;
    }
    export class P extends AurumElement {
        node: HTMLParagraphElement;
        constructor(props: PProps);
    }
}
declare module "nodes/pre" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface PreProps extends AurumElementProps {
        onAttach?: Callback<Pre>;
        onDetach?: Callback<Pre>;
        onCreate?: Callback<Pre>;
        onDispose?: Callback<Pre>;
    }
    export class Pre extends AurumElement {
        node: HTMLPreElement;
        constructor(props: PreProps);
    }
}
declare module "nodes/progress" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface ProgressProps extends AurumElementProps {
        onAttach?: Callback<Progress>;
        onDetach?: Callback<Progress>;
        onCreate?: Callback<Progress>;
        onDispose?: Callback<Progress>;
        max?: StringSource;
        value?: StringSource;
    }
    export class Progress extends AurumElement {
        node: HTMLProgressElement;
        constructor(props: ProgressProps);
    }
}
declare module "nodes/q" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface QProps extends AurumElementProps {
        onAttach?: Callback<Q>;
        onDetach?: Callback<Q>;
        onCreate?: Callback<Q>;
        onDispose?: Callback<Q>;
    }
    export class Q extends AurumElement {
        node: HTMLQuoteElement;
        constructor(props: QProps);
    }
}
declare module "nodes/script" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { StringSource, Callback } from "utilities/common";
    export interface ScriptProps extends AurumElementProps {
        onAttach?: Callback<Script>;
        onDetach?: Callback<Script>;
        onCreate?: Callback<Script>;
        onDispose?: Callback<Script>;
        src?: StringSource;
        async?: StringSource;
        defer?: StringSource;
        integrity?: StringSource;
        noModule?: StringSource;
        type?: StringSource;
    }
    export class Script extends AurumElement {
        node: HTMLScriptElement;
        constructor(props: ScriptProps);
    }
}
declare module "nodes/select" {
    import { Callback } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface SelectProps extends AurumElementProps {
        onAttach?: Callback<Select>;
        onDetach?: Callback<Select>;
        onCreate?: Callback<Select>;
        onDispose?: Callback<Select>;
    }
    export class Select extends AurumElement {
        readonly node: HTMLSelectElement;
        constructor(props: SelectProps);
    }
}
declare module "nodes/source" {
    import { Callback, StringSource } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface SourceProps extends AurumElementProps {
        onAttach?: Callback<Source>;
        onDetach?: Callback<Source>;
        onCreate?: Callback<Source>;
        onDispose?: Callback<Source>;
        src?: StringSource;
        srcSet?: StringSource;
        media?: StringSource;
        sizes?: StringSource;
        type?: StringSource;
    }
    export class Source extends AurumElement {
        readonly node: HTMLSourceElement;
        constructor(props: SourceProps);
    }
}
declare module "nodes/span" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface SpanProps extends AurumElementProps {
        onAttach?: Callback<Span>;
        onDetach?: Callback<Span>;
        onCreate?: Callback<Span>;
        onDispose?: Callback<Span>;
    }
    export class Span extends AurumElement {
        node: HTMLSpanElement;
        constructor(props: SpanProps);
    }
}
declare module "nodes/sub" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface SubProps extends AurumElementProps {
        onAttach?: Callback<Sub>;
        onDetach?: Callback<Sub>;
        onCreate?: Callback<Sub>;
        onDispose?: Callback<Sub>;
    }
    export class Sub extends AurumElement {
        constructor(props: SubProps);
    }
}
declare module "nodes/summary" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface SummaryProps extends AurumElementProps {
        onAttach?: Callback<Summary>;
        onDetach?: Callback<Summary>;
        onCreate?: Callback<Summary>;
        onDispose?: Callback<Summary>;
    }
    export class Summary extends AurumElement {
        constructor(props: SummaryProps);
    }
}
declare module "nodes/sup" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface SupProps extends AurumElementProps {
        onAttach?: Callback<Sup>;
        onDetach?: Callback<Sup>;
        onCreate?: Callback<Sup>;
        onDispose?: Callback<Sup>;
    }
    export class Sup extends AurumElement {
        constructor(props: SupProps);
    }
}
declare module "nodes/svg" {
    import { Callback, StringSource } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface SvgProps extends AurumElementProps {
        onAttach?: Callback<Svg>;
        onDetach?: Callback<Svg>;
        onCreate?: Callback<Svg>;
        onDispose?: Callback<Svg>;
        width?: StringSource;
        height?: StringSource;
    }
    export class Svg extends AurumElement {
        constructor(props: SvgProps);
    }
}
declare module "nodes/table" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface TableProps extends AurumElementProps {
        onAttach?: Callback<Table>;
        onDetach?: Callback<Table>;
        onCreate?: Callback<Table>;
        onDispose?: Callback<Table>;
    }
    export class Table extends AurumElement {
        node: HTMLTableElement;
        constructor(props: TableProps);
    }
}
declare module "nodes/tbody" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface TbodyProps extends AurumElementProps {
        onAttach?: Callback<Tbody>;
        onDetach?: Callback<Tbody>;
        onCreate?: Callback<Tbody>;
        onDispose?: Callback<Tbody>;
    }
    export class Tbody extends AurumElement {
        constructor(props: TbodyProps);
    }
}
declare module "nodes/td" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface TdProps extends AurumElementProps {
        onAttach?: Callback<Td>;
        onDetach?: Callback<Td>;
        onCreate?: Callback<Td>;
        onDispose?: Callback<Td>;
    }
    export class Td extends AurumElement {
        node: HTMLTableColElement;
        constructor(props: TdProps);
    }
}
declare module "nodes/textarea" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { DataSource } from "stream/data_source";
    import { DataDrain, StringSource, Callback } from "utilities/common";
    export interface TextAreaProps extends AurumElementProps {
        onAttach?: Callback<TextArea>;
        onDetach?: Callback<TextArea>;
        onCreate?: Callback<TextArea>;
        onDispose?: Callback<TextArea>;
        placeholder?: StringSource;
        readonly?: StringSource;
        disabled?: StringSource;
        onChange?: DataDrain<InputEvent>;
        onInput?: DataDrain<InputEvent>;
        inputValueSource?: DataSource<string>;
        initialValue?: string;
        rows?: StringSource;
        wrap?: StringSource;
        autocomplete?: StringSource;
        autofocus?: StringSource;
        max?: StringSource;
        maxLength?: StringSource;
        min?: StringSource;
        minLength?: StringSource;
        required?: StringSource;
        type?: StringSource;
    }
    export class TextArea extends AurumElement {
        node: HTMLTextAreaElement;
        onChange: DataSource<InputEvent>;
        onInput: DataSource<InputEvent>;
        constructor(props: TextAreaProps);
    }
}
declare module "nodes/tfoot" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface TfootProps extends AurumElementProps {
        onAttach?: Callback<Tfoot>;
        onDetach?: Callback<Tfoot>;
        onCreate?: Callback<Tfoot>;
        onDispose?: Callback<Tfoot>;
    }
    export class Tfoot extends AurumElement {
        constructor(props: TfootProps);
    }
}
declare module "nodes/th" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface ThProps extends AurumElementProps {
        onAttach?: Callback<Th>;
        onDetach?: Callback<Th>;
        onCreate?: Callback<Th>;
        onDispose?: Callback<Th>;
    }
    export class Th extends AurumElement {
        node: HTMLTableHeaderCellElement;
        constructor(props: ThProps);
    }
}
declare module "nodes/thead" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface TheadProps extends AurumElementProps {
        onAttach?: Callback<Thead>;
        onDetach?: Callback<Thead>;
        onCreate?: Callback<Thead>;
        onDispose?: Callback<Thead>;
    }
    export class Thead extends AurumElement {
        constructor(props: TheadProps);
    }
}
declare module "nodes/time" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback, StringSource } from "utilities/common";
    export interface TimeProps extends AurumElementProps {
        onAttach?: Callback<Time>;
        onDetach?: Callback<Time>;
        onCreate?: Callback<Time>;
        onDispose?: Callback<Time>;
        datetime?: StringSource;
    }
    export class Time extends AurumElement {
        node: HTMLTimeElement;
        constructor(props: TimeProps);
    }
}
declare module "nodes/title" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface TitleProps extends AurumElementProps {
        onAttach?: Callback<Title>;
        onDetach?: Callback<Title>;
        onCreate?: Callback<Title>;
        onDispose?: Callback<Title>;
    }
    export class Title extends AurumElement {
        node: HTMLTitleElement;
        constructor(props: TitleProps);
    }
}
declare module "nodes/tr" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface TrProps extends AurumElementProps {
        onAttach?: Callback<Tr>;
        onDetach?: Callback<Tr>;
        onCreate?: Callback<Tr>;
        onDispose?: Callback<Tr>;
    }
    export class Tr extends AurumElement {
        node: HTMLTableRowElement;
        constructor(props: TrProps);
    }
}
declare module "nodes/ul" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface UlProps extends AurumElementProps {
        onAttach?: Callback<Ul>;
        onDetach?: Callback<Ul>;
        onCreate?: Callback<Ul>;
        onDispose?: Callback<Ul>;
    }
    export class Ul extends AurumElement {
        node: HTMLUListElement;
        constructor(props: UlProps);
    }
}
declare module "nodes/video" {
    import { Callback, StringSource } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface VideoProps extends AurumElementProps {
        onAttach?: Callback<Video>;
        onDetach?: Callback<Video>;
        onCreate?: Callback<Video>;
        onDispose?: Callback<Video>;
        controls?: StringSource;
        autoplay?: StringSource;
        loop?: StringSource;
        muted?: StringSource;
        preload?: StringSource;
        src?: StringSource;
        poster?: StringSource;
        width?: StringSource;
        height?: StringSource;
    }
    export class Video extends AurumElement {
        readonly node: HTMLVideoElement;
        constructor(props: VideoProps);
    }
}
declare module "nodes/style" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback, StringSource } from "utilities/common";
    export interface StyleProps extends AurumElementProps {
        onAttach?: Callback<Style>;
        onDetach?: Callback<Style>;
        onCreate?: Callback<Style>;
        onDispose?: Callback<Style>;
        media?: StringSource;
    }
    export class Style extends AurumElement {
        node: HTMLStyleElement;
        constructor(props: StyleProps);
    }
}
declare module "nodes/special/switch" {
    import { AurumElement, AurumElementProps, Template } from "nodes/aurum_element";
    import { MapLike } from "utilities/common";
    import { DataSource } from "stream/data_source";
    export interface SwitchProps<T = boolean> extends AurumElementProps {
        state: DataSource<T>;
        templateMap?: MapLike<Template<void>>;
        template?: Template<void>;
    }
    export class Switch<T = boolean> extends AurumElement {
        private lastValue;
        private firstRender;
        templateMap: MapLike<Template<void>>;
        template: Template<void>;
        constructor(props: SwitchProps<T>);
        protected renderSwitch(data: T): void;
    }
}
declare module "nodes/special/router" {
    import { Switch } from "nodes/special/switch";
    import { AurumElementProps } from "nodes/aurum_element";
    export interface AurumRouterProps extends AurumElementProps {
    }
    export class AurumRouter extends Switch<string> {
        constructor(props: AurumRouterProps);
    }
}
declare module "nodes/special/suspense" {
    import { AurumElement, AurumElementProps, Template } from "nodes/aurum_element";
    import { MapLike, Provider } from "utilities/common";
    export interface SuspenseProps<T = boolean> extends AurumElementProps {
        loader: Provider<Promise<AurumElement>>;
    }
    export class Suspense<T = boolean> extends AurumElement {
        templateMap: MapLike<Template<void>>;
        template: Template<void>;
        constructor(props: SuspenseProps<T>);
    }
}
declare module "utilities/aurum" {
    import { AurumElement } from "nodes/aurum_element";
    import { Constructor, MapLike } from "utilities/common";
    export class Aurum {
        static attach(aurumElement: AurumElement, dom: HTMLElement): void;
        static detach(domNode: HTMLElement): void;
        static factory(node: Constructor<AurumElement> | ((...args: any[]) => AurumElement), args: MapLike<any>, ...innerNodes: AurumElement[]): AurumElement;
    }
}
declare module "aurumjs" {
    import { AProps } from "nodes/a";
    import { AbbrProps } from "nodes/abbr";
    import { AreaProps } from "nodes/area";
    import { ArticleProps } from "nodes/article";
    import { AsideProps } from "nodes/aside";
    import { AudioProps } from "nodes/audio";
    import { TemplateProps } from "nodes/aurum_element";
    import { BProps } from "nodes/b";
    import { BrProps } from "nodes/br";
    import { ButtonProps } from "nodes/button";
    import { CanvasProps } from "nodes/canvas";
    import { DataProps } from "nodes/data";
    import { DetailsProps } from "nodes/details";
    import { DivProps } from "nodes/div";
    import { EmProps } from "nodes/em";
    import { FooterProps } from "nodes/footer";
    import { FormProps } from "nodes/form";
    import { H1Props } from "nodes/h1";
    import { H2Props } from "nodes/h2";
    import { H3Props } from "nodes/h3";
    import { H4Props } from "nodes/h4";
    import { H5Props } from "nodes/h5";
    import { H6Props } from "nodes/h6";
    import { HeaderProps } from "nodes/header";
    import { HeadingProps } from "nodes/heading";
    import { IProps } from "nodes/i";
    import { IFrameProps } from "nodes/iframe";
    import { ImgProps } from "nodes/img";
    import { InputProps } from "nodes/input";
    import { LabelProps } from "nodes/label";
    import { LiProps } from "nodes/li";
    import { LinkProps } from "nodes/link";
    import { NavProps } from "nodes/nav";
    import { NoScriptProps } from "nodes/noscript";
    import { OlProps } from "nodes/ol";
    import { OptionProps } from "nodes/option";
    import { PProps } from "nodes/p";
    import { PreProps } from "nodes/pre";
    import { ProgressProps } from "nodes/progress";
    import { QProps } from "nodes/q";
    import { ScriptProps } from "nodes/script";
    import { SelectProps } from "nodes/select";
    import { SourceProps } from "nodes/source";
    import { SpanProps } from "nodes/span";
    import { SubProps } from "nodes/sub";
    import { SummaryProps } from "nodes/summary";
    import { SupProps } from "nodes/sup";
    import { SvgProps } from "nodes/svg";
    import { TableProps } from "nodes/table";
    import { TbodyProps } from "nodes/tbody";
    import { TdProps } from "nodes/td";
    import { TextAreaProps } from "nodes/textarea";
    import { TfootProps } from "nodes/tfoot";
    import { ThProps } from "nodes/th";
    import { TheadProps } from "nodes/thead";
    import { TimeProps } from "nodes/time";
    import { TitleProps } from "nodes/title";
    import { TrProps } from "nodes/tr";
    import { UlProps } from "nodes/ul";
    import { VideoProps } from "nodes/video";
    import { StyleProps } from "nodes/style";
    export * from "nodes/a";
    export * from "nodes/abbr";
    export * from "nodes/area";
    export * from "nodes/article";
    export * from "nodes/aside";
    export * from "nodes/audio";
    export * from "nodes/aurum_element";
    export * from "nodes/b";
    export * from "nodes/br";
    export * from "nodes/button";
    export * from "nodes/canvas";
    export * from "nodes/data";
    export * from "nodes/details";
    export * from "nodes/div";
    export * from "nodes/em";
    export * from "nodes/footer";
    export * from "nodes/form";
    export * from "nodes/h1";
    export * from "nodes/h2";
    export * from "nodes/h3";
    export * from "nodes/h4";
    export * from "nodes/h5";
    export * from "nodes/h6";
    export * from "nodes/header";
    export * from "nodes/heading";
    export * from "nodes/i";
    export * from "nodes/iframe";
    export * from "nodes/img";
    export * from "nodes/input";
    export * from "nodes/label";
    export * from "nodes/li";
    export * from "nodes/link";
    export * from "nodes/nav";
    export * from "nodes/noscript";
    export * from "nodes/ol";
    export * from "nodes/option";
    export * from "nodes/p";
    export * from "nodes/pre";
    export * from "nodes/progress";
    export * from "nodes/q";
    export * from "nodes/script";
    export * from "nodes/select";
    export * from "nodes/source";
    export * from "nodes/span";
    export * from "nodes/special/router";
    export * from "nodes/special/suspense";
    export * from "nodes/special/switch";
    export * from "nodes/style";
    export * from "nodes/sub";
    export * from "nodes/summary";
    export * from "nodes/sup";
    export * from "nodes/svg";
    export * from "nodes/table";
    export * from "nodes/tbody";
    export * from "nodes/td";
    export * from "nodes/textarea";
    export * from "nodes/tfoot";
    export * from "nodes/th";
    export * from "nodes/thead";
    export * from "nodes/time";
    export * from "nodes/title";
    export * from "nodes/tr";
    export * from "nodes/ul";
    export * from "nodes/video";
    export * from "stream/data_source";
    export * from "stream/event_emitter";
    export * from "utilities/aurum";
    export * from "utilities/cancellation_token";
    global {
        namespace JSX {
            interface IntrinsicElements {
                button: ButtonProps;
                div: DivProps;
                input: InputProps;
                li: LiProps;
                span: SpanProps;
                style: StyleProps;
                ul: UlProps;
                p: PProps;
                img: ImgProps;
                link: LinkProps;
                canvas: CanvasProps;
                a: AProps;
                article: ArticleProps;
                br: BrProps;
                form: FormProps;
                label: LabelProps;
                ol: OlProps;
                pre: PreProps;
                progress: ProgressProps;
                table: TableProps;
                td: TdProps;
                tr: TrProps;
                th: ThProps;
                textarea: TextAreaProps;
                h1: H1Props;
                h2: H2Props;
                h3: H3Props;
                h4: H4Props;
                h5: H5Props;
                h6: H6Props;
                header: HeaderProps;
                footer: FooterProps;
                nav: NavProps;
                b: BProps;
                i: IProps;
                script: ScriptProps;
                abbr: AbbrProps;
                area: AreaProps;
                aside: AsideProps;
                audio: AudioProps;
                em: EmProps;
                heading: HeadingProps;
                iframe: IFrameProps;
                noscript: NoScriptProps;
                option: OptionProps;
                q: QProps;
                select: SelectProps;
                source: SourceProps;
                title: TitleProps;
                video: VideoProps;
                tbody: TbodyProps;
                tfoot: TfootProps;
                thead: TheadProps;
                summary: SummaryProps;
                details: DetailsProps;
                sub: SubProps;
                sup: SupProps;
                svg: SvgProps;
                data: DataProps;
                time: TimeProps;
                template: TemplateProps<any>;
            }
        }
    }
}
declare module "nodes/address" {
    import { Callback } from "utilities/common";
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface AddressProps extends AurumElementProps {
        onAttach?: Callback<Address>;
        onDetach?: Callback<Address>;
        onCreate?: Callback<Address>;
        onDispose?: Callback<Address>;
    }
    export class Address extends AurumElement {
        constructor(props: AddressProps);
    }
}
declare module "nodes/hr" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Callback } from "utilities/common";
    export interface HrProps extends AurumElementProps {
        onAttach?: Callback<Hr>;
        onDetach?: Callback<Hr>;
        onCreate?: Callback<Hr>;
        onDispose?: Callback<Hr>;
    }
    export class Hr extends AurumElement {
        readonly node: HTMLHRElement;
        constructor(props: HrProps);
    }
}
declare module "nodes/special/custom" {
    import { AurumElement, AurumElementProps } from "aurumjs";
    import { Callback, MapLike, StringSource } from "utilities/common";
    export interface CustomProps<T extends HTMLElement> extends AurumElementProps {
        onAttach?: Callback<Custom<T>>;
        onDetach?: Callback<Custom<T>>;
        onCreate?: Callback<Custom<T>>;
        onDispose?: Callback<Custom<T>>;
        attributes?: MapLike<StringSource>;
        tag: string;
    }
    export class Custom<T extends HTMLElement> extends AurumElement {
        readonly node: T;
        constructor(props: CustomProps<T>);
    }
}
//# sourceMappingURL=aurum.d.ts.map