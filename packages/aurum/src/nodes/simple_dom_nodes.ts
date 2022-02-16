import { DomNodeCreator, HTMLNodeProps } from '../builtin_components/dom_adapter.js';
import { AttributeValue, DataDrain } from '../utilities/common.js';

/**
 * @internal
 */
export const Code = DomNodeCreator<HTMLNodeProps<HTMLElement>>('code');
/**
 * @internal
 */
export const Div = DomNodeCreator<HTMLNodeProps<HTMLDivElement>>('div');

/**
 * @internal
 */
export interface AProps extends HTMLNodeProps<HTMLAnchorElement> {
    href?: AttributeValue;
    hreflang?: AttributeValue;
    media?: AttributeValue;
    download?: AttributeValue;
    target?: AttributeValue;
    ping?: AttributeValue;
    referrerpolicy?: AttributeValue;
    rel?: AttributeValue;
    type?: AttributeValue;
}
/**
 * @internal
 */
export const A = DomNodeCreator<AProps>('a', ['href', 'target', 'hreflang', 'media', 'download', 'ping', 'referrerpolicy', 'rel', 'type']);
/**
 * @internal
 */
export const Abbr = DomNodeCreator<HTMLNodeProps<HTMLElement>>('abbr');
/**
 * @internal
 */
export const Address = DomNodeCreator<HTMLNodeProps<HTMLElement>>('address');
/**
 * @internal
 */
export const H1 = DomNodeCreator<HTMLNodeProps<HTMLElement>>('h1');
/**
 * @internal
 */
export const H2 = DomNodeCreator<HTMLNodeProps<HTMLElement>>('h2');
/**
 * @internal
 */
export const H3 = DomNodeCreator<HTMLNodeProps<HTMLElement>>('h3');
/**
 * @internal
 */
export const H4 = DomNodeCreator<HTMLNodeProps<HTMLElement>>('h4');
/**
 * @internal
 */
export const H5 = DomNodeCreator<HTMLNodeProps<HTMLElement>>('h5');
/**
 * @internal
 */
export const H6 = DomNodeCreator<HTMLNodeProps<HTMLElement>>('h6');

/**
 * @internal
 */
export interface AreaProps extends HTMLNodeProps<HTMLAreaElement> {
    alt?: AttributeValue;
    coords?: AttributeValue;
    download?: AttributeValue;
    href?: AttributeValue;
    hreflang?: AttributeValue;
    media?: AttributeValue;
    rel?: AttributeValue;
    shape?: AttributeValue;
    target?: AttributeValue;
    type?: AttributeValue;
    ping?: AttributeValue;
    referrerpolicy?: AttributeValue;
}

/**
 * @internal
 */
export const Area = DomNodeCreator<AreaProps>('area', [
    'alt',
    'coors',
    'download',
    'href',
    'hreflang',
    'media',
    'rel',
    'shape',
    'target',
    'type',
    'ping',
    'referrerpolicy'
]);
/**
 * @internal
 */
export const Article = DomNodeCreator<HTMLNodeProps<HTMLElement>>('article');
/**
 * @internal
 */
export const Aside = DomNodeCreator<HTMLNodeProps<HTMLElement>>('aside');
/**
 * @internal
 */
export const Span = DomNodeCreator<HTMLNodeProps<HTMLSpanElement>>('span');
/**
 * @internal
 */
export const NoScript = DomNodeCreator<HTMLNodeProps<HTMLElement>>('noscript');

/**
 * @internal
 */
export interface VideoProps extends HTMLNodeProps<HTMLVideoElement> {
    controls?: AttributeValue;
    autoplay?: AttributeValue;
    loop?: AttributeValue;
    muted?: AttributeValue;
    preload?: AttributeValue;
    src?: AttributeValue;
    poster?: AttributeValue;
    width?: AttributeValue;
    height?: AttributeValue;
    autopictureinpicture?: AttributeValue;
    controlslist?: AttributeValue;
    crossorigin?: AttributeValue;
    disablepictureinpicture?: AttributeValue;
    disableremoteplayback?: AttributeValue;
    playsinline?: AttributeValue;

