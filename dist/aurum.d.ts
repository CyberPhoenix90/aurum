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
declare module "stream/data_source" {
    import { CancellationToken } from "utilities/cancellation_token";
    import { Callback } from "utilities/common";
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
        reduce(reducer: (p: T, c: T) => T, cancellationToken?: CancellationToken): DataSource<T>;
        combine<D, E>(otherSource: DataSource<D>, combinator: (self: T, other: D) => E, cancellationToken?: CancellationToken): DataSource<E>;
        pick(key: keyof T, cancellationToken?: CancellationToken): DataSource<T[typeof key]>;
        cancelAll(): void;
    }
}
declare module "utilities/common" {
    import { DataSource } from "stream/data_source";
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
declare module "nodes/template" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
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
        create(props: TemplateProps<T>): HTMLElement;
    }
}
declare module "nodes/aurum_element" {
    import { DataSource } from "stream/data_source";
    import { CancellationToken } from "utilities/cancellation_token";
    import { DataDrain } from "utilities/common";
    export type StringSource = string | DataSource<string>;
    export type ClassType = string | DataSource<string> | DataSource<string[]> | Array<string | DataSource<string>>;
    export interface AurumElementProps {
        id?: StringSource;
        class?: ClassType;
        onClick?: DataDrain<MouseEvent>;
        onAttach?: (node: AurumElement) => void;
    }
    export abstract class AurumElement {
        node: HTMLElement;
        protected cancellationToken: CancellationToken;
        onClick: DataSource<MouseEvent>;
        constructor(props: AurumElementProps);
        private handleProps;
        protected handleStringSource(data: StringSource, key: string): void;
        private handleClass;
        abstract create(props: AurumElementProps): HTMLElement;
        protected getChildIndex(node: HTMLElement): number;
        protected hasChild(node: HTMLElement): boolean;
        setInnerText(value: string): void;
        swapChildren(indexA: number, indexB: number): void;
        protected addDomNodeAt(node: HTMLElement, index: number): void;
        addChildAt(child: AurumElement, index: number): void;
        addChildren(nodes: AurumElement[]): void;
    }
}
declare module "jsx/jsx_factory" {
    import { MapLike, Constructor } from "utilities/common";
    import { AurumElement } from "nodes/aurum_element";
    class TypescriptXMLSyntax {
        deserialize(node: Constructor<AurumElement> | ((...args: any[]) => AurumElement), args: MapLike<any>, ...innerNodes: AurumElement[]): AurumElement;
    }
    export const tsx: TypescriptXMLSyntax;
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
declare module "stream/array_data_source" {
    import { EventEmitter } from "stream/event_emitter";
    import { DataSource } from "stream/data_source";
    import { CancellationToken } from "utilities/cancellation_token";
    import { Predicate } from "utilities/common";
    export interface CollectionChange<T> {
        operation: 'replace' | 'append' | 'prepend' | 'removeLeft' | 'removeRight' | 'remove';
        count: number;
        index: number;
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
declare module "utilities/aurum" {
    import { AurumElement } from "nodes/aurum_element";
    export class Aurum {
        static attach(node: AurumElement, dom: HTMLElement): void;
        static detach(domNode: HTMLElement): void;
    }
}
declare module "nodes/button" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface ButtonProps extends AurumElementProps {
    }
    export class Button extends AurumElement {
        constructor(props: ButtonProps);
        create(props: ButtonProps): HTMLElement;
    }
}
declare module "nodes/div" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface DivProps extends AurumElementProps {
    }
    export class Div extends AurumElement {
        constructor(props: DivProps);
        create(props: DivProps): HTMLElement;
    }
}
declare module "nodes/input" {
    import { AurumElement, AurumElementProps, StringSource } from "nodes/aurum_element";
    import { DataSource } from "stream/data_source";
    import { DataDrain } from "utilities/common";
    export interface InputProps extends AurumElementProps {
        onAttach?: (node: Input) => void;
        placeholder?: StringSource;
        onChange?: DataDrain<InputEvent>;
        onInput?: DataDrain<InputEvent>;
        onKeyDown?: DataDrain<KeyboardEvent>;
        inputValueSource?: DataSource<string>;
    }
    export class Input extends AurumElement {
        node: HTMLInputElement;
        onKeyDown: DataSource<KeyboardEvent>;
        onChange: DataSource<InputEvent>;
        onInput: DataSource<InputEvent>;
        onFocus: DataSource<FocusEvent>;
        onBlur: DataSource<FocusEvent>;
        constructor(props: InputProps);
        create(props: InputProps): HTMLElement;
    }
}
declare module "nodes/li" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface LiProps extends AurumElementProps {
    }
    export class Li extends AurumElement {
        constructor(props: LiProps);
        create(props: LiProps): HTMLElement;
    }
}
declare module "nodes/span" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface SpanProps extends AurumElementProps {
    }
    export class Span extends AurumElement {
        constructor(props: SpanProps);
        create(props: SpanProps): HTMLElement;
    }
}
declare module "nodes/style" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    export interface StyleProps extends AurumElementProps {
    }
    export class Style extends AurumElement {
        constructor(props: StyleProps);
        create(props: StyleProps): HTMLElement;
    }
}
declare module "nodes/ul" {
    import { AurumElement, AurumElementProps } from "nodes/aurum_element";
    import { Template } from "nodes/template";
    import { ArrayDataSource } from "stream/array_data_source";
    export interface UlProps<T> extends AurumElementProps {
        onAttach?: (node: Ul) => void;
        templateDataSource?: ArrayDataSource<T> | T[];
        template?: Template<T>;
    }
    export class Ul<T = void> extends AurumElement {
        node: HTMLInputElement;
        template: Template<T>;
        data: ArrayDataSource<T>;
        private rerenderPending;
        private cachedChildren;
        constructor(props: UlProps<T>);
        private handleData;
        render(): void;
        create(props: UlProps<T>): HTMLElement;
    }
}
declare module "index" {
    export * from "jsx/jsx_factory";
    export * from "stream/array_data_source";
    export * from "stream/data_source";
    export * from "stream/event_emitter";
    export * from "utilities/cancellation_token";
    export * from "utilities/aurum";
    export * from "nodes/aurum_element";
    export * from "nodes/button";
    export * from "nodes/div";
    export * from "nodes/input";
    export * from "nodes/li";
    export * from "nodes/span";
    export * from "nodes/style";
    export * from "nodes/template";
    export * from "nodes/ul";
}
//# sourceMappingURL=aurum.d.ts.map