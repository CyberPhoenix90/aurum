import { DomNodeCreator, HTMLNodeProps } from '../builtin_compoents/dom_adapter';
import { AttributeValue } from '../utilities/common';

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
}

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
}

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
}

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
}
/**
 * @internal
 */
export interface HtmlProps extends HTMLNodeProps<HTMLHtmlElement> {
	lang?: string;
}

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
export interface ButtonProps extends HTMLNodeProps<HTMLButtonElement> {
	type?: AttributeValue;
	disabled?: AttributeValue;
}

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
export interface DataProps extends HTMLNodeProps<HTMLDataElement> {
	value?: AttributeValue;
}

/**
 * @internal
 */
export interface IFrameProps extends HTMLNodeProps<HTMLIFrameElement> {
	src?: AttributeValue;
	allow?: AttributeValue;
	allowFullscreen?: AttributeValue;
	allowPaymentRequest?: AttributeValue;
	width?: AttributeValue;
	height?: AttributeValue;
	srcdoc?: AttributeValue;
	loading?: AttributeValue;
	sandbox?: AttributeValue;
}

/**
 * @internal
 */
export interface ImgProps extends HTMLNodeProps<HTMLImageElement> {
	src?: AttributeValue;
	alt?: AttributeValue;
	width?: AttributeValue;
	height?: AttributeValue;
	referrerPolicy?: AttributeValue;
	sizes?: AttributeValue;
	srcset?: AttributeValue;
	useMap?: AttributeValue;
}

/**
 * @internal
 */
export interface LabelProps extends HTMLNodeProps<HTMLLabelElement> {
	for?: AttributeValue;
}

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
}

/**
 * @internal
 */
export interface TimeProps extends HTMLNodeProps<HTMLTimeElement> {
	datetime?: AttributeValue;
}

/**
 * @internal
 */
export interface StyleProps extends HTMLNodeProps<HTMLStyleElement> {
	media?: AttributeValue;
	type?: AttributeValue;
}

/**
 * @internal
 */
export interface SourceProps extends HTMLNodeProps<HTMLSourceElement> {
	src?: AttributeValue;
	srcSet?: AttributeValue;
	media?: AttributeValue;
	sizes?: AttributeValue;
	type?: AttributeValue;
}

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

export interface ParamProps extends HTMLNodeProps<HTMLParamElement> {
	value?: AttributeValue;
}

export interface ScriptProps extends HTMLNodeProps<HTMLScriptElement> {
	src?: AttributeValue;
	async?: AttributeValue;
	defer?: AttributeValue;
	integrity?: AttributeValue;
	noModule?: AttributeValue;
	crossorigin?: AttributeValue;
	type?: AttributeValue;
}

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
export interface ProgressProps extends HTMLNodeProps<HTMLProgressElement> {
	max?: AttributeValue;
	value?: AttributeValue;
}

/**
 * @internal
 */
export interface OptionProps extends HTMLNodeProps<HTMLElement> {
	value?: AttributeValue;
	disabled?: AttributeValue;
	label?: AttributeValue;
	selected?: AttributeValue;
}

export interface OptGroupProps extends HTMLNodeProps<HTMLOptGroupElement> {
	disabled?: AttributeValue;
	label?: AttributeValue;
}

export interface OutputProps extends HTMLNodeProps<HTMLOutputElement> {
	form?: AttributeValue;
	for?: AttributeValue;
}

export interface ObjectProps extends HTMLNodeProps<HTMLObjectElement> {
	data?: AttributeValue;
	width?: AttributeValue;
	height?: AttributeValue;
	form?: AttributeValue;
	type?: AttributeValue;
	typemustmatch?: AttributeValue;
	usemap?: AttributeValue;
}

/**
 * @internal
 */
