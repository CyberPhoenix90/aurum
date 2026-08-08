/** A stable identity used by the compat reconciler. */
export type Key = string | number | bigint | symbol;

export type ReactText = string | number | bigint;

export interface ReactNodeArray extends ReadonlyArray<ReactNode> {}

/** Values accepted as JSX children. Booleans and nullish values render nothing. */
export type ReactNode = CompatElement | ReactText | ReactNodeArray | Iterable<ReactNode> | boolean | null | undefined;

export type PropsWithChildren<P = unknown> = P & { children?: ReactNode };
export type PropsWithoutRef<P> = 'ref' extends keyof P ? Omit<P, 'ref'> : P;
export type PropsWithRef<P> = P;

export type JSXElementConstructor<P> = (props: P) => ReactNode;
export type ComponentType<P = {}> = JSXElementConstructor<P>;
export type FunctionComponent<P = {}> = JSXElementConstructor<P>;
export type FC<P = {}> = FunctionComponent<P>;

export interface CompatElement<P = any, T = any> {
    readonly type: T;
    readonly key: Key | null;
    readonly ref: Ref<any> | null;
    readonly props: P;
}

export type SetStateAction<S> = S | ((previousState: S) => S);
export type Dispatch<A> = (value: A) => void;

export interface RefObject<T> {
    current: T;
}

export interface MutableRefObject<T> extends RefObject<T> {}

export type RefCallback<T> = (instance: T | null) => void | (() => void);
export type Ref<T> = RefCallback<T> | RefObject<T | null> | null;
export type ForwardedRef<T> = Ref<T>;

export interface RefAttributes<T> {
    ref?: Ref<T>;
}

export interface Attributes {
    key?: Key | null;
}

export interface ClassAttributes<T> extends RefAttributes<T> {}

export type DependencyList = readonly unknown[];
export type EffectCallback = () => void | (() => void);

type SyntheticFields<T, E extends globalThis.Event> = {
    readonly nativeEvent: E;
    readonly currentTarget: EventTarget & T;
    readonly target: EventTarget & T;
    isDefaultPrevented(): boolean;
    isPropagationStopped(): boolean;
    persist(): void;
};

/**
 * Compat event types retain the native browser event fields and add the small
 * React-shaped surface commonly used by migrated components.
 */
export type SyntheticEvent<T = Element, E extends globalThis.Event = globalThis.Event> = E & SyntheticFields<T, E>;
export type ClipboardEvent<T = Element> = SyntheticEvent<T, globalThis.ClipboardEvent>;
export type CompositionEvent<T = Element> = SyntheticEvent<T, globalThis.CompositionEvent>;
export type DragEvent<T = Element> = SyntheticEvent<T, globalThis.DragEvent> & { readonly dataTransfer: DataTransfer };
export type FocusEvent<T = Element> = SyntheticEvent<T, globalThis.FocusEvent>;
export type FormEvent<T = Element> = SyntheticEvent<T, globalThis.Event>;
export type ChangeEvent<T = Element> = SyntheticEvent<T, globalThis.Event> & { readonly target: EventTarget & T };
export type InputEvent<T = Element> = SyntheticEvent<T, globalThis.InputEvent>;
export type KeyboardEvent<T = Element> = SyntheticEvent<T, globalThis.KeyboardEvent>;
export type MouseEvent<T = Element, E extends globalThis.MouseEvent = globalThis.MouseEvent> = SyntheticEvent<T, E>;
export type PointerEvent<T = Element> = SyntheticEvent<T, globalThis.PointerEvent>;
export type TouchEvent<T = Element> = SyntheticEvent<T, globalThis.TouchEvent>;
export type TransitionEvent<T = Element> = SyntheticEvent<T, globalThis.TransitionEvent>;
export type AnimationEvent<T = Element> = SyntheticEvent<T, globalThis.AnimationEvent>;
export type UIEvent<T = Element> = SyntheticEvent<T, globalThis.UIEvent>;
export type WheelEvent<T = Element> = SyntheticEvent<T, globalThis.WheelEvent>;