    onCanPlay?: DataDrain<Event>;
    onCanPlayThrough?: DataDrain<Event>;
    onComplete?: DataDrain<Event>;
    onDurationChange?: DataDrain<Event>;
    onEmptied?: DataDrain<Event>;
    onEnded?: DataDrain<Event>;
    onLoadedData?: DataDrain<Event>;
    onLoadedMetadata?: DataDrain<Event>;
    onPause?: DataDrain<Event>;
    onPlay?: DataDrain<Event>;
    onPlaying?: DataDrain<Event>;
    onProgress?: DataDrain<Event>;
    onRateChange?: DataDrain<Event>;
    onSeeked?: DataDrain<Event>;
    onSeeking?: DataDrain<Event>;
    onStalled?: DataDrain<Event>;
    onSuspend?: DataDrain<Event>;
    onTimeUpdate?: DataDrain<Event>;
    onVolumeChange?: DataDrain<Event>;
    onWaiting?: DataDrain<Event>;
}
/**
 * @internal
 */
export const Video = DomNodeCreator<VideoProps>(
    'video',
    [
        'controls',
        'autoplay',
        'loop',
        'muted',
        'preload',
        'src',
        'poster',
        'width',
        'height',
        'autopictureinpicture',
        'controlslist',
        'crossorigin',
        'disablepictureinpicture',
        'disableremoteplayback',
        'playsinline'
    ],
    {
        canPlay: 'onCanPlay',
        canplaythrough: 'onCanPlayThrough',
        complete: 'onComplete',
        durationchange: 'onDurationChange',
        emptied: 'onEmptied',
        ended: 'onEnded',
        loadeddata: 'onLoadedData',
        loadedmetadata: 'onLoadedMetadata',
        pause: 'onPause',
        play: 'onPlay',
        playing: 'onPlaying',
        progress: 'onProgress',
        ratechange: 'onRateChange',
        seeked: 'onSeeked',
        seeking: 'onSeeking',
        stalled: 'onStalled',
        suspend: 'onSuspend',
        timeupdate: 'onTimeUpdate',
        volumechange: 'onVolumeChange',
        waiting: 'onWaiting'
    }
);
/**
 * @internal
 */
export const Ul = DomNodeCreator<HTMLNodeProps<HTMLUListElement>>('ul');
/**
 * @internal
 */
export const Ol = DomNodeCreator<HTMLNodeProps<HTMLOListElement>>('ol');
/**
 * @internal
 */
export const Li = DomNodeCreator<HTMLNodeProps<HTMLLIElement>>('li');
/**
 * @internal
 */
export const B = DomNodeCreator<HTMLNodeProps<HTMLElement>>('b');
/**
 * @internal
 */
export const Body = DomNodeCreator<HTMLNodeProps<HTMLBodyElement>>('body');
/**
 * @internal
 */
export const Title = DomNodeCreator<HTMLNodeProps<HTMLTitleElement>>('title');
/**
 * @internal
 */
export const Summary = DomNodeCreator<HTMLNodeProps<HTMLElement>>('summary');
/**
 * @internal
 */
export const THead = DomNodeCreator<HTMLNodeProps<HTMLElement>>('thead');
/**
 * @internal
 */
export const Template = DomNodeCreator<HTMLNodeProps<HTMLTemplateElement>>('template');
/**
 * @internal
 */
export const Q = DomNodeCreator<HTMLNodeProps<HTMLQuoteElement>>('q');
/**
 * @internal
 */
export const Pre = DomNodeCreator<HTMLNodeProps<HTMLPreElement>>('pre');
/**
 * @internal
 */
export const P = DomNodeCreator<HTMLNodeProps<HTMLParagraphElement>>('p');
/**
 * @internal
 */
export const Hr = DomNodeCreator<HTMLNodeProps<HTMLHRElement>>('hr');

/**
 * @internal
 */
