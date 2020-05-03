import { ownerSymbol } from './owner_symbol';
import { Constructor, MapLike } from './common';
import { Div, DivProps } from '../nodes/div';
import { Button, ButtonProps } from '../nodes/button';
import { Input, InputProps } from '../nodes/input';
import { Li, LiProps } from '../nodes/li';
import { Span, SpanProps } from '../nodes/span';
import { Style, StyleProps } from '../nodes/style';
import { Audio, AudioProps } from '../nodes/audio';
import { Ul, UlProps } from '../nodes/ul';
import { P, PProps } from '../nodes/p';
import { Img, ImgProps } from '../nodes/img';
import { Link, LinkProps } from '../nodes/link';
import { Canvas, CanvasProps } from '../nodes/canvas';
import { A, AProps } from '../nodes/a';
import { Article } from '../nodes/article';
import { Br, BrProps } from '../nodes/br';
import { Form, FormProps } from '../nodes/form';
import { Label, LabelProps } from '../nodes/label';
import { Ol, OlProps } from '../nodes/ol';
import { Pre, PreProps } from '../nodes/pre';
import { Progress, ProgressProps } from '../nodes/progress';
import { Table, TableProps } from '../nodes/table';
import { Td, TdProps } from '../nodes/td';
import { Tr, TrProps } from '../nodes/tr';
import { Th, ThProps } from '../nodes/th';
import { TextArea, TextAreaProps } from '../nodes/textarea';
import { H1 } from '../nodes/h1';
import { H2 } from '../nodes/h2';
import { H3 } from '../nodes/h3';
import { H4 } from '../nodes/h4';
import { H5 } from '../nodes/h5';
import { H6 } from '../nodes/h6';
import { Header } from '../nodes/header';
import { Footer } from '../nodes/footer';
import { Nav } from '../nodes/nav';
import { B } from '../nodes/b';
import { I } from '../nodes/i';
import { Script, ScriptProps } from '../nodes/script';
import { Abbr } from '../nodes/abbr';
import { Area, AreaProps } from '../nodes/area';
import { Aside } from '../nodes/aside';
import { Em } from '../nodes/em';
import { Heading, HeadingProps } from '../nodes/heading';
import { IFrame, IFrameProps } from '../nodes/iframe';
import { NoScript } from '../nodes/noscript';
import { Q, QProps } from '../nodes/q';
import { Select, SelectProps } from '../nodes/select';
import { Source, SourceProps } from '../nodes/source';
import { Title, TitleProps } from '../nodes/title';
import { Video, VideoProps } from '../nodes/video';
import { Tbody } from '../nodes/tbody';
import { Tfoot } from '../nodes/tfoot';
import { Thead } from '../nodes/thead';
import { Summary } from '../nodes/summary';
import { Details, DetailsProps } from '../nodes/details';
import { Sub } from '../nodes/sub';
import { Sup } from '../nodes/sup';
import { Svg, SvgProps } from '../nodes/svg';
import { Data, DataProps } from '../nodes/data';
import { Time, TimeProps } from '../nodes/time';
import { Option, OptionProps } from '../nodes/option';
import { Template, TemplateProps } from '../nodes/template';
import { BodyProps } from '../nodes/body';
import { HeadProps } from '../nodes/head';
import { AurumElementProps } from '../nodes/special/aurum_element';
import { Renderable, AurumElement, AurumElementModel, aurumElementModelIdentitiy } from '../rendering/aurum_element';
import { render } from '../rendering/renderer';

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
		root.attachToDom(dom, dom.childNodes.length);
	}

	public static detachAll(domNode: HTMLElement): void {
		if (domNode[ownerSymbol]) {
			domNode[ownerSymbol].node.remove();
			domNode[ownerSymbol].handleDetach();
			domNode[ownerSymbol] = undefined;
		}
	}

	public static factory(
		node: string | Constructor<AurumElement> | ((...args: any[]) => AurumElement),
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

		if (Object.getPrototypeOf(node as Constructor<AurumElement>) === AurumElement) {
			return {
				[aurumElementModelIdentitiy]: true,
				//@ts-ignore
				constructor: (args, innerNodes) => new node(args, innerNodes),
				props: args,
				innerNodes: innerNodes
			};
		} else {
			return {
				[aurumElementModelIdentitiy]: true,
				//@ts-ignore
				constructor: node,
				props: args,
				innerNodes: innerNodes
			};
		}
	}
}

export namespace Aurum {
	export namespace JSX {
		export interface IntrinsicElements {
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
			article: AurumElementProps<HTMLElement>;
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
			h1: AurumElementProps<HTMLElement>;
			h2: AurumElementProps<HTMLElement>;
			h3: AurumElementProps<HTMLElement>;
			h4: AurumElementProps<HTMLElement>;
			h5: AurumElementProps<HTMLElement>;
			h6: AurumElementProps<HTMLElement>;
			header: AurumElementProps<HTMLElement>;
			footer: AurumElementProps<HTMLElement>;
			nav: AurumElementProps<HTMLElement>;
			b: AurumElementProps<HTMLElement>;
			i: AurumElementProps<HTMLElement>;
			script: ScriptProps;
			abbr: AurumElementProps<HTMLElement>;
			area: AreaProps;
			aside: AurumElementProps<HTMLElement>;
			audio: AudioProps;
			em: AurumElementProps<HTMLElement>;
			heading: HeadingProps;
			iframe: IFrameProps;
			noscript: AurumElementProps<HTMLElement>;
			option: OptionProps;
			q: QProps;
			select: SelectProps;
			source: SourceProps;
			title: TitleProps;
			video: VideoProps;
			tbody: AurumElementProps<HTMLElement>;
			tfoot: AurumElementProps<HTMLElement>;
			thead: AurumElementProps<HTMLElement>;
			summary: AurumElementProps<HTMLElement>;
			details: DetailsProps;
			sub: AurumElementProps<HTMLElement>;
			sup: AurumElementProps<HTMLElement>;
			svg: SvgProps;
			data: DataProps;
			time: TimeProps;
			body: BodyProps;
			head: HeadProps;
			template: TemplateProps;
		}
	}
}
