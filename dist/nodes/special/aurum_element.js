import { ArrayDataSource, DataSource } from '../../stream/data_source';
import { CancellationToken } from '../../utilities/cancellation_token';
import { ownerSymbol } from '../../utilities/owner_symbol';
import { AurumTextElement } from './aurum_text';
import { EventEmitter } from '../../utilities/event_emitter';
const defaultEvents = {
    drag: 'onDrag',
    dragstart: 'onDragStart',
    dragend: 'onDragEnd',
    dragexit: 'onDragExit',
    dragover: 'onDragOver',
    dragenter: 'onDragEnter',
    dragleave: 'onDragLeave',
    blur: 'onBlur',
    focus: 'onFocus',
    click: 'onClick',
    dblclick: 'onDblClick',
    keydown: 'onKeyDown',
    keyhit: 'onKeyHit',
    keyup: 'onKeyUp',
    mousedown: 'onMouseDown',
    mouseup: 'onMouseUp',
    mousemove: 'onMouseMove',
    mouseenter: 'onMouseEnter',
    mouseleave: 'onMouseLeave',
    mousewheel: 'onMouseWheel'
};
const defaultProps = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contentEditable'];
export class AurumElement {
    constructor(props, children, domNodeName) {
        var _a, _b;
        this.cancellationToken = new CancellationToken();
        this.node = this.create(domNodeName);
        this.children = [];
        if (props !== null) {
            this.onDispose = props.onDispose;
            if (props.onAttach) {
                this.onAttach = props.onAttach;
                this.needAttach = true;
            }
            this.onDetach = props.onDetach;
            this.template = props.template;
            this.initialize(props);
            (_b = (_a = props).onCreate) === null || _b === void 0 ? void 0 : _b.call(_a, this);
        }
        if (children) {
            this.addChildren(children);
        }
    }
    initialize(props) {
        this.createEventHandlers(defaultEvents, props);
        const dataProps = Object.keys(props).filter((e) => e.includes('-'));
        this.bindProps(defaultProps, props, dataProps);
        if (props.class) {
            this.handleClass(props.class);
        }
    }
    bindProps(keys, props, dynamicProps) {
        for (const key of keys) {
            if (props[key]) {
                this.assignStringSourceToAttribute(props[key], key);
            }
        }
        if (dynamicProps) {
            for (const key of dynamicProps) {
                if (props[key]) {
                    this.assignStringSourceToAttribute(props[key], key);
                }
            }
        }
    }
    createEventHandlers(events, props) {
        for (const key in events) {
            if (props[events[key]]) {
                if (props[events[key]] instanceof DataSource) {
                    this.node.addEventListener(key, (e) => props[events[key]].update(e));
                }
                else if (typeof props[events[key]] === 'function') {
                    this.node.addEventListener(key, (e) => props[events[key]](e));
                }
            }
        }
    }
    render() {
        if (this.cancellationToken.isCanceled) {
            return;
        }
        let absoluteIndex = 0;
        for (let i = 0; i < this.children.length; i++, absoluteIndex++) {
            if (this.children[i] instanceof AurumFragment) {
                const fragment = this.children[i];
                for (let j = 0; j < fragment.children.length; j++, absoluteIndex++) {
                    this.renderChild(fragment.children[j], absoluteIndex);
                }
                absoluteIndex--;
            }
            else {
                this.renderChild(this.children[i], absoluteIndex);
            }
        }
        while (this.node.childNodes.length > absoluteIndex) {
            const child = this.node.childNodes[this.node.childNodes.length - 1];
            this.node.removeChild(child);
            child[ownerSymbol].dispose();
        }
    }
    renderChild(child, index) {
        if (this.node.childNodes.length <= index) {
            return this.addChildDom(child);
        }
        if (this.node.childNodes[index][ownerSymbol] !== child) {
            const childIndex = this.getChildIndex(child.node);
            if (childIndex !== -1) {
                this.swapChildrenDom(index, childIndex);
            }
            else {
                this.addDomNodeAt(child.node, index);
            }
        }
    }
    assignStringSourceToAttribute(data, key) {
        if (typeof data === 'string') {
            this.node.setAttribute(key, data);
        }
        else {
            if (data.value) {
                this.node.setAttribute(key, data.value);
            }
            data.unique(this.cancellationToken).listen((v) => this.node.setAttribute(key, v), this.cancellationToken);
        }
    }
    handleAttach(parent) {
        var _a, _b, _c, _d, _e;
        if (this.needAttach) {
            if (parent.isConnected()) {
                (_b = (_a = this).onAttach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
                for (const child of this.node.childNodes) {
                    (_e = (_c = child[ownerSymbol]) === null || _c === void 0 ? void 0 : (_d = _c).handleAttach) === null || _e === void 0 ? void 0 : _e.call(_d, this);
                }
            }
            else {
                parent.needAttach = true;
            }
        }
    }
    handleDetach() {
        var _a, _b, _c, _d;
        if (!this.node.isConnected) {
            (_b = (_a = this).onDetach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
            for (const child of this.node.childNodes) {
                if (child[ownerSymbol]) {
                    (_d = (_c = child[ownerSymbol]).handleDetach) === null || _d === void 0 ? void 0 : _d.call(_c);
                }
            }
        }
    }
    handleClass(data) {
        if (typeof data === 'string') {
            this.node.className = data;
        }
        else if (data instanceof DataSource) {
            if (data.value) {
                if (Array.isArray(data.value)) {
                    this.node.className = data.value.join(' ');
                    data.unique(this.cancellationToken).listen(() => {
                        this.node.className = data.value.join(' ');
                    }, this.cancellationToken);
                }
                else {
                    this.node.className = data.value;
                    data.unique(this.cancellationToken).listen(() => {
                        this.node.className = data.value;
                    }, this.cancellationToken);
                }
            }
            data.unique(this.cancellationToken).listen((v) => (this.node.className = v), this.cancellationToken);
        }
        else {
            const value = data.reduce((p, c) => {
                if (typeof c === 'string') {
                    return `${p} ${c}`;
                }
                else {
                    if (c.value) {
                        return `${p} ${c.value}`;
                    }
                    else {
                        return p;
                    }
                }
            }, '');
            this.node.className = value;
            for (const i of data) {
                if (i instanceof DataSource) {
                    i.unique(this.cancellationToken).listen((v) => {
                        const value = data.reduce((p, c) => {
                            if (typeof c === 'string') {
                                return `${p} ${c}`;
                            }
                            else {
                                if (c.value) {
                                    return `${p} ${c.value}`;
                                }
                                else {
                                    return p;
                                }
                            }
                        }, '');
                        this.node.className = value;
                    }, this.cancellationToken);
                }
            }
        }
    }
    resolveStringSource(source) {
        if (typeof source === 'string') {
            return source;
        }
        else {
            return source.value;
        }
    }
    create(domNodeName) {
        const node = document.createElement(domNodeName);
        node[ownerSymbol] = this;
        return node;
    }
    getChildIndex(node) {
        let i = 0;
        for (const child of this.node.childNodes) {
            if (child === node) {
                return i;
            }
            i++;
        }
        return -1;
    }
    hasChild(node) {
        for (const child of node.children) {
            if (child === node) {
                return true;
            }
        }
        return false;
    }
    addChildDom(child) {
        var _a, _b;
        this.node.appendChild(child.node);
        (_b = (_a = child).handleAttach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
    }
    swapChildrenDom(indexA, indexB) {
        if (indexA === indexB) {
            return;
        }
        const nodeA = this.node.children[indexA];
        const nodeB = this.node.children[indexB];
        nodeA.remove();
        nodeB.remove();
        if (indexA < indexB) {
            this.addDomNodeAt(nodeB, indexA);
            this.addDomNodeAt(nodeA, indexB);
        }
        else {
            this.addDomNodeAt(nodeA, indexB);
            this.addDomNodeAt(nodeB, indexA);
        }
    }
    addDomNodeAt(node, index) {
        var _a, _b, _c, _d;
        if (index >= this.node.childElementCount) {
            this.node.appendChild(node);
            (_b = (_a = node[ownerSymbol]).handleAttach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
        }
        else {
            this.node.insertBefore(node, this.node.children[index]);
            (_d = (_c = node[ownerSymbol]).handleAttach) === null || _d === void 0 ? void 0 : _d.call(_c, this);
        }
    }
    remove() {
        if (this.hasParent()) {
            this.node.parentElement[ownerSymbol].removeChild(this.node);
        }
    }
    hasParent() {
        return !!this.node.parentElement;
    }
    isConnected() {
        return this.node.isConnected;
    }
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
        this.render();
    }
    removeChildAt(index) {
        this.children.splice(index, 1);
        this.render();
    }
    swapChildren(indexA, indexB) {
        if (indexA === indexB) {
            return;
        }
        const nodeA = this.children[indexA];
        const nodeB = this.children[indexB];
        this.children[indexA] = nodeB;
        this.children[indexB] = nodeA;
        this.render();
    }
    clearChildren() {
        this.children.length = 0;
        this.render();
    }
    addChild(child) {
        if (Array.isArray(child)) {
            for (const subChild of child) {
                this.addChild(subChild);
            }
            return;
        }
        if (child instanceof Template) {
            return;
        }
        this.children.push(this.childNodeToAurum(child));
        this.render();
    }
    childNodeToAurum(child) {
        if (child instanceof AurumElement) {
            return child;
        }
        if (child instanceof Promise) {
            const result = new AurumFragment({});
            child.then((value) => {
                result.addChildren([value]);
                this.render();
            });
            return result;
        }
        else if (child instanceof ArrayDataSource) {
            const result = new AurumFragment({ repeatModel: child });
            result.onChange.subscribe(() => this.render(), this.cancellationToken);
            return result;
        }
        else if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean' || typeof child === 'bigint') {
            return new AurumTextElement(child.toString());
        }
        else if (child instanceof DataSource) {
            const result = new AurumFragment({}, [child]);
            result.onChange.subscribe(() => this.render(), this.cancellationToken);
            return result;
        }
        else {
            throw new Error('Unsupported child type');
        }
    }
    addChildAt(child, index) {
        if (child instanceof Template) {
            return;
        }
        this.children.splice(index, 0, this.childNodeToAurum(child));
        this.render();
    }
    addChildren(nodes) {
        if (nodes.length === 0) {
            return;
        }
        for (const child of nodes) {
            this.addChild(child);
        }
    }
    dispose() {
        this.internalDispose(true);
    }
    internalDispose(detach) {
        var _a, _b;
        if (this.cancellationToken.isCanceled) {
            return;
        }
        this.cancellationToken.cancel();
        if (detach) {
            this.remove();
        }
        for (const child of this.node.childNodes) {
            if (child[ownerSymbol]) {
                child[ownerSymbol].dispose(false);
            }
        }
        delete this.node[ownerSymbol];
        delete this.node;
        (_b = (_a = this).onDispose) === null || _b === void 0 ? void 0 : _b.call(_a, this);
    }
}
export class Template extends AurumElement {
    constructor(props, children) {
        super(props, children, 'template');
        this.ref = props.ref;
        this.generate = props.generator;
    }
}
export class AurumFragment {
    constructor(props, children) {
        this.onChange = new EventEmitter();
        this.children = [];
        if (props.repeatModel) {
            this.handleRepeat(props.repeatModel);
        }
        else if (children) {
            this.addChildren(children);
        }
    }
    addChildren(children) {
        for (const child of children) {
            if (child instanceof AurumElement) {
                this.children.push(child);
            }
            else if (child instanceof DataSource) {
                let sourceChild = undefined;
                const freshnessToken = { ts: undefined };
                child.unique(this.cancellationToken).listenAndRepeat((newValue) => {
                    freshnessToken.ts = Date.now();
                    if (Array.isArray(newValue)) {
                        this.children.length = 0;
                        this.onChange.fire();
                        for (const newSubValue of newValue) {
                            this.handleSourceChild(newSubValue, undefined, child, freshnessToken, freshnessToken.ts);
                        }
                    }
                    else {
                        sourceChild = this.handleSourceChild(newValue, sourceChild, child, freshnessToken, freshnessToken.ts);
                    }
                });
            }
            else {
                throw new Error('case not yet implemented');
            }
        }
    }
    handleSourceChild(newValue, sourceChild, child, freshnessToken, timestamp) {
        if ((newValue === undefined || newValue === null) && sourceChild) {
            this.children.splice(this.children.indexOf(sourceChild), 1);
            sourceChild = undefined;
            this.onChange.fire();
        }
        else if (typeof newValue === 'string' || typeof newValue === 'bigint' || typeof newValue === 'number' || typeof newValue === 'boolean') {
            if (!sourceChild) {
                const textNode = new AurumTextElement(child);
                this.children.push(textNode);
                sourceChild = textNode;
                this.onChange.fire();
            }
            else if (sourceChild instanceof AurumElement) {
                const textNode = new AurumTextElement(child);
                this.children.splice(this.children.indexOf(sourceChild), 1, textNode);
                sourceChild = textNode;
                this.onChange.fire();
            }
        }
        else if (newValue instanceof AurumElement) {
            if (!sourceChild) {
                this.children.push(newValue);
                sourceChild = newValue;
                this.onChange.fire();
            }
            else if (sourceChild instanceof AurumTextElement || sourceChild !== newValue) {
                this.children.splice(this.children.indexOf(sourceChild), 1, newValue);
                sourceChild = newValue;
                this.onChange.fire();
            }
        }
        else if (newValue instanceof Promise) {
            newValue.then((value) => {
                if (freshnessToken.ts === timestamp) {
                    this.addChildren([value]);
                    this.onChange.fire();
                }
            });
        }
        return sourceChild;
    }
    handleRepeat(dataSource) {
        dataSource.listenAndRepeat((change) => {
            switch (change.operationDetailed) {
                case 'replace':
                    this.children[change.index] = change.items[0];
                    break;
                case 'swap':
                    const itemA = this.children[change.index];
                    const itemB = this.children[change.index2];
                    this.children[change.index2] = itemA;
                    this.children[change.index] = itemB;
                    break;
                case 'append':
                    this.children = this.children.concat(change.items);
                    break;
                case 'prepend':
                    this.children.unshift(...change.items);
                    break;
                case 'remove':
                case 'removeLeft':
                case 'removeRight':
                    this.children.splice(change.index, change.count);
                    break;
                case 'clear':
                    this.children = [];
                    break;
                default:
                    throw new Error('unhandled operation');
            }
            this.onChange.fire();
        });
    }
    dispose() {
        if (this.cancellationToken.isCanceled) {
            return;
        }
        this.cancellationToken.cancel();
    }
}
//# sourceMappingURL=aurum_element.js.map