export interface AudioProps extends HTMLNodeProps<HTMLAudioElement> {
    controls?: AttributeValue;
    autoplay?: AttributeValue;
    loop?: AttributeValue;
    muted?: AttributeValue;
    preload?: AttributeValue;
    src?: AttributeValue;
    crossorigin?: AttributeValue;

    onAudioProcess?: DataDrain<Event>;
    onCanPlay?: DataDrain<Event>;
    onCanPlayThrough?: DataDrain<Event>;
    onComplete?: DataDrain<Event>;
    onDurationChange?: DataDrain<Event>;
    onEmptied?: DataDrain<Event>;
    onEnded?: DataDrain<Event>;
    onLoadedData?: DataDrain<Event>;
    onLoadedMetadata?: DataDrain<Event>;
    onPause?: DataDrain<Event>;
    onPlay?: DataDrain<Event>;
    onPlaying?: DataDrain<Event>;
    onRateChange?: DataDrain<Event>;
    onSeeked?: DataDrain<Event>;
    onSeeking?: DataDrain<Event>;
    onStalled?: DataDrain<Event>;
    onSuspend?: DataDrain<Event>;
    onTimeUpdate?: DataDrain<Event>;
    onVolumeChange?: DataDrain<Event>;
    onWaiting?: DataDrain<Event>;
}

/**
 * @internal
 */
export const Audio = DomNodeCreator<AudioProps>('audio', ['controls', 'autoplay', 'loop', 'muted', 'preload', 'src', 'crossorigin'], {
    audioprocess: 'onAudioProcess',
    canplay: 'onCanPlay',
    canplaythrough: 'onCanPlayThrough',
    complete: 'onComplete',
    durationchange: 'onDurationChange',
    emptied: 'onEmptied',
    ended: 'onEnded',
    loadeddata: 'onLoadedData',
    loadedmetadata: 'onLoadedMetadata',
    pause: 'onPause',
    play: 'onPlay',
    playing: 'onPlaying',
    ratechange: 'onRateChange',
    seeked: 'onSeeked',
    seeking: 'onSeeking',
    stalled: 'onStalled',
    suspend: 'onSuspend',
    timeupdate: 'onTimeUpdate',
    volumechange: 'onVolumeChange',
    waiting: 'onWaiting'
});
/**
 * @internal
 */
export const Br = DomNodeCreator<HTMLNodeProps<HTMLBRElement>>('br');

/**
 * @internal
 */
export interface ButtonProps extends HTMLNodeProps<HTMLButtonElement> {
    type?: AttributeValue;
    disabled?: AttributeValue;
    autofocus?: AttributeValue;
    form?: AttributeValue;
    formaction?: AttributeValue;
    formenctype?: AttributeValue;
    formmethod?: AttributeValue;
    formnovalidate?: AttributeValue;
    formtarget?: AttributeValue;
}

/**
 * @internal
 */
export const Button = DomNodeCreator<ButtonProps>('button', [
    'disabled',
    'autofocus',
    'form',
    'formaction',
    'formenctype',
    'formmethod',
    'formnovalidate',
    'formtarget',
    'type'
]);

/**
 * @internal
 */
export interface CanvasProps extends HTMLNodeProps<HTMLCanvasElement> {
    width?: AttributeValue;
    height?: AttributeValue;
}

/**
 * @internal
 */
export const Canvas = DomNodeCreator<CanvasProps>('canvas', ['width', 'height']);

/**
 * @internal
 */
export interface DataProps extends HTMLNodeProps<HTMLDataElement> {
    value?: AttributeValue;
}

/**
 * @internal
 */
export const Data = DomNodeCreator<DataProps>('data', ['value']);
/**
 * @internal
 */
export const Details = DomNodeCreator<HTMLNodeProps<HTMLDetailsElement>>('details');
/**
 * @internal
 */
export const Em = DomNodeCreator<HTMLNodeProps<HTMLElement>>('em');
/**
 * @internal
 */
export const Footer = DomNodeCreator<HTMLNodeProps<HTMLElement>>('footer');

/**
 * @internal
 */
