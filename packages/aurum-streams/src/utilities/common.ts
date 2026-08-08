import type { ArrayDataSource, MapDataSource, ReadOnlyDataSource } from '../stream/data_source.js';
import type { AurumStyleClass } from './styling.js';

export type AttributeValue =
    | number
    | string
    | boolean
    | ReadOnlyDataSource<string | undefined>
    | ReadOnlyDataSource<boolean>
    | ReadOnlyDataSource<number>;
export type ClassType =
    | string
    | AurumStyleClass
    | ReadOnlyDataSource<string | undefined>
    | ReadOnlyDataSource<string[]>
    | Array<string | AurumStyleClass | ReadOnlyDataSource<string>>
    | MapLike<boolean | ReadOnlyDataSource<boolean>>
    | MapDataSource<string, boolean>
    | ArrayDataSource<string>;
export type StyleType =
    | string
    | ReadOnlyDataSource<string>
    | Styles
    | ReadOnlyDataSource<Styles>
    | MapDataSource<keyof Styles, string | number>;
/**
 * Type alias for a generic calback taking a parameter and not returning anything
 */
export type Callback<T> = (data?: T) => void;
export type Delegate = () => void;
export type Predicate<T> = (data: T) => boolean;
export type Provider<T> = () => T;
export type Comparator<T1, T2> = (value1: T1, value2: T2) => boolean;
export type Constructor<T> = new (...args: any[]) => T;
export type MapLike<T> = { [key: string]: T };

export interface DataWriter<T> {
    write(value: T): void;
}

export interface DataPublisher<T> {
    publish(value: T): void;
}

/** A writable target always receives a value; unlike a general Callback its argument is not optional. */
export type DataDrain<T> = ((data: T) => void) | DataWriter<T>;

export function writeTo<T>(target: DataDrain<T>, value: T): void {
    if (typeof target === 'function') target(value);
    else target.write(value);
}

export function publishTo<T>(target: DataPublisher<T>, value: T): void {
    target.publish(value);
}
export declare type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

export interface Styles {
    accentColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    alignContent?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    alignItems?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    alignSelf?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    all?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animation?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animationDelay?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animationDirection?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animationDuration?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animationFillMode?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animationIterationCount?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animationName?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animationPlayState?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    animationTimingFunction?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    aspectRatio?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    backdropFilter?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backfaceVisibility?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    background?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundAttachment?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundBlendMode?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundClip?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundImage?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundOrigin?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundPosition?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundPositionX?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundPositionY?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundRepeat?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    backgroundSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    blockSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    border?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlock?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockEndColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockEndStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockEndWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockStartColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockStartStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockStartWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBlockWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBottom?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBottomColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBottomLeftRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBottomRightRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBottomStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderBottomWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderCollapse?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderEndEndRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderEndStartRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderImage?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderImageOutset?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderImageRepeat?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderImageSlice?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderImageSource?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderImageWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInline?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineEndColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineEndStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineEndWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineStartColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineStartStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineStartWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderInlineWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderLeft?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderLeftColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderLeftStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderLeftWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderRight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderRightColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderRightStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderRightWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderSpacing?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderStartEndRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderStartStartRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderTop?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderTopColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderTopLeftRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderTopRightRadius?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderTopStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderTopWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    borderWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    bottom?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    boxDecorationBreak?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    boxReflect?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    boxShadow?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    boxSizing?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    breakAfter?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    breakBefore?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    breakInside?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    captionSide?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    caretColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    '@charset'?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    clear?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    clip?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    clipPath?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    color?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnCount?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnFill?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnGap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnRule?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnRuleColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnRuleStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnRuleWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnSpan?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columnWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    columns?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    content?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    counterIncrement?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    counterReset?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    counterSet?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    cursor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    direction?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    display?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    emptyCells?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    filter?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    flex?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    flexBasis?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    flexDirection?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    flexFlow?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    flexGrow?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    flexShrink?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    flexWrap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    float?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    font?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    '@fontFace'?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontFamily?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontFeatureSettings?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontKerning?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontLanguageOverride?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | number | ReadOnlyDataSource<number>;
    fontSizeAdjust?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontStretch?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontSynthesis?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontVariant?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontVariantAlternates?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontVariantCaps?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontVariantEastAsian?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontVariantLigatures?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontVariantNumeric?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontVariantPosition?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    fontWeight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | number | ReadOnlyDataSource<number>;

