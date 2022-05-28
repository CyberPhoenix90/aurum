import { createVDOM, CancellationToken, registerRenderPlugin, Renderable, RenderPlugin, VDomNodeType, VDomStaticNode } from '@aurum/core';
import { A, Div, Span } from './intrinsics';

const htmlNodeSymbol = Symbol('htmlNode');

const plugin: RenderPlugin<any, any> = {
    config: {},
    name: 'html',
    targetNodeSymbol: htmlNodeSymbol,
    onNodeAttached: (node: VDomStaticNode<any>, config: any) => {
        if (node.staticParent) {
            node.staticParent.renderData.appendChild(node.renderData);
        }
    },
    renderNode: (node: VDomStaticNode<any>, config: any) => {
        const data = node.inputData;

        if (data.name) {
            switch (data.name) {
                case 'a':
                    return A(node.inputData.props);
                case 'div':
                    return Div(node.inputData.props);
                case 'span':
                    return Span(node.inputData.props);
                default:
                    throw new Error(`Unknown html tag ${data.name}`);
            }
        }

        const type = typeof node.inputData;

        if (type === 'string') {
            return document.createTextNode(data);
        } else if (type === 'number' || type === 'bigint' || type === 'boolean') {
            return document.createTextNode(data.toString());
        } else {
            throw new Error('Not implemented');
        }
    },
    intrinsics: [
        'div',
        'span',
        'p',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'a',
        'img',
        'button',
        'input',
        'textarea',
        'select',
        'option',
        'label',
        'ul',
        'li',
        'ol',
        'pre',
        'code',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'hr',
        'br',
        'b',
        'i',
        'u',
        's',
        'strong',
        'em',
        'sub',
        'sup',
        'small',
        'big',
        'blockquote',
        'del',
        'ins',
        'q',
        'cite',
        'dfn',
        'abbr',
        'time',
        'mark',
        'ruby',
        'rt',
        'rp',
        'bdi',
        'bdo',
        'wbr',
        'foreignObject',
        'desc',
        'title',
        'style',
        'link',
        'meta',
        'base',
        'head',
        'body',
        'html'
    ]
};

registerRenderPlugin(plugin);

export function renderAsHTML(rootRenderable: Renderable, lifeCycle: CancellationToken = CancellationToken.forever): HTMLElement {
    const { vdom, triggerAttach, triggerDetach, dispose } = createVDOM(rootRenderable, htmlNodeSymbol);

    triggerAttach();
    lifeCycle.addCancelable(() => {
        triggerDetach();
        dispose();
    });

    if (vdom.type == VDomNodeType.STATIC) {
        return vdom.renderData;
    } else {
        throw new Error('Not implemented');
    }
}

export function attachToDom(rootRenderable: Renderable, target: HTMLElement, lifeCycle: CancellationToken = CancellationToken.forever): void {
    const { vdom, triggerAttach, triggerDetach, dispose } = createVDOM(rootRenderable, htmlNodeSymbol);

    triggerAttach();
    lifeCycle.addCancelable(() => {
        triggerDetach();
        dispose();
    });

    if (vdom.type == VDomNodeType.STATIC) {
        target.appendChild(vdom.renderData);
    } else {
        throw new Error('Not implemented');
    }
}