export interface FormProps extends HTMLNodeProps<HTMLFormElement> {
    action?: AttributeValue;
    method?: AttributeValue;
    rel?: AttributeValue;
    enctype?: AttributeValue;
    novalidate?: AttributeValue;
    target?: AttributeValue;
    'accept-charset'?: AttributeValue;
    autocomplete?: AttributeValue;
}

/**
 * @internal
 */
export const Form = DomNodeCreator<FormProps>('form', ['action', 'method', 'rel', 'enctype', 'novalidate', 'target', 'accept-charset', 'autocomplete']);

/**
 * @internal
 */
export interface MetaProps extends HTMLNodeProps<HTMLMetaElement> {
    ['http-equiv']?: AttributeValue;
    ['charset']?: AttributeValue;
    content?: AttributeValue;
}

/**
 * @internal
 */
export const Meta = DomNodeCreator<MetaProps>('meta', ['http-equiv', 'charset', 'content']);

/**
 * @internal
 */
export interface HtmlProps extends HTMLNodeProps<HTMLHtmlElement> {
    lang?: string;
    xmlns?: string;
}

/**
 * @internal
 */
export const Html = DomNodeCreator<HtmlProps>('html', ['lang', 'xmlns']);
/**
 * @internal
 */
export const Head = DomNodeCreator<HTMLNodeProps<HTMLHeadElement>>('head');
/**
 * @internal
 */
export const Header = DomNodeCreator<HTMLNodeProps<HTMLElement>>('header');
/**
 * @internal
 */
export const Heading = DomNodeCreator<HTMLNodeProps<HTMLHeadingElement>>('heading');
/**
 * @internal
 */
export const I = DomNodeCreator<HTMLNodeProps<HTMLElement>>('i');

/**
 * @internal
 */
export interface IFrameProps extends HTMLNodeProps<HTMLIFrameElement> {
    src?: AttributeValue;
    allow?: AttributeValue;
    allowfullscreen?: AttributeValue;
    allowpaymentrequest?: AttributeValue;
    width?: AttributeValue;
    height?: AttributeValue;
    srcdoc?: AttributeValue;
    loading?: AttributeValue;
    sandbox?: AttributeValue;
    frameborder?: AttributeValue;
    csp?: AttributeValue;
    referrerpolicy?: AttributeValue;
}

/**
 * @internal
 */
export const IFrame = DomNodeCreator<IFrameProps>('iframe', [
    'src',
    'srcdoc',
    'width',
    'height',
    'allow',
    'allowfullscreen',
    'allowpaymentrequest',
    'loading',
    'sandbox',
    'frameborder',
    'csp',
    'referrerpolicy'
]);

/**
 * @internal
 */
export interface ImgProps extends HTMLNodeProps<HTMLImageElement> {
    src?: AttributeValue;
    alt?: AttributeValue;
    width?: AttributeValue;
    height?: AttributeValue;
    referrerpolicy?: AttributeValue;
    sizes?: AttributeValue;
    srcset?: AttributeValue;
    usemap?: AttributeValue;
    crossorigin?: AttributeValue;
    decoding?: AttributeValue;
    ismap?: AttributeValue;
    loading?: AttributeValue;
}

/**
 * @internal
 */
export const Img = DomNodeCreator<ImgProps>('img', [
    'src',
    'alt',
    'width',
    'height',
    'referrerpolicy',
    'sizes',
    'srcset',
    'usemap',
    'crossorigin',
    'decoding',
    'ismap',
    'loading'
]);

/**
 * @internal
 */
export interface LabelProps extends HTMLNodeProps<HTMLLabelElement> {
    for?: AttributeValue;
}

/**
 * @internal
 */
export const Label = DomNodeCreator<LabelProps>('label', ['for']);

/**
 * @internal
 */
export interface LinkProps extends HTMLNodeProps<HTMLLinkElement> {
    href?: AttributeValue;
    rel?: AttributeValue;
    media?: AttributeValue;
    as?: AttributeValue;
    disabled?: AttributeValue;
    type?: AttributeValue;
    crossorigin?: AttributeValue;
    hreflang?: AttributeValue;
    referrerpolicy?: AttributeValue;
    sizes?: AttributeValue;
    integrity?: AttributeValue;
    imagesizes?: AttributeValue;
    prefetch?: AttributeValue;
}