export interface SlotProps extends HTMLNodeProps<HTMLSlotElement> {}

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
export const Area = DomNodeCreator<HTMLNodeProps<HTMLAreaElement>>('area', ['alt', 'coors']);
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
export const Video = DomNodeCreator<VideoProps>('video', ['controls', 'autoplay', 'loop', 'muted', 'preload', 'src', 'poster', 'width', 'height']);
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
export const Tr = DomNodeCreator<HTMLNodeProps<HTMLTableRowElement>>('tr');
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
export const Audio = DomNodeCreator<AudioProps>('audio', ['controls', 'autoplay', 'loop', 'muted', 'preload', 'src']);
/**
 * @internal
 */
export const Br = DomNodeCreator<HTMLNodeProps<HTMLBRElement>>('br');
/**
 * @internal
 */
export const Button = DomNodeCreator<ButtonProps>('button', ['disabled']);
/**
 * @internal
 */
export const Canvas = DomNodeCreator<CanvasProps>('canvas', ['width', 'height']);
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
export const Form = DomNodeCreator<FormProps>('form');
/**
 * @internal
 */
export const Meta = DomNodeCreator<MetaProps>('meta', ['http-equiv', 'charset']);

/**
 * @internal
 */
export const Html = DomNodeCreator<HtmlProps>('html', ['lang']);
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
export const IFrame = DomNodeCreator<IFrameProps>('iframe', [
	'src',
	'srcdoc',
	'width',
	'height',
	'allow',
	'allowFullscreen',
	'allowPaymentRequest',
	'loading',
	'sandbox'
]);
/**
 * @internal
 */
export const Img = DomNodeCreator<ImgProps>('img', ['src', 'alt', 'width', 'height', 'referrerPolicy', 'sizes', 'srcset', 'useMap']);
/**
 * @internal
 */
export const Label = DomNodeCreator<LabelProps>('label', ['for']);
/**
 * @internal
 */
export const Link = DomNodeCreator<LinkProps>('link', ['href', 'rel', 'media', 'as', 'disabled', 'type']);
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
export const Td = DomNodeCreator<HTMLNodeProps<HTMLTableColElement>>('td');
/**
 * @internal
 */
export const Th = DomNodeCreator<HTMLNodeProps<HTMLTableHeaderCellElement>>('th');
/**
 * @internal
 */
export const Time = DomNodeCreator<TimeProps>('time', ['datetime']);
/**
 * @internal
 */
export const Style = DomNodeCreator<StyleProps>('style', ['media', 'type']);
/**
 * @internal
 */
export const Source = DomNodeCreator<SourceProps>('source', ['src', 'srcSet', 'media', 'sizes', 'type']);
/**
 * @internal
 */
export const Track = DomNodeCreator<TrackProps>('track', ['src', 'srclang', 'label', 'kind', 'default']);
/**
 * @internal
 */
export const Param = DomNodeCreator<ParamProps>('param', ['value']);
/**
 * @internal
 */
export const Script = DomNodeCreator<ScriptProps>('script', ['src', 'async', 'defer', 'integrity', 'noModule', 'type', 'crossorigin']);
/**
 * @internal
 */
export const Svg = DomNodeCreator<SvgProps>('svg', ['width', 'height']);
/**
 * @internal
 */
export const Progress = DomNodeCreator<ProgressProps>('progress', ['max', 'value']);
/**
 * @internal
 */
export const Option = DomNodeCreator<OptionProps>('option', ['value', 'label', 'disabled', 'selected']);
/**
 * @internal
 */
export const OptGroup = DomNodeCreator<OptGroupProps>('optgroup', ['label', 'disabled']);

/**
 * @internal
 */
export const Slot = DomNodeCreator<SlotProps>('slot', ['name']);

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
export const Output = DomNodeCreator<OutputProps>('output', ['for', 'form']);
/**
 * @internal
 */
export const Object = DomNodeCreator<ObjectProps>('object', ['data', 'width', 'height', 'form', 'type', 'typemustmatch', 'usemap']);