export type EventHandler<E extends SyntheticEvent<any>> = { bivarianceHack(event: E): void }['bivarianceHack'];
export type ClipboardEventHandler<T = Element> = EventHandler<ClipboardEvent<T>>;
export type CompositionEventHandler<T = Element> = EventHandler<CompositionEvent<T>>;
export type DragEventHandler<T = Element> = EventHandler<DragEvent<T>>;
export type FocusEventHandler<T = Element> = EventHandler<FocusEvent<T>>;
export type FormEventHandler<T = Element> = EventHandler<FormEvent<T>>;
export type ChangeEventHandler<T = Element> = EventHandler<ChangeEvent<T>>;
export type KeyboardEventHandler<T = Element> = EventHandler<KeyboardEvent<T>>;
export type MouseEventHandler<T = Element> = EventHandler<MouseEvent<T>>;
export type PointerEventHandler<T = Element> = EventHandler<PointerEvent<T>>;
export type TouchEventHandler<T = Element> = EventHandler<TouchEvent<T>>;
export type UIEventHandler<T = Element> = EventHandler<UIEvent<T>>;
export type WheelEventHandler<T = Element> = EventHandler<WheelEvent<T>>;

export interface DOMAttributes<T> {
    children?: ReactNode;
    dangerouslySetInnerHTML?: { __html: string | TrustedHTML };
    onCopy?: ClipboardEventHandler<T>;
    onCut?: ClipboardEventHandler<T>;
    onPaste?: ClipboardEventHandler<T>;
    onCompositionEnd?: CompositionEventHandler<T>;
    onCompositionStart?: CompositionEventHandler<T>;
    onCompositionUpdate?: CompositionEventHandler<T>;
    onFocus?: FocusEventHandler<T>;
    onBlur?: FocusEventHandler<T>;
    onChange?: ChangeEventHandler<T>;
    onBeforeInput?: FormEventHandler<T>;
    onInput?: FormEventHandler<T>;
    onReset?: FormEventHandler<T>;
    onSubmit?: FormEventHandler<T>;
    onInvalid?: FormEventHandler<T>;
    onLoad?: EventHandler<SyntheticEvent<T>>;
    onError?: EventHandler<SyntheticEvent<T>>;
    onKeyDown?: KeyboardEventHandler<T>;
    onKeyPress?: KeyboardEventHandler<T>;
    onKeyUp?: KeyboardEventHandler<T>;
    onAuxClick?: MouseEventHandler<T>;
    onClick?: MouseEventHandler<T>;
    onContextMenu?: MouseEventHandler<T>;
    onDoubleClick?: MouseEventHandler<T>;
    onDblClick?: MouseEventHandler<T>;
    onDrag?: DragEventHandler<T>;
    onDragEnd?: DragEventHandler<T>;
    onDragEnter?: DragEventHandler<T>;
    onDragExit?: DragEventHandler<T>;
    onDragLeave?: DragEventHandler<T>;
    onDragOver?: DragEventHandler<T>;
    onDragStart?: DragEventHandler<T>;
    onDrop?: DragEventHandler<T>;
    onMouseDown?: MouseEventHandler<T>;
    onMouseEnter?: MouseEventHandler<T>;
    onMouseLeave?: MouseEventHandler<T>;
    onMouseMove?: MouseEventHandler<T>;
    onMouseOut?: MouseEventHandler<T>;
    onMouseOver?: MouseEventHandler<T>;
    onMouseUp?: MouseEventHandler<T>;
    onPointerCancel?: PointerEventHandler<T>;
    onPointerDown?: PointerEventHandler<T>;
    onPointerEnter?: PointerEventHandler<T>;
    onPointerLeave?: PointerEventHandler<T>;
    onPointerMove?: PointerEventHandler<T>;
    onPointerOut?: PointerEventHandler<T>;
    onPointerOver?: PointerEventHandler<T>;
    onPointerUp?: PointerEventHandler<T>;
    onScroll?: UIEventHandler<T>;
    onTouchCancel?: TouchEventHandler<T>;
    onTouchEnd?: TouchEventHandler<T>;
    onTouchMove?: TouchEventHandler<T>;
    onTouchStart?: TouchEventHandler<T>;
    onWheel?: WheelEventHandler<T>;
    onAnimationStart?: EventHandler<AnimationEvent<T>>;
    onAnimationEnd?: EventHandler<AnimationEvent<T>>;
    onAnimationIteration?: EventHandler<AnimationEvent<T>>;
    onTransitionEnd?: EventHandler<TransitionEvent<T>>;
    onCopyCapture?: ClipboardEventHandler<T>;
    onCutCapture?: ClipboardEventHandler<T>;
    onPasteCapture?: ClipboardEventHandler<T>;
    onFocusCapture?: FocusEventHandler<T>;
    onBlurCapture?: FocusEventHandler<T>;
    onChangeCapture?: ChangeEventHandler<T>;
    onBeforeInputCapture?: FormEventHandler<T>;
    onInputCapture?: FormEventHandler<T>;
    onResetCapture?: FormEventHandler<T>;
    onSubmitCapture?: FormEventHandler<T>;
    onKeyDownCapture?: KeyboardEventHandler<T>;
    onKeyPressCapture?: KeyboardEventHandler<T>;
    onKeyUpCapture?: KeyboardEventHandler<T>;
    onClickCapture?: MouseEventHandler<T>;
    onContextMenuCapture?: MouseEventHandler<T>;
    onDoubleClickCapture?: MouseEventHandler<T>;
    onMouseDownCapture?: MouseEventHandler<T>;
    onMouseMoveCapture?: MouseEventHandler<T>;
    onMouseUpCapture?: MouseEventHandler<T>;
    onPointerDownCapture?: PointerEventHandler<T>;
    onPointerMoveCapture?: PointerEventHandler<T>;
    onPointerUpCapture?: PointerEventHandler<T>;
    onScrollCapture?: UIEventHandler<T>;
    onWheelCapture?: WheelEventHandler<T>;
}

