import { HTMLNodeProps } from '../rendering/renderers/dom_adapter.js';
import { Input, InputProps } from '../nodes/input.js';
import { Select, SelectProps } from '../nodes/select.js';
import {
    A,
    Abbr,
    Address,
    AProps,
    Area,
    AreaProps,
    Article,
    Aside,
    Audio,
    AudioProps,
    B,
    Body,
    Br,
    Button,
    ButtonProps,
    Canvas,
    CanvasProps,
    Caption,
    Code,
    Col,
    Colgroup,
    ColProps,
    Data,
    DataProps,
    Defs,
    Details,
    Div,
    Em,
    Footer,
    Form,
    FormProps,
    G,
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
    Head,
    Header,
    Heading,
    Hr,
    Html,
    HtmlProps,
    I,
    IFrame,
    IFrameProps,
    Img,
    ImgProps,
    Kbd,
    Label,
    LabelProps,
    Li,
    Line,
    Link,
    LinkProps,
    Meta,
    MetaProps,
    Nav,
    NoScript,
    Object,
    ObjectProps,
    Ol,
    OptGroup,
    OptGroupProps,
    Option,
    OptionProps,
    Output,
    OutputProps,
    P,
    Param,
    ParamProps,
    Picture,
    Pre,
    Progress,
    ProgressProps,
    Q,
    Rect,
    Samp,
    Script,
    ScriptProps,
    Slot,
    SlotProps,
    Source,
    SourceProps,
    Span,
    Strong,
    Style,
    StyleProps,
    Sub,
    Summary,
    Sup,
    Svg,
    SvgProps,
    Table,
    TableCellProps,
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
    Track,
    TrackProps,
    Ul,
    Var,
    Video,
    VideoProps,
    Wbr,
    Text,
    Tspan,
    Circle,
    Ellipse,
    Polygon,
    Polyline,
    Path,
    Image,
    Symbol,
    CircleProps,
    EllipseProps,
    ImageProps,
    LineProps,
    PathProps,
    PolygonProps,
    PolylineProps,
    RectProps,
    SymbolProps,
    UseProps,
    LinearGradientProps,
    RadialGradientProps,
    StopProps,
    MaskProps,
    Mask,
    Use,
    Stop,
    LinearGradient,
    RadialGradient,
    Marker,
    ClipPath,
    ForeignObject,
    Pattern,
    ClipPathProps,
    PatternProps,
    ForeignObjectProps,
    MarkerProps
} from '../nodes/simple_dom_nodes.js';
import { TextArea, TextAreaProps } from '../nodes/textarea.js';
import {
    ArrayAurumElement,
    AurumComponentAPI,
    AurumElement,
    AurumElementModel,
    aurumElementModelIdentitiy,
    createAPI,
    createRenderSession,
    renderInternal,
    Renderable
} from '../rendering/aurum_element.js';
import { ArrayDataSource, DataSource, ReadOnlyArrayDataSource, ReadOnlyDataSource } from '../stream/data_source.js';
import { CancellationToken } from './cancellation_token.js';
import { MapLike } from './common.js';
import { HTMLSanitizeConfig, sanitizeHTML } from './sanitize.js';
import { dsTap, dsUnique } from '../stream/data_source_operators.js';

export type AurumDecorator = (model: AurumElementModel<any>) => Renderable;

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
    caption: Caption,
    line: Line,
    rect: Rect,
    defs: Defs,
    g: G,
    text: Text,
    tspan: Tspan,
    circle: Circle,
    ellipse: Ellipse,
    polygon: Polygon,
    polyline: Polyline,
    path: Path,
    image: Image,
    symbol: Symbol,
    use: Use,
    stop: Stop,
    lineargradient: LinearGradient,
    radialgradient: RadialGradient,
    clippath: ClipPath,
    pattern: Pattern,
    mask: Mask,
    foreignobject: ForeignObject,
    marker: Marker
};

export class Aurum {
    public static rehydrate(aurumRenderable: Renderable, dom: HTMLElement): CancellationToken {
        const target = dom.parentElement;
        dom.remove();
        return Aurum.attach(aurumRenderable, target);
    }

