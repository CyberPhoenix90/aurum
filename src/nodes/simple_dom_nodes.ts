import { DomNodeCreator, HTMLNodeProps } from './dom_adapter';
import { AttributeValue } from '../utilities/common';

export interface AProps extends HTMLNodeProps<HTMLAnchorElement> {
	href?: AttributeValue;
	target?: AttributeValue;
}

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

export interface AudioProps extends HTMLNodeProps<HTMLAudioElement> {
	controls?: AttributeValue;
	autoplay?: AttributeValue;
	loop?: AttributeValue;
	muted?: AttributeValue;
	preload?: AttributeValue;
	src?: AttributeValue;
}

export interface ButtonProps extends HTMLNodeProps<HTMLButtonElement> {
	disabled?: AttributeValue;
}

export interface CanvasProps extends HTMLNodeProps<HTMLCanvasElement> {
	width?: AttributeValue;
	height?: AttributeValue;
}

export interface DataProps extends HTMLNodeProps<HTMLDataElement> {
	value?: AttributeValue;
}

export interface IFrameProps extends HTMLNodeProps<HTMLIFrameElement> {
	src?: AttributeValue;
	allow?: AttributeValue;
	allowFullscreen?: AttributeValue;
	allowPaymentRequest?: AttributeValue;
	width?: AttributeValue;
	height?: AttributeValue;
	srcdoc?: AttributeValue;
}

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

export interface LabelProps extends HTMLNodeProps<HTMLLabelElement> {
	for?: AttributeValue;
}

export interface LinkProps extends HTMLNodeProps<HTMLLinkElement> {
	href?: AttributeValue;
	rel?: AttributeValue;
	media?: AttributeValue;
	as?: AttributeValue;
	disabled?: AttributeValue;
	type?: AttributeValue;
}

export interface TimeProps extends HTMLNodeProps<HTMLTimeElement> {
	datetime?: AttributeValue;
}

export interface StyleProps extends HTMLNodeProps<HTMLStyleElement> {
	media?: AttributeValue;
}

export interface SourceProps extends HTMLNodeProps<HTMLSourceElement> {
	src?: AttributeValue;
	srcSet?: AttributeValue;
	media?: AttributeValue;
	sizes?: AttributeValue;
	type?: AttributeValue;
}

export interface ScriptProps extends HTMLNodeProps<HTMLScriptElement> {
	src?: AttributeValue;
	async?: AttributeValue;
	defer?: AttributeValue;
	integrity?: AttributeValue;
	noModule?: AttributeValue;
	type?: AttributeValue;
}

export interface SvgProps extends HTMLNodeProps<HTMLOrSVGElement> {
	width?: AttributeValue;
	height?: AttributeValue;
}

export interface ProgressProps extends HTMLNodeProps<HTMLProgressElement> {
	max?: AttributeValue;
	value?: AttributeValue;
}

export interface OptionProps extends HTMLNodeProps<HTMLElement> {
	value?: AttributeValue;
}

/**
 * @internal
 */
export const Div = DomNodeCreator<HTMLNodeProps<HTMLDivElement>>('div');
/**
 * @internal
 */
export const A = DomNodeCreator<AProps>('a', ['href', 'target']);
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
export const Form = DomNodeCreator<HTMLNodeProps<HTMLElement>>('form');
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
export const IFrame = DomNodeCreator<IFrameProps>('iframe', ['src', 'srcdoc', 'width', 'height', 'allow', 'allowFullscreen', 'allowPaymentRequest']);
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
export const Style = DomNodeCreator<StyleProps>('style', ['media']);
/**
 * @internal
 */
export const Source = DomNodeCreator<SourceProps>('source', ['src', 'srcSet', 'media', 'sizes', 'type']);
/**
 * @internal
 */
export const Script = DomNodeCreator<ScriptProps>('script', ['src', 'async', 'defer', 'integrity', 'noModule', 'type']);
/**
 * @internal
 */
export const Svg = DomNodeCreator<SvgProps>('svg', ['width', 'height']);
/**
 * @internal
 */
export const Progress = DomNodeCreator<ProgressProps>('svg', ['max', 'value']);
/**
 * @internal
 */
export const Option = DomNodeCreator<OptionProps>('option', ['value']);