/** CSS object accepted by compat hosts. Numeric dimensional values receive px. */
export interface CSSProperties {
    [property: string]: string | number | null | undefined;
}

export interface HTMLAttributes<T> extends Attributes, ClassAttributes<T>, DOMAttributes<T> {
    className?: string;
    class?: string;
    style?: CSSProperties | string;
    id?: string;
    title?: string;
    role?: string;
    tabIndex?: number;
    hidden?: boolean;
    draggable?: boolean | 'true' | 'false';
    contentEditable?: boolean | 'true' | 'false' | 'inherit' | 'plaintext-only';
    suppressContentEditableWarning?: boolean;
    suppressHydrationWarning?: boolean;
    accessKey?: string;
    autoCapitalize?: string;
    autoFocus?: boolean;
    dir?: string;
    enterKeyHint?: string;
    inert?: boolean;
    inputMode?: string;
    lang?: string;
    nonce?: string;
    part?: string;
    slot?: string;
    spellCheck?: boolean | 'true' | 'false';
    translate?: 'yes' | 'no';
    [dataAttribute: `data-${string}`]: string | number | boolean | null | undefined;
    [ariaAttribute: `aria-${string}`]: string | number | boolean | null | undefined;
    [property: string]: unknown;
}

export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    accept?: string;
    alt?: string;
    autoComplete?: string;
    checked?: boolean;
    capture?: boolean | 'user' | 'environment';
    defaultChecked?: boolean;
    defaultValue?: string | number | readonly string[];
    disabled?: boolean;
    form?: string;
    list?: string;
    max?: number | string;
    maxLength?: number;
    min?: number | string;
    minLength?: number;
    multiple?: boolean;
    name?: string;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    step?: number | string;
    type?: string;
    value?: string | readonly string[] | number;
}

