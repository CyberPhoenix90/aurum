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