/**
 * @internal
 */
export const Link = DomNodeCreator<LinkProps>('link', [
    'href',
    'rel',
    'media',
    'as',
    'disabled',
    'type',
    'crossorigin',
    'hreflang',
    'referrerpolicy',
    'sizes',
    'integrity',
    'imagesizes',
    'prefetch'
]);
/**
 * @internal
 */
export const Nav = DomNodeCreator<HTMLNodeProps<HTMLElement>>('nav');
/**
 * @internal
 */
export const Sub = DomNodeCreator<HTMLNodeProps<HTMLElement>>('sub');
/**
 * @internal
 */
export const Sup = DomNodeCreator<HTMLNodeProps<HTMLElement>>('sup');
/**
 * @internal
 */
export const Table = DomNodeCreator<HTMLNodeProps<HTMLTableElement>>('table');
/**
 * @internal
 */
export const TBody = DomNodeCreator<HTMLNodeProps<HTMLElement>>('tbody');
/**
 * @internal
 */
export const TFoot = DomNodeCreator<HTMLNodeProps<HTMLElement>>('tfoot');

/**
 * @internal
 */
export interface ColProps extends HTMLNodeProps<HTMLTableColElement> {
    span?: AttributeValue;
}

/**
 * @internal
 */
export const Col = DomNodeCreator<ColProps>('col', ['span']);
/**
 * @internal
 */
export const Colgroup = DomNodeCreator<HTMLNodeProps<HTMLTableColElement>>('colgroup', ['span']);
/**
 * @internal
 */
export const Caption = DomNodeCreator<HTMLNodeProps<HTMLTableCaptionElement>>('caption');
/**
 * @internal
 */
export const Tr = DomNodeCreator<HTMLNodeProps<HTMLTableRowElement>>('tr');

/**
 * @internal
 */
export interface TableCellProps extends HTMLNodeProps<HTMLTableCellElement> {
    colspan?: AttributeValue;
    headers?: AttributeValue;
    rowspan?: AttributeValue;
}

/**
 * @internal
 */
export const Td = DomNodeCreator<TableCellProps>('td', ['colspan', 'headers', 'rowspan']);
/**
 * @internal
 */
export const Th = DomNodeCreator<HTMLNodeProps<HTMLTableHeaderCellElement>>('th', ['scope', 'abbr', 'colspan', 'headers', 'rowspan']);

/**
 * @internal
 */
export interface TimeProps extends HTMLNodeProps<HTMLTimeElement> {
    datetime?: AttributeValue;
}
/**
 * @internal
 */
export const Time = DomNodeCreator<TimeProps>('time', ['datetime']);

/**
 * @internal
 */
export interface StyleProps extends HTMLNodeProps<HTMLStyleElement> {
    media?: AttributeValue;
    type?: AttributeValue;
    nonce?: AttributeValue;
}

/**
 * @internal
 */
export const Style = DomNodeCreator<StyleProps>('style', ['media', 'type', 'nonce']);

/**
 * @internal
 */
export interface SourceProps extends HTMLNodeProps<HTMLSourceElement> {
    src?: AttributeValue;
    srcset?: AttributeValue;
    media?: AttributeValue;
    sizes?: AttributeValue;
    type?: AttributeValue;
}

/**
 * @internal
 */
export const Source = DomNodeCreator<SourceProps>('source', ['src', 'srcset', 'media', 'sizes', 'type']);

/**
 * @internal
 */
export interface TrackProps extends HTMLNodeProps<HTMLTrackElement> {
    src?: AttributeValue;
    srclang?: AttributeValue;
    label?: AttributeValue;
    kind?: AttributeValue;
    default?: AttributeValue;
}

/**
 * @internal
 */
export const Track = DomNodeCreator<TrackProps>('track', ['src', 'srclang', 'label', 'kind', 'default']);

