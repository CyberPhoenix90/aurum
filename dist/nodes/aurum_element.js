import { DataSource, ArrayDataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { ownerSymbol } from '../utilities/owner_symbol';
export class AurumElement {
    constructor(props, domNodeName) {
        var _a, _b;
        this.onDispose = props.onDispose;
        this.onAttach = props.onAttach;
        this.onDetach = props.onDetach;
        this.domNodeName = domNodeName;
        this.template = props.template;
        this.cancellationToken = new CancellationToken();
        this.node = this.create(props);
        this.initialize(props);
        (_b = (_a = props).onCreate) === null || _b === void 0 ? void 0 : _b.call(_a, this);
    }
    initialize(props) {
        if (!(this.node instanceof Text)) {
            this.children = [];
        }
        this.createEventHandlers([
            'drag',
            'name',
            'dragstart',
            'dragend',
            'dragexit',
            'dragover',
            'dragenter',
            'dragleave',
            'blur',
            'focus',
            'click',
            'dblclick',
            'keydown',
            'keyhit',
            'keyup',
            'mousedown',
            'mouseup',
            'mousemouse',
            'mouseenter',
            'mouseleave',
            'mousewheel'
        ], props);
        const dataProps = Object.keys(props).filter((e) => e.includes('-'));
        this.bindProps(['id', 'draggable', 'tabindex', 'style', 'role', 'contentEditable', ...dataProps], props);
        if (props.class) {
            this.handleClass(props.class);
        }
        if (props.repeatModel) {
            this.handleRepeat(props.repeatModel);
        }
    }
    bindProps(keys, props) {
        for (const key of keys) {
            if (props[key]) {
                this.assignStringSourceToAttribute(props[key], key);
            }
        }
    }
    createEventHandlers(keys, props) {
        if (this.node instanceof Text) {
            return;
        }
        for (const key of keys) {
            const computedEventName = 'on' + key[0].toUpperCase() + key.slice(1);
            let eventEmitter;
            Object.defineProperty(this, computedEventName, {
                get() {
                    if (!eventEmitter) {
                        eventEmitter = new DataSource();
                    }
                    return eventEmitter;
                },
                set() {
                    throw new Error(computedEventName + ' is read only');
                }
            });
            if (props[computedEventName]) {
                if (props[computedEventName] instanceof DataSource) {
                    this[computedEventName].listen(props[computedEventName].update.bind(props.onClick), this.cancellationToken);
                }
                else if (typeof props[computedEventName] === 'function') {
                    this[computedEventName].listen(props[computedEventName], this.cancellationToken);
                }
                this.cancellationToken.registerDomEvent(this.node, key, (e) => this[computedEventName].update(e));
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
        if (this.repeatData.length) {
            this.children.push(...this.repeatData.toArray().map((i) => this.template.generate(i)));
            this.render();
        }
        this.repeatData.listen((change) => {
            switch (change.operationDetailed) {
                case 'swap':
                    const itemA = this.children[change.index];
                    const itemB = this.children[change.index2];
                    this.children[change.index2] = itemA;
                    this.children[change.index] = itemB;
                    break;
                case 'append':
                    this.children.push(...change.items.map((i) => this.template.generate(i)));
                    break;
                case 'prepend':
                    this.children.unshift(...change.items.map((i) => this.template.generate(i)));
                    break;
                case 'remove':
                case 'removeLeft':
                case 'removeRight':
                case 'clear':
                    this.children.splice(change.index, change.count);
                    break;
                default:
                    this.children.length = 0;
                    this.children.push(...this.repeatData.toArray().map((i) => this.template.generate(i)));
                    break;
            }
            this.render();
        });
    }
    render() {
        if (this.node instanceof Text) {
            return;
        }
        for (let i = 0; i < this.children.length; i++) {
            if (this.node.childNodes.length <= i) {
                this.addChildrenDom(this.children.slice(i, this.children.length));
                break;
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
        if (this.node instanceof Text) {
            return;
        }
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
    handleAttach() {
        var _a, _b;
        if (this.node.isConnected) {
            (_b = (_a = this).onAttach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
            for (const child of this.node.childNodes) {
                child[ownerSymbol].handleAttach();
            }
        }
    }
    handleDetach() {
        var _a, _b;
        if (!this.node.isConnected) {
            (_b = (_a = this).onDetach) === null || _b === void 0 ? void 0 : _b.call(_a, this);
            for (const child of this.node.childNodes) {
                if (child[ownerSymbol]) {
                    child[ownerSymbol].handleDetach();
                }
            }
        }
    }
    handleClass(data) {
        if (this.node instanceof Text) {
            return;
        }
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
    create(props) {
        const node = document.createElement(this.domNodeName);
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
        if (this.node instanceof Text) {
            throw new Error("Text nodes don't have children");
        }
        for (const child of node.children) {
            if (child === node) {
                return true;
            }
        }
        return false;
    }
    addChildrenDom(children) {
        if (this.node instanceof Text) {
            throw new Error("Text nodes don't have children");
        }
        for (const child of children) {
            this.node.appendChild(child.node);
            child.handleAttach();
        }
    }
    swapChildrenDom(indexA, indexB) {
        if (this.node instanceof Text) {
            throw new Error("Text nodes don't have children");
        }
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
        if (this.node instanceof Text) {
            throw new Error("Text nodes don't have children");
        }
        if (index >= this.node.childElementCount) {
            this.node.appendChild(node);
            node[ownerSymbol].handleAttach();
        }
        else {
            this.node.insertBefore(node, this.node.children[index]);
            node[ownerSymbol].handleAttach();
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
        if (this.node instanceof Text) {
            throw new Error("Text nodes don't have children");
        }
        this.children.length = 0;
        this.render();
    }
    addChild(child) {
        if (this.node instanceof Text) {
            throw new Error("Text nodes don't have children");
        }
        if (child instanceof Template) {
            return;
        }
        child = this.childNodeToAurum(child);
        this.children.push(child);
        this.render();
    }
    childNodeToAurum(child) {
        if (typeof child === 'string' || child instanceof DataSource) {
            child = new TextNode({
                text: child
            });
        }
        else if (!(child instanceof AurumElement)) {
            child = new TextNode({
                text: child.toString()
            });
        }
        return child;
    }
    addChildAt(child, index) {
        if (this.node instanceof Text) {
            throw new Error("Text nodes don't have children");
        }
        if (child instanceof Template) {
            return;
        }
        child = this.childNodeToAurum(child);
        this.children.splice(index, 0, child);
        this.render();
    }
    addChildren(nodes) {
        if (this.node instanceof Text) {
            throw new Error("Text nodes don't have children");
        }
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
        this.cancellationToken.cancel();
        if (detach) {
            this.remove();
        }
        for (const child of this.node.childNodes) {
            if (child[ownerSymbol]) {
                child[ownerSymbol].internalDispose(false);
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
export class TextNode extends AurumElement {
    constructor(props) {
        super(props, 'textNode');
        if (props.text instanceof DataSource) {
            props.text.listen((v) => (this.node.textContent = v), this.cancellationToken);
        }
    }
    create(props) {
        const node = document.createTextNode(this.resolveStringSource(props.text));
        node[ownerSymbol] = this;
        return node;
    }
}
//# sourceMappingURL=aurum_element.js.map