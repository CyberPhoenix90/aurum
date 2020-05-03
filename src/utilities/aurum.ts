import Q from 'q';
import { AudioProps } from '../nodes/audio';
import { B } from '../nodes/b';
import { BodyProps } from '../nodes/body';
import { Br, BrProps } from '../nodes/br';
import { Button, ButtonProps } from '../nodes/button';
import { Canvas, CanvasProps } from '../nodes/canvas';
import { Data, DataProps } from '../nodes/data';
import { Details, DetailsProps } from '../nodes/details';
import { Em } from '../nodes/em';
import { Footer } from '../nodes/footer';
import { Form, FormProps } from '../nodes/form';
import { HeadProps } from '../nodes/head';
import { Header } from '../nodes/header';
import { Heading, HeadingProps } from '../nodes/heading';
import { I } from '../nodes/i';
import { IFrame, IFrameProps } from '../nodes/iframe';
import { Img, ImgProps } from '../nodes/img';
import { Input, InputProps } from '../nodes/input';
import { Label, LabelProps } from '../nodes/label';
import { Link, LinkProps } from '../nodes/link';
import { Nav } from '../nodes/nav';
import { OptionProps } from '../nodes/option';
import { P, PProps } from '../nodes/p';
import { Pre, PreProps } from '../nodes/pre';
import { Progress, ProgressProps } from '../nodes/progress';
import { QProps } from '../nodes/q';
import { Script, ScriptProps } from '../nodes/script';
import { Select, SelectProps } from '../nodes/select';
import {
	A,
	Abbr,
	AProps,
	Area,
	Article,
	Aside,
	Div,
	H1,
	H2,
	H3,
	H4,
	H5,
	H6,
	Span,
	AreaProps,
	NoScript,
	Video,
	VideoProps,
	Li,
	Ul,
	Ol,
	Tr
} from '../nodes/simple_dom_nodes';
import { Source, SourceProps } from '../nodes/source';
import { Style, StyleProps } from '../nodes/style';
import { Sub } from '../nodes/sub';
import { Summary } from '../nodes/summary';
import { Sup } from '../nodes/sup';
import { Svg, SvgProps } from '../nodes/svg';
import { Table, TableProps } from '../nodes/table';
import { Tbody } from '../nodes/tbody';
import { Td, TdProps } from '../nodes/td';
import { Template, TemplateProps } from '../nodes/template';
import { TextArea, TextAreaProps } from '../nodes/textarea';
import { Tfoot } from '../nodes/tfoot';
import { Th, ThProps } from '../nodes/th';
import { Thead } from '../nodes/thead';
import { Time, TimeProps } from '../nodes/time';
import { Title, TitleProps } from '../nodes/title';
import { MapLike } from './common';
import { ownerSymbol } from './owner_symbol';
import { Renderable, AurumElement, AurumComponentAPI, AurumElementModel, aurumElementModelIdentitiy } from '../rendering/aurum_element';
import { render } from '../rendering/renderer';
import { HTMLNodeProps } from '../nodes/dom_adapter';

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
	tbody: Tbody,
	tfoot: Tfoot,
	thead: Thead,
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
			p: PProps;
			img: ImgProps;
			link: LinkProps;
			canvas: CanvasProps;
			a: AProps;
			article: HTMLNodeProps<HTMLElement>;
			br: BrProps;
			form: FormProps;
			label: LabelProps;
			ol: HTMLNodeProps<HTMLOListElement>;
			pre: PreProps;
			progress: ProgressProps;
			table: TableProps;
			td: TdProps;
			tr: HTMLNodeProps<HTMLTableRowElement>;
			th: ThProps;
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
			heading: HeadingProps;
			iframe: IFrameProps;
			noscript: HTMLNodeProps<HTMLElement>;
			option: OptionProps;
			q: QProps;
			select: SelectProps;
			source: SourceProps;
			title: TitleProps;
			video: VideoProps;
			tbody: HTMLNodeProps<HTMLElement>;
			tfoot: HTMLNodeProps<HTMLElement>;
			thead: HTMLNodeProps<HTMLElement>;
			summary: HTMLNodeProps<HTMLElement>;
			details: DetailsProps;
			sub: HTMLNodeProps<HTMLElement>;
			sup: HTMLNodeProps<HTMLElement>;
			svg: SvgProps;
			data: DataProps;
			time: TimeProps;
			body: BodyProps;
			head: HeadProps;
			template: TemplateProps;
		}
	}
}
