import { Template } from '../nodes/aurum_element';
import { ownerSymbol } from './owner_symbol';
export class Aurum {
    static attach(node, dom) {
        if (dom[ownerSymbol]) {
            throw new Error('This node is already managed by aurum and cannot be used');
        }
        dom.appendChild(node.node);
        dom[ownerSymbol] = node;
    }
    static detach(domNode) {
        if (domNode[ownerSymbol]) {
            domNode[ownerSymbol].dispose();
            domNode[ownerSymbol] = undefined;
        }
    }
    static factory(node, args, ...innerNodes) {
        if (typeof node === 'string') {
            return;
        }
        const children = [].concat(...innerNodes).filter((e) => e);
        const templateMap = {};
        let defaultTemplate;
        let hasRef = false;
        for (const c of children) {
            if (typeof c === 'string') {
                continue;
            }
            if (c instanceof Template && (!c.ref || c.ref === 'default')) {
                defaultTemplate = c;
            }
            if (c.ref) {
                templateMap[c.ref] = c;
                hasRef = true;
            }
        }
        args = (args !== null && args !== void 0 ? args : {});
        if (defaultTemplate) {
            args.template = defaultTemplate;
        }
        if (hasRef) {
            args.templateMap = templateMap;
        }
        let instance;
        if (node.prototype) {
            instance = new node(args || {});
        }
        else {
            instance = node(args || {});
        }
        instance.addChildren(children);
        return instance;
    }
}
//# sourceMappingURL=aurum.js.map