    gap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    grid?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridArea?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridAutoColumns?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridAutoFlow?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridAutoRows?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridColumn?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridColumnEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridColumnGap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridColumnStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridGap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridRow?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridRowEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridRowGap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridRowStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridTemplate?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridTemplateAreas?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    gridTemplateColumns?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    hangingPunctuation?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    height?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    hyphens?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    hypenateCharacter?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    imageRendering?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    inlineSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    inset?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    insetBlock?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    insetBlockEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    insetBlockStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    insetInline?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    insetInlineEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    insetInlineStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    isolation?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    justifyContent?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    justifyItems?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    justifySelf?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    left?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    letterSpacing?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    lineBreak?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    lineHeight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    listStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    listStyleImage?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    listStylePosition?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    listStyleType?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    margin?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | number | ReadOnlyDataSource<number>;
    marginBlock?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginBlockEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginBlockStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginBottom?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginInline?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginInlineEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginInlineStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginLeft?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginRight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    marginTop?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    mask?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskClip?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskComposite?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskImage?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskMode?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskOrigin?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskPosition?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskRepeat?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maskType?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maxHeight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maxWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maxBlockSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    maxInlineSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    minBlockSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    minInlineSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    minHeight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    minWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    mixBlendMode?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    objectFit?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    objectPosition?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    offset?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    offsetAnchor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    offsetDistance?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    offsetPath?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    offsetRotate?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    opacity?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    order?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    orphans?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    outline?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    outlineColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    outlineOffset?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    outlineStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    outlineWidth?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overflow?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overflowAnchor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overflowWrap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overflowX?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overflowY?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overscrollBehavior?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overscrollBehaviorBlock?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overscrollBehaviorInline?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overscrollBehaviorX?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    overscrollBehaviorY?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    padding?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | number | ReadOnlyDataSource<number>;
    paddingBlock?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingBlockEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingBlockStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingBottom?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingInline?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingInlineEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingInlineStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingLeft?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingRight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paddingTop?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    pageBreakAfter?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    pageBreakBefore?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    pageBreakInside?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    paintOrder?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    perspective?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    perspectiveOrigin?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    placeContent?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    placeItems?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    placeSelf?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    pointerEvents?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    position?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    quotes?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    resize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    right?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    rotate?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    rowGap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    scale?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollBehavior?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMargin?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginBlock?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginBlockEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginBlockStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginBottom?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginInline?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginInlineEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginInlineStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginLeft?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginRight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollMarginTop?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPadding?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingBlock?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingBlockEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingBlockStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingBottom?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingInline?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingInlineEnd?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingInlineStart?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingLeft?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingRight?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollPaddingTop?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollSnapALign?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollSnapStop?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollSnapType?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    scrollbarColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    tabSize?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    tableLayout?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textAlign?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textAlignLast?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textCombineUpright?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textDecoration?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textDecorationColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textDecorationLine?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textDecorationStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textDecorationThickness?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textEmphasis?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textEmphasisColor?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textEmphasisPosition?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textEmphasisStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textIndent?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textJustify?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textOrientation?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textOverflow?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textShadow?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textTransform?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textUnderlineOffset?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    textUnderlinePosition?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    top?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    transform?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    transformOrigin?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    transformStyle?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    transition?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    transitionDelay?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    transitionDuration?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    transitionProperty?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    transitionTimingFunction?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    translate?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    unicodeBidi?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    userSelect?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    verticalAlign?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    visibility?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    whiteSpace?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    widows?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    width?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    wordBreak?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    wordSpacing?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    wordWrap?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;
    writingMode?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    zIndex?: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number>;

    [key: string]: string | number | ReadOnlyDataSource<string> | ReadOnlyDataSource<number> | undefined;
}
