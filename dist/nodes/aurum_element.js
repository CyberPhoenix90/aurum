import { DataSource, ArrayDataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { ownerSymbol } from '../utilities/owner_symbol';
import { AurumTextElement } from './aurum_text';
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
    constructor(props, domNodeName) {
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
    }
    initialize(props) {
        this.createEventHandlers(defaultEvents, props);
        const dataProps = Object.keys(props).filter((e) => e.includes('-'));
        this.bindProps(defaultProps, props, dataProps);
        if (props.class) {
            this.handleClass(props.class);
        }
        if (props.repeatModel) {
            this.handleRepeat(props.repeatModel);
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
                const eventName = props[events[key]];
                if (props[eventName] instanceof DataSource) {
                    this.node.addEventListener(key, (e) => props[eventName].update(e));
                }
                else if (typeof props[eventName] === 'function') {
                    this.node.addEventListener(key, (e) => props[eventName](e));
                }
            }
        }
    }
    handleRepeat(dataSource) {
        if (dataSource instanceof ArrayDataSource) {
            this.repeatData = dataSource;
        }
        else {
            this.repeatData = new ArrayDataSource(dataSource);
        }
        this.repeatData.listenAndRepeat((change) => {
            switch (change.operationDetailed) {
                case 'swap':
                    const itemA = this.children[change.index];
                    const itemB = this.children[change.index2];
                    this.children[change.index2] = itemA;
                    this.children[change.index] = itemB;
                    break;
                case 'append':
                    const old = this.children;
                    this.children = new Array(old.length);
                    let i = 0;
                    for (i = 0; i < old.length; i++) {
                        this.children[i] = old[i];
                    }
                    for (let index = 0; index < change.items.length; index++) {
                        this.children[i + index] = this.template.generate(change.items[index]);
                    }
                    break;
                case 'prepend':
                    this.children.unshift(...change.items.map((i) => this.template.generate(i)));
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
            this.render();
        });
    }
    render() {
        if (this.cancellationToken.isCanceled) {
            return;
        }
        for (let i = 0; i < this.children.length; i++) {
            if (this.node.childNodes.length <= i) {
                for (let n = i; n < this.children.length; n++) {
                    this.addChildDom(this.children[n]);
                }
                return;
            }
            if (this.node.childNodes[i][ownerSymbol] !== this.children[i]) {
                if (!this.children.includes(this.node.childNodes[i][ownerSymbol])) {
                    const child = this.node.childNodes[i];
                    child.remove();
                    child[ownerSymbol].dispose();
                    i--;
                    continue;
                }
                const index = this.getChildIndex(this.children[i].node);
                if (index !== -1) {
                    this.swapChildrenDom(i, index);
                }
                else {
                    this.addDomNodeAt(this.children[i].node, i);
                }
            }
        }
        while (this.node.childNodes.length > this.children.length) {
            const child = this.node.childNodes[this.node.childNodes.length - 1];
            this.node.removeChild(child);
            child[ownerSymbol].dispose();
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
        var _a, _b, _c, _d;
        if (this.needAttach) {
            if (parent.isConnected) {
                (_b = (_a = this).onAttach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
                for (const child of this.node.childNodes) {
                    (_d = (_c = child[ownerSymbol]).handleAttach) === null || _d === void 0 ? void 0 : _d.call(_c, this);
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
        for (const child of node.childNodes) {
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
        if (child instanceof Template) {
            return;
        }
        child = this.childNodeToAurum(child);
        this.children.push(child);
        this.render();
    }
    childNodeToAurum(child) {
        if (typeof child === 'string' || child instanceof DataSource) {
            child = new AurumTextElement(child);
        }
        else if (!(child instanceof AurumElement)) {
            child = new AurumTextElement(child.toString());
        }
        return child;
    }
    addChildAt(child, index) {
        if (child instanceof Template) {
            return;
        }
        child = this.childNodeToAurum(child);
        this.children.splice(index, 0, child);
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
    constructor(props) {
        super(props, 'template');
        this.ref = props.ref;
        this.generate = props.generator;
    }
}
//# sourceMappingURL=aurum_element.js.map