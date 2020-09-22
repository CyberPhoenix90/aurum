import { HTMLNodeProps } from '../nodes/dom_adapter';
import { Input, InputProps } from '../nodes/input';
import { Select, SelectProps } from '../nodes/select';
import {
	A,
	Abbr,
	AProps,
	Area,
	AreaProps,
	Article,
	Aside,
	Audio,
	AudioProps,
	B,
	Br,
	Button,
	ButtonProps,
	Canvas,
	CanvasProps,
	Data,
	DataProps,
	Details,
	Div,
	Em,
	Footer,
	Form,
	H1,
	H2,
	H3,
	H4,
	H5,
	H6,
	Head,
	Header,
	Heading,
	I,
	IFrame,
	IFrameProps,
	Img,
	ImgProps,
	Label,
	LabelProps,
	Li,
	Link,
	LinkProps,
	Nav,
	NoScript,
	Ol,
	Option,
	OptionProps,
	P,
	Pre,
	Progress,
	ProgressProps,
	Q,
	Script,
	ScriptProps,
	Source,
	SourceProps,
	Span,
	Style,
	StyleProps,
	Sub,
	Summary,
	Sup,
	Svg,
	SvgProps,
	Table,
	TBody,
	Td,
	Template,
	TFoot,
	Th,
	THead,
	Time,
	TimeProps,
	Title,
	Tr,
	Ul,
	Video,
	VideoProps,
	Slot,
	SlotProps,
	Code,
	Hr,
	FormProps
} from '../nodes/simple_dom_nodes';
import { TextArea, TextAreaProps } from '../nodes/textarea';
import {
	ArrayAurumElement,
	AurumComponentAPI,
	AurumElement,
	AurumElementModel,
	aurumElementModelIdentitiy,
	createAPI,
	createRenderSession,
	render,
	Renderable
} from '../rendering/aurum_element';
import { ArrayDataSource } from '../stream/data_source';
import { MapLike } from './common';
import { CancellationToken } from './cancellation_token';

const nodeMap = {
	button: Button,
	code: Code,
	hr: Hr,
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
	template: Template,
	slot: Slot
};

export class Aurum {
	public static attach(aurumRenderable: Renderable, dom: HTMLElement): CancellationToken {
		const session = createRenderSession();
		const content = render(aurumRenderable, session);
		if (content instanceof AurumElement) {
			content.attachToDom(dom, dom.childNodes.length);
			session.sessionToken.addCancelable(() => content.dispose());
		} else if (Array.isArray(content)) {
			const root = new ArrayAurumElement(new ArrayDataSource(content), createAPI(session));
			session.sessionToken.addCancelable(() => root.dispose());
			root.attachToDom(dom, dom.childNodes.length);
		} else {
			dom.appendChild(content);
			session.sessionToken.addCancelable(() => {
				dom.removeChild(content);
			});
		}
		for (let i = session.attachCalls.length - 1; i >= 0; i--) {
			session.attachCalls[i]();
		}

		return session.sessionToken;
	}

	public static factory(
		node: string | ((props: any, children: Renderable[], api: AurumComponentAPI) => Renderable),
		args: MapLike<any>,
		...innerNodes: AurumElementModel<any>[]
	): AurumElementModel<any> {
		let name;
		let intrinsic = false;
		if (typeof node === 'string') {
			intrinsic = true;
			name = node;
			const type = node;
			node = nodeMap[node];
			if (node === undefined) {
				throw new Error(`Node ${type} does not exist or is not supported`);
			}
		} else {
			name = node.name;
		}

		return {
			[aurumElementModelIdentitiy]: true,
			name,
			isIntrinsic: intrinsic,
			factory: node as (props: any, children: Renderable[], api: AurumComponentAPI) => Renderable,
			props: args,
			children: innerNodes
		};
	}
}

export namespace Aurum {
	export namespace JSX {
		export interface IntrinsicElements {
			code: HTMLNodeProps<HTMLElement>;
			button: ButtonProps;
			hr: HTMLNodeProps<HTMLHRElement>;
			div: HTMLNodeProps<HTMLDivElement>;
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
			form: FormProps;
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
			slot: SlotProps;
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
