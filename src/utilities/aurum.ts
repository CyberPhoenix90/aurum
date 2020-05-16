import { HTMLNodeProps } from '../nodes/dom_adapter';
import { OptionProps } from '../nodes/option';
import { Progress, ProgressProps } from '../nodes/progress';
import { Select, SelectProps } from '../nodes/select';
import {
	A,
	Script,
	Abbr,
	AProps,
	Area,
	AreaProps,
	Article,
	Aside,
	B,
	Div,
	H1,
	H2,
	H3,
	H4,
	H5,
	H6,
	Li,
	NoScript,
	Ol,
	P,
	Pre,
	Q,
	Span,
	Summary,
	Template,
	THead,
	Title,
	Tr,
	Ul,
	Video,
	VideoProps,
	Button,
	Canvas,
	Br,
	Form,
	Footer,
	Em,
	Details,
	Data,
	ButtonProps,
	CanvasProps,
	AudioProps,
	DataProps,
	Head,
	Img,
	Link,
	Label,
	Header,
	I,
	Heading,
	IFrame,
	ImgProps,
	LinkProps,
	LabelProps,
	IFrameProps,
	Table,
	Td,
	Th,
	Nav,
	Sub,
	Sup,
	TBody,
	TFoot,
	Style,
	Source,
	Time,
	StyleProps,
	SourceProps,
	TimeProps,
	ScriptProps,
	Svg,
	SvgProps
} from '../nodes/simple_dom_nodes';
import { TextArea, TextAreaProps } from '../nodes/textarea';
import { AurumComponentAPI, AurumElement, AurumElementModel, aurumElementModelIdentitiy, Renderable } from '../rendering/aurum_element';
import { render } from '../rendering/renderer';
import { MapLike } from './common';
import { ownerSymbol } from './owner_symbol';
import { Input, InputProps } from '../nodes/input';

const nodeMap = {
	button: Button,
	div: Div,
	input: Input,
	li: Li,
	span: Span,
	style: Style,
	ul: Ul,
	p: P,
	img: Img,
	link: Link,
	canvas: Canvas,
	a: A,
	article: Article,
	br: Br,
	form: Form,
	label: Label,
	ol: Ol,
	pre: Pre,
	progress: Progress,
	table: Table,
	td: Td,
	tr: Tr,
	th: Th,
	textarea: TextArea,
	h1: H1,
	h2: H2,
	h3: H3,
	h4: H4,
	h5: H5,
	h6: H6,
	head: Head,
	header: Header,
	footer: Footer,
	nav: Nav,
	b: B,
	i: I,
	script: Script,
	abbr: Abbr,
	area: Area,
	aside: Aside,
	audio: Audio,
	em: Em,
	heading: Heading,
	iframe: IFrame,
	noscript: NoScript,
	option: Option,
	q: Q,
	select: Select,
	source: Source,
	title: Title,
	video: Video,
	tbody: TBody,
	tfoot: TFoot,
	thead: THead,
	summary: Summary,
	details: Details,
	sub: Sub,
	sup: Sup,
	svg: Svg,
	data: Data,
	time: Time,
	template: Template
};

export class Aurum {
	public static attach(aurumRenderable: Renderable, dom: HTMLElement) {
		const content = render(aurumRenderable);
		const root = new AurumElement();
		root.updateChildren(Array.isArray(content) ? content : [content]);
		root.attachToDom(dom, dom.childNodes.length, []);
	}

	public static detachAll(domNode: HTMLElement): void {
		if (domNode[ownerSymbol]) {
			domNode[ownerSymbol].node.remove();
			domNode[ownerSymbol].handleDetach();
			domNode[ownerSymbol] = undefined;
		}
	}

	public static factory(
		node: string | ((props: any, children: Renderable[], api: AurumComponentAPI) => Renderable),
		args: MapLike<any>,
		...innerNodes: AurumElementModel<any>[]
	): AurumElementModel<any> {
		if (typeof node === 'string') {
			const type = node;
			node = nodeMap[node];
			if (node === undefined) {
				throw new Error(`Node ${type} does not exist or is not supported`);
			}
		}

		return {
			[aurumElementModelIdentitiy]: true,
			factory: node as (props: any, children: Renderable[], api: AurumComponentAPI) => Renderable,
			props: args,
			children: innerNodes
		};
	}
}

export namespace Aurum {
	export namespace JSX {
		export interface IntrinsicElements {
			button: ButtonProps;
			div: HTMLNodeProps<HTMLElement>;
			input: InputProps;
			li: HTMLNodeProps<HTMLLIElement>;
			span: HTMLNodeProps<HTMLElement>;
			style: StyleProps;
			ul: HTMLNodeProps<HTMLUListElement>;
			p: HTMLNodeProps<HTMLParagraphElement>;
			img: ImgProps;
			link: LinkProps;
			canvas: CanvasProps;
			a: AProps;
			article: HTMLNodeProps<HTMLElement>;
			br: HTMLNodeProps<HTMLBRElement>;
			form: HTMLNodeProps<HTMLElement>;
			label: LabelProps;
			ol: HTMLNodeProps<HTMLOListElement>;
			pre: HTMLNodeProps<HTMLPreElement>;
			progress: ProgressProps;
			table: HTMLNodeProps<HTMLTableElement>;
			td: HTMLNodeProps<HTMLTableColElement>;
			tr: HTMLNodeProps<HTMLTableRowElement>;
			th: HTMLNodeProps<HTMLTableHeaderCellElement>;
			textarea: TextAreaProps;
			h1: HTMLNodeProps<HTMLElement>;
			h2: HTMLNodeProps<HTMLElement>;
			h3: HTMLNodeProps<HTMLElement>;
			h4: HTMLNodeProps<HTMLElement>;
			h5: HTMLNodeProps<HTMLElement>;
			h6: HTMLNodeProps<HTMLElement>;
			header: HTMLNodeProps<HTMLElement>;
			footer: HTMLNodeProps<HTMLElement>;
			nav: HTMLNodeProps<HTMLElement>;
			b: HTMLNodeProps<HTMLElement>;
			i: HTMLNodeProps<HTMLElement>;
			script: ScriptProps;
			abbr: HTMLNodeProps<HTMLElement>;
			area: AreaProps;
			aside: HTMLNodeProps<HTMLElement>;
			audio: AudioProps;
			em: HTMLNodeProps<HTMLElement>;
			heading: HTMLNodeProps<HTMLHeadingElement>;
			iframe: IFrameProps;
			noscript: HTMLNodeProps<HTMLElement>;
			option: OptionProps;
			q: HTMLNodeProps<HTMLQuoteElement>;
			select: SelectProps;
			source: SourceProps;
			title: HTMLNodeProps<HTMLTitleElement>;
			video: VideoProps;
			tbody: HTMLNodeProps<HTMLElement>;
			tfoot: HTMLNodeProps<HTMLElement>;
			thead: HTMLNodeProps<HTMLElement>;
			summary: HTMLNodeProps<HTMLElement>;
			details: HTMLNodeProps<HTMLDetailsElement>;
			sub: HTMLNodeProps<HTMLElement>;
			sup: HTMLNodeProps<HTMLElement>;
			svg: SvgProps;
			data: DataProps;
			time: TimeProps;
			body: HTMLNodeProps<HTMLBodyElement>;
			head: HTMLNodeProps<HTMLHeadElement>;
			template: HTMLNodeProps<HTMLTemplateElement>;
		}
	}
}