/**
 * @internal
 */
export interface ParamProps extends HTMLNodeProps<HTMLParamElement> {
    value?: AttributeValue;
}

/**
 * @internal
 */
export const Param = DomNodeCreator<ParamProps>('param', ['value']);

/**
 * @internal
 */
export interface ScriptProps extends HTMLNodeProps<HTMLScriptElement> {
    src?: AttributeValue;
    async?: AttributeValue;
    defer?: AttributeValue;
    integrity?: AttributeValue;
    nomodule?: AttributeValue;
    crossorigin?: AttributeValue;
    type?: AttributeValue;
    referrerpolicy?: AttributeValue;
    text?: AttributeValue;
    nonce?: AttributeValue;
}

/**
 * @internal
 */
export const Script = DomNodeCreator<ScriptProps>('script', [
    'src',
    'async',
    'defer',
    'integrity',
    'nomodule',
    'type',
    'crossorigin',
    'referrerpolicy',
    'text',
    'nonce'
]);

/**
 * @internal
 */
export interface SvgProps extends HTMLNodeProps<HTMLOrSVGElement> {
    width?: AttributeValue;
    height?: AttributeValue;
}

/**
 * @internal
 */
export const Svg = DomNodeCreator<SvgProps>('svg', ['width', 'height']);

/**
 * @internal
 */
export interface ProgressProps extends HTMLNodeProps<HTMLProgressElement> {
    max?: AttributeValue;
    value?: AttributeValue;
}

/**
 * @internal
 */
export const Progress = DomNodeCreator<ProgressProps>('progress', ['max', 'value']);

/**
 * @internal
 */
export interface OptionProps extends HTMLNodeProps<HTMLElement> {
    value?: AttributeValue;
    disabled?: AttributeValue;
    label?: AttributeValue;
    selected?: AttributeValue;
}

/**
 * @internal
 */
export const Option = DomNodeCreator<OptionProps>('option', ['value', 'label', 'disabled', 'selected']);

/**
 * @internal
 */
export interface OptGroupProps extends HTMLNodeProps<HTMLOptGroupElement> {
    disabled?: AttributeValue;
    label?: AttributeValue;
}

/**
 * @internal
 */
export const OptGroup = DomNodeCreator<OptGroupProps>('optgroup', ['label', 'disabled']);

/**
 * @internal
 */
export interface SlotProps extends HTMLNodeProps<HTMLSlotElement> {}

/**
 * @internal
 */
export const Slot = DomNodeCreator<SlotProps>('slot');

/**
 * @internal
 */
export const Strong = DomNodeCreator<HTMLNodeProps<HTMLElement>>('strong');
/**
 * @internal
 */
export const Samp = DomNodeCreator<HTMLNodeProps<HTMLElement>>('samp');
/**
 * @internal
 */
export const Kbd = DomNodeCreator<HTMLNodeProps<HTMLElement>>('kbd');
/**
 * @internal
 */
export const Var = DomNodeCreator<HTMLNodeProps<HTMLElement>>('var');
/**
 * @internal
 */
export const Wbr = DomNodeCreator<HTMLNodeProps<HTMLElement>>('wbr');
/**
 * @internal
 */
export const Picture = DomNodeCreator<HTMLNodeProps<HTMLElement>>('picture');

/**
 * @internal
 */
export interface OutputProps extends HTMLNodeProps<HTMLOutputElement> {
    form?: AttributeValue;
    for?: AttributeValue;
}

/**
 * @internal
 */
export const Output = DomNodeCreator<OutputProps>('output', ['for', 'form']);

/**
 * @internal
 */
export interface ObjectProps extends HTMLNodeProps<HTMLObjectElement> {
    data?: AttributeValue;
    width?: AttributeValue;
    height?: AttributeValue;
    form?: AttributeValue;
    type?: AttributeValue;
    usemap?: AttributeValue;
}

/**
 * @internal
 */
export const Object = DomNodeCreator<ObjectProps>('object', ['data', 'width', 'height', 'form', 'type', 'usemap']);