export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoComplete?: string;
    cols?: number;
    defaultValue?: string | number | readonly string[];
    disabled?: boolean;
    maxLength?: number;
    minLength?: number;
    name?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    rows?: number;
    value?: string | readonly string[] | number;
    wrap?: string;
}

export interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    autoComplete?: string;
    defaultValue?: string | number | readonly string[];
    disabled?: boolean;
    multiple?: boolean;
    name?: string;
    required?: boolean;
    size?: number;
    value?: string | number | readonly string[];
}

export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    name?: string;
    type?: 'submit' | 'reset' | 'button';
    value?: string | readonly string[] | number;
}

export interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    acceptCharset?: string;
    action?: string;
    autoComplete?: string;
    encType?: string;
    method?: string;
    name?: string;
    noValidate?: boolean;
    target?: string;
}

export interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
    download?: string | boolean;
    href?: string;
    hrefLang?: string;
    media?: string;
    ping?: string;
    referrerPolicy?: string;
    rel?: string;
    target?: string;
    type?: string;
}

export interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    htmlFor?: string;
}

export interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: string;
    crossOrigin?: 'anonymous' | 'use-credentials' | '';
    decoding?: 'async' | 'auto' | 'sync';
    height?: number | string;
    loading?: 'eager' | 'lazy';
    referrerPolicy?: string;
    sizes?: string;
    src?: string;
    srcSet?: string;
    useMap?: string;
    width?: number | string;
}

export interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: number | string;
    width?: number | string;
}

export interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoPlay?: boolean;
    controls?: boolean;
    crossOrigin?: 'anonymous' | 'use-credentials' | '';
    loop?: boolean;
    muted?: boolean;
    playsInline?: boolean;
    preload?: 'none' | 'metadata' | 'auto' | '';
    src?: string;
    onEnded?: EventHandler<SyntheticEvent<T>>;
    onPause?: EventHandler<SyntheticEvent<T>>;
    onPlay?: EventHandler<SyntheticEvent<T>>;
    onTimeUpdate?: EventHandler<SyntheticEvent<T>>;
}

export interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string;
    open?: boolean;
    onToggle?: EventHandler<SyntheticEvent<T>>;
}

export interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    label?: string;
    selected?: boolean;
    value?: string | readonly string[] | number;
}

export interface SVGAttributes<T> extends HTMLAttributes<T> {
    cx?: number | string;
    cy?: number | string;
    d?: string;
    fill?: string;
    fillRule?: 'nonzero' | 'evenodd' | 'inherit';
    focusable?: boolean | 'auto';
    height?: number | string;
    preserveAspectRatio?: string;
    r?: number | string;
    stroke?: string;
    strokeLinecap?: string;
    strokeLinejoin?: string;
    strokeWidth?: number | string;
    x1?: number | string;
    x2?: number | string;
    y1?: number | string;
    y2?: number | string;
    viewBox?: string;
    width?: number | string;
    xmlns?: string;
}

type HTMLPropsFor<K extends keyof HTMLElementTagNameMap> = K extends 'input'
    ? InputHTMLAttributes<HTMLElementTagNameMap[K]>
    : K extends 'textarea'
      ? TextareaHTMLAttributes<HTMLElementTagNameMap[K]>
      : K extends 'select'
        ? SelectHTMLAttributes<HTMLElementTagNameMap[K]>
        : K extends 'button'
          ? ButtonHTMLAttributes<HTMLElementTagNameMap[K]>
          : K extends 'form'
            ? FormHTMLAttributes<HTMLElementTagNameMap[K]>
            : K extends 'a'
              ? AnchorHTMLAttributes<HTMLElementTagNameMap[K]>
              : K extends 'label'
                ? LabelHTMLAttributes<HTMLElementTagNameMap[K]>
                : K extends 'img'
                  ? ImgHTMLAttributes<HTMLElementTagNameMap[K]>
                  : K extends 'canvas'
                    ? CanvasHTMLAttributes<HTMLElementTagNameMap[K]>
                    : K extends 'audio' | 'video'
                      ? MediaHTMLAttributes<HTMLElementTagNameMap[K]>
                      : K extends 'details'
                        ? DetailsHTMLAttributes<HTMLElementTagNameMap[K]>
                        : K extends 'option'
                          ? OptionHTMLAttributes<HTMLElementTagNameMap[K]>
                    : HTMLAttributes<HTMLElementTagNameMap[K]>;

