import { Template } from '../nodes/special/aurum_element';
import { ownerSymbol } from './owner_symbol';
import { Div } from '../nodes/div';
import { Button } from '../nodes/button';
import { Input } from '../nodes/input';
import { Li } from '../nodes/li';
import { Span } from '../nodes/span';
import { Style } from '../nodes/style';
import { Audio } from '../nodes/audio';
import { Ul } from '../nodes/ul';
import { P } from '../nodes/p';
import { Img } from '../nodes/img';
import { Link } from '../nodes/link';
import { Canvas } from '../nodes/canvas';
import { A } from '../nodes/a';
import { Article } from '../nodes/article';
import { Br } from '../nodes/br';
import { Form } from '../nodes/form';
import { Label } from '../nodes/label';
import { Ol } from '../nodes/ol';
import { Pre } from '../nodes/pre';
import { Progress } from '../nodes/progress';
import { Table } from '../nodes/table';
import { Td } from '../nodes/td';
import { Tr } from '../nodes/tr';
import { Th } from '../nodes/th';
import { TextArea } from '../nodes/textarea';
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
import { Script } from '../nodes/script';
import { Abbr } from '../nodes/abbr';
import { Area } from '../nodes/area';
import { Aside } from '../nodes/aside';
import { Em } from '../nodes/em';
import { Heading } from '../nodes/heading';
import { IFrame } from '../nodes/iframe';
import { NoScript } from '../nodes/noscript';
import { Q } from '../nodes/q';
import { Select } from '../nodes/select';
import { Source } from '../nodes/source';
import { Title } from '../nodes/title';
import { Video } from '../nodes/video';
import { Tbody } from '../nodes/tbody';
import { Tfoot } from '../nodes/tfoot';
import { Thead } from '../nodes/thead';
import { Summary } from '../nodes/summary';
import { Details } from '../nodes/details';
import { Sub } from '../nodes/sub';
import { Sup } from '../nodes/sup';
import { Svg } from '../nodes/svg';
import { Data } from '../nodes/data';
import { Time } from '../nodes/time';
import { Option } from '../nodes/option';
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
    static attach(aurumElement, dom) {
        if (dom[ownerSymbol]) {
            throw new Error('This node is already managed by aurum and cannot be used');
        }
        dom.appendChild(aurumElement.node);
        aurumElement['handleAttach'](aurumElement);
        dom[ownerSymbol] = aurumElement;
    }
    static isAttached(dom) {
        return dom[ownerSymbol] !== undefined;
    }
    static detach(domNode) {
        if (domNode[ownerSymbol]) {
            domNode[ownerSymbol].node.remove();
            domNode[ownerSymbol].handleDetach();
            domNode[ownerSymbol].dispose();
            domNode[ownerSymbol] = undefined;
        }
    }
    static factory(node, args, ...innerNodes) {
        if (typeof node === 'string') {
            const type = node;
            node = nodeMap[node];
            if (node === undefined) {
                throw new Error(`Node ${type} does not exist or is not supported`);
            }
        }
        let children;
        if (innerNodes.length && Array.isArray(innerNodes[0])) {
            children = [].concat(...innerNodes).filter((e) => e);
        }
        else {
            children = innerNodes.filter((e) => e);
        }
        const templateMap = {};
        let defaultTemplate;
        let hasRef = false;
        for (const c of children) {
            if (typeof c === 'string') {
                continue;
            }
            if (c instanceof Template && (c.ref === undefined || c.ref === 'default')) {
                defaultTemplate = c;
            }
            if (c.ref !== undefined) {
                templateMap[c.ref] = c;
                hasRef = true;
            }
        }
        if (defaultTemplate) {
            args = (args !== null && args !== void 0 ? args : {});
            args.template = defaultTemplate;
        }
        if (hasRef) {
            args = (args !== null && args !== void 0 ? args : {});
            args.templateMap = templateMap;
        }
        let instance;
        if (node.prototype) {
            instance = new node(args, children);
        }
        else {
            instance = node(args, children);
        }
        return instance;
    }
}
//# sourceMappingURL=aurum.js.map