    /**
     * Allows taking an HTML string for example from a server response and insert it into the page with options on how to deal with untrusted HTML sources
     */
    public static stringToInnerHTML(
        content: string | DataSource<string> | ArrayDataSource<string>,
        target: HTMLElement,
        config?: HTMLSanitizeConfig
    ): CancellationToken {
        const token = new CancellationToken();
        if (content instanceof DataSource) {
            content.transform(
                dsUnique(),
                dsTap((v) => {
                    target.innerHTML = sanitizeHTML(v, config);
                }),
                token
            );
        } else if (content instanceof ArrayDataSource) {
            content.listenAndRepeat((change) => {
                switch (change.operationDetailed) {
                    case 'append':
                        target.insertAdjacentHTML('beforeend', change.items.map((item) => sanitizeHTML(item, config)).join(''));
                        break;
                    case 'prepend':
                        target.insertAdjacentHTML('afterbegin', change.items.map((item) => sanitizeHTML(item, config)).join(''));
                        break;
                    case 'clear':
                        target.innerHTML = '';
                        break;
                    case 'insert':
                    case 'merge':
                    case 'removeLeft':
                    case 'removeRight':
                    case 'remove':
                    case 'swap':
                        target.innerHTML = content
                            .getData()
                            .map((item) => sanitizeHTML(item, config))
                            .join('');
                        break;
                }
            }, token);
        } else {
            target.innerHTML = sanitizeHTML(content, config);
        }

        token.addCancellable(() => {
            target.innerHTML = '';
        });

        return token;
    }

    /**
     * Creates a new Aurum rendering root attached to a dom element
     * @param aurumRenderable the renderable to attach
     * @param dom the dom element to attach to
     * @returns a token that can be used to unmount the renderable
     */
    public static attach(aurumRenderable: Renderable, dom: HTMLElement): CancellationToken {
        if (aurumRenderable == undefined) {
            throw new Error('Cannot attach undefined renderable');
        }

        const session = createRenderSession();
        const content = renderInternal(aurumRenderable, session);
        if (content instanceof AurumElement) {
            content.attachToDom(dom, dom.childNodes.length);
            session.sessionToken.addCancellable(() => content.dispose());
        } else if (Array.isArray(content)) {
            const root = new ArrayAurumElement(new ArrayDataSource(content), createAPI(session));
            session.sessionToken.addCancellable(() => root.dispose());
            root.attachToDom(dom, dom.childNodes.length);
        } else if (content == undefined) {
        } else {
            dom.appendChild(content);
            session.sessionToken.addCancellable(() => {
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

    /**
     * Fragment works through factory by checking if the node is equal to this function
     */
    public static fragment() {}

    public static factory(
        node: string | ((props: any, children: Renderable[], api: AurumComponentAPI) => Renderable),
        args: MapLike<any>,
        ...innerNodes: Array<AurumElementModel<any> | ReadOnlyDataSource<any> | ReadOnlyArrayDataSource<any>>
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

        let model = {
            [aurumElementModelIdentitiy]: true,
            name,
            isIntrinsic: intrinsic,
            factory: node as (props: any, children: Renderable[], api: AurumComponentAPI) => Renderable,
            props: args,
            children: innerNodes
        };

        if (args != undefined && args.decorate != undefined) {
            if (Array.isArray(args.decorate)) {
                for (const decorate of args.decorate) {
                    model = decorate(model);
                }
            } else if (typeof args.decorate === 'function') {
                model = args.decorate(model);
            } else {
                throw new Error('Decorate must be a function or an array of functions');
            }
        }

        return model;
    }
}

export namespace Aurum {
    export namespace JSX {
        export interface IntrinsicAttributes {
            decorate?: AurumDecorator | AurumDecorator[];
        }
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
            optgroup: OptGroupProps;
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
            line: LineProps;
            rect: RectProps;
            defs: HTMLNodeProps<SVGDefsElement>;
            g: HTMLNodeProps<SVGGElement>;
            text: HTMLNodeProps<SVGTextElement>;
            tspan: HTMLNodeProps<SVGTSpanElement>;
            circle: CircleProps;
            ellipse: EllipseProps;
            polygon: PolygonProps;
            polyline: PolylineProps;
            path: PathProps;
            image: ImageProps;
            symbol: SymbolProps;
            use: UseProps;
            stop: StopProps;
            linearGradient: LinearGradientProps;
            radialGradient: RadialGradientProps;
            clipPath: ClipPathProps;
            pattern: PatternProps;
            mask: MaskProps;
            foreignObject: ForeignObjectProps;
            marker: MarkerProps;
        }
    }
}