type HTMLIntrinsicElements = { [K in keyof HTMLElementTagNameMap]: HTMLPropsFor<K> };
type SVGOnlyIntrinsicElements = {
    [K in Exclude<keyof SVGElementTagNameMap, keyof HTMLElementTagNameMap>]: SVGAttributes<SVGElementTagNameMap[K]>;
};

export namespace JSX {
    export type Element = CompatElement;
    export type ElementType = keyof IntrinsicElements | JSXElementConstructor<any>;
    export interface ElementChildrenAttribute {
        children: {};
    }
    export interface IntrinsicAttributes extends Attributes {}
    export interface IntrinsicClassAttributes<T> extends ClassAttributes<T> {}
    export interface IntrinsicElements extends HTMLIntrinsicElements, SVGOnlyIntrinsicElements {
        [elementName: string]: HTMLAttributes<any>;
    }
    export type LibraryManagedAttributes<C, P> = P;
}

export type ElementType = keyof JSX.IntrinsicElements | JSXElementConstructor<any>;
export type ComponentProps<T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>> = T extends JSXElementConstructor<infer P>
    ? P
    : T extends keyof JSX.IntrinsicElements
      ? JSX.IntrinsicElements[T]
      : {};

export type ComponentPropsWithRef<T extends ElementType> = ComponentProps<T>;
export type ComponentPropsWithoutRef<T extends ElementType> = PropsWithoutRef<ComponentProps<T>>;
export type ElementRef<T extends ElementType> = T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : T extends keyof SVGElementTagNameMap
      ? SVGElementTagNameMap[T]
      : never;

/**
 * React's declarations expose a global namespace, so migration code often has
 * unimported annotations such as `React.MouseEvent`. The compat namespace keeps
 * the mechanically-renamed `Aurum.*` form working without installing React's
 * declarations.
 */
declare global {
    namespace Aurum {
        type ReactNode = import('./types.js').ReactNode;
        type CSSProperties = import('./types.js').CSSProperties;
        type RefObject<T> = import('./types.js').RefObject<T>;
        type Dispatch<A> = import('./types.js').Dispatch<A>;
        type SetStateAction<S> = import('./types.js').SetStateAction<S>;
        type ComponentProps<T extends import('./types.js').ElementType> = import('./types.js').ComponentProps<T>;
        type ComponentPropsWithRef<T extends import('./types.js').ElementType> = import('./types.js').ComponentPropsWithRef<T>;
        type HTMLAttributes<T> = import('./types.js').HTMLAttributes<T>;
        type SyntheticEvent<T = Element, E extends globalThis.Event = globalThis.Event> = import('./types.js').SyntheticEvent<T, E>;
        type ChangeEvent<T = Element> = import('./types.js').ChangeEvent<T>;
        type FormEvent<T = Element> = import('./types.js').FormEvent<T>;
        type KeyboardEvent<T = Element> = import('./types.js').KeyboardEvent<T>;
        type MouseEvent<T = Element, E extends globalThis.MouseEvent = globalThis.MouseEvent> = import('./types.js').MouseEvent<T, E>;
        type DragEvent<T = Element> = import('./types.js').DragEvent<T>;
        type PointerEvent<T = Element> = import('./types.js').PointerEvent<T>;
        type WheelEvent<T = Element> = import('./types.js').WheelEvent<T>;
        type MouseEventHandler<T = Element> = import('./types.js').MouseEventHandler<T>;

        namespace JSX {
            type Element = import('./types.js').CompatElement;
        }
    }
}
