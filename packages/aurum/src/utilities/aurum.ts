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
	FormProps,
	Html,
	Body,
	Meta,
	MetaProps,
	HtmlProps,
	ObjectProps,
	OptGroupProps,
	OutputProps,
	ParamProps,
	TrackProps,
	Address,
	Kbd,
	Object,
	OptGroup,
	Output,
	Param,
	Picture,
	Samp,
	Strong,
	Track,
	Var,
	Wbr,
	ColProps,
	Col,
	Colgroup,
	Caption,
	TableCellProps
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
import { ArrayDataSource, DataSource } from '../stream/data_source';
import { MapLike } from './common';
import { CancellationToken } from './cancellation_token';
import { HTMLNodeProps } from '../builtin_compoents/dom_adapter';

const nodeMap = {
	address: Address,
	kbd: Kbd,
	samp: Samp,
	object: Object,
	optgroup: OptGroup,
	picture: Picture,
	output: Output,
	param: Param,
	strong: Strong,
	track: Track,
	var: Var,
	wbr: Wbr,
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
	html: Html,
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
	meta: Meta,
	body: Body,
	thead: THead,
	summary: Summary,
	details: Details,
	sub: Sub,
	sup: Sup,
	svg: Svg,
	data: Data,
	time: Time,
	template: Template,
	slot: Slot,
	col: Col,
	colgroup: Colgroup,
	caption: Caption
};

export class Aurum {
	public static rehydrate(aurumRenderable: Renderable, dom: HTMLElement): CancellationToken {
		const target = dom.parentElement;
		dom.remove();
		return Aurum.attach(aurumRenderable, target);
	}

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
				if (content.isConnected) {
					dom.removeChild(content);
				}
			});
		}
		for (let i = session.attachCalls.length - 1; i >= 0; i--) {
			session.attachCalls[i]();
		}

		return session.sessionToken;
	}

	public static fragment() {}

	public static factory(
		node: string | ((props: any, children: Renderable[], api: AurumComponentAPI) => Renderable),
		args: MapLike<any>,
		...innerNodes: Array<AurumElementModel<any> | DataSource<any> | ArrayDataSource<any>>
	): AurumElementModel<any> {
		//@ts-ignore
		if (node === Aurum.fragment) {
			return innerNodes as any;
		}

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
			address: HTMLNodeProps<HTMLElement>;
			wbr: HTMLNodeProps<HTMLElement>;
			samp: HTMLNodeProps<HTMLElement>;
			strong: HTMLNodeProps<HTMLElement>;
			kbd: HTMLNodeProps<HTMLElement>;
			var: HTMLNodeProps<HTMLElement>;
			picture: HTMLNodeProps<HTMLElement>;
			output: OutputProps;
			object: ObjectProps;
			optGroup: OptGroupProps;
			track: TrackProps;
			param: ParamProps;
			code: HTMLNodeProps<HTMLElement>;
			button: ButtonProps;
			hr: HTMLNodeProps<HTMLHRElement>;
			div: HTMLNodeProps<HTMLDivElement>;
			input: InputProps;
			meta: MetaProps;
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
			td: TableCellProps;
			tr: HTMLNodeProps<HTMLTableRowElement>;
			th: TableCellProps;
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
			html: HtmlProps;
			template: HTMLNodeProps<HTMLTemplateElement>;
			col: ColProps;
			colgroup: ColProps;
			caption: HTMLNodeProps<HTMLTableCaptionElement>;
		}
	}
}
