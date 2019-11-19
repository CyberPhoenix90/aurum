import { DataSource } from '../stream/data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { ArrayDataSource } from '../stream/array_data_source';
import { ownerSymbol } from '../utilities/owner_symbol';
export class AurumElement {
    constructor(props, domNodeName) {
        this.domNodeName = domNodeName;
        this.template = props.template;
        this.cancellationToken = new CancellationToken();
        this.node = this.create(props);
        this.initialize(props);
        if (props.onAttach) {
            props.onAttach(this);
        }
    }
    initialize(props) {
        this.node.owner = this;
        this.createEventHandlers(['blur', 'focus', 'click', 'dblclick', 'keydown', 'keyhit', 'keyup', 'mousedown, mouseup', 'mouseenter', 'mouseleave', 'mousewheel'], props);
        this.bindProps(['id', 'draggable', 'tabindex', 'style'], props);
        if (props.class) {
            this.handleClass(props.class);
        }
        if (props.repeatModel) {
            this.cachedChildren = [];
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
            }
            this.cancellationToken.registerDomEvent(this.node, key, (e) => this[computedEventName].update(e));
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
            this.cachedChildren.push(...this.repeatData.toArray().map((i) => this.template.generate(i)));
            this.renderRepeat();
        }
        this.repeatData.onChange.subscribe((change) => {
            switch (change.operation) {
                case 'append':
                    this.cachedChildren.push(...change.items.map((i) => this.template.generate(i)));
                    break;
                case 'removeLeft':
                    this.cachedChildren.splice(0, change.count);
                    break;
                case 'removeRight':
                    this.cachedChildren.splice(this.node.childElementCount - change.count, change.count);
                    break;
                case 'remove':
                    this.cachedChildren.splice(change.index, change.count);
                    break;
                default:
                    this.cachedChildren.length = 0;
                    this.cachedChildren.push(...this.repeatData.toArray().map((i) => this.template.generate(i)));
                    break;
            }
            this.renderRepeat();
        });
    }
    renderRepeat() {
        if (this.rerenderPending) {
            return;
        }
        setTimeout(() => {
            for (let i = 0; i < this.cachedChildren.length; i++) {
                if (this.node.childElementCount <= i) {
                    this.addChildren(this.cachedChildren.slice(i, this.cachedChildren.length));
                    break;
                }
                if (this.node.children[i].owner !== this.cachedChildren[i]) {
                    if (!this.cachedChildren.includes(this.node.children[i].owner)) {
                        this.node.children[i][ownerSymbol].remove();
                        i--;
                        continue;
                    }
                    const index = this.getChildIndex(this.cachedChildren[i].node);
                    if (index !== -1) {
                        this.swapChildren(i, index);
                    }
                    else {
                        this.addChildAt(this.cachedChildren[i], i);
                    }
                }
            }
            while (this.node.childElementCount > this.cachedChildren.length) {
                this.node[ownerSymbol].removeChild(this.node.lastChild[ownerSymbol]);
            }
            this.rerenderPending = false;
        });
        this.rerenderPending = true;
    }
    assignStringSourceToAttribute(data, key) {
        if (typeof data === 'string') {
            this.node[key] = data;
        }
        else {
            if (data.value) {
                this.node[key] = data.value;
            }
            data.unique(this.cancellationToken).listen((v) => (this.node.id = v), this.cancellationToken);
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
    create(props) {
        const node = document.createElement(this.domNodeName);
        node[ownerSymbol] = this;
        return node;
    }
    getChildIndex(node) {
        let i = 0;
        for (const child of node.children) {
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
    setInnerText(value) {
        if (this.node.firstChild instanceof HTMLElement) {
            throw new Error('Cannot combine text and child nodes into a single element');
        }
        this.node.innerText = value;
    }
    swapChildren(indexA, indexB) {
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
        if (index >= this.node.childElementCount) {
            this.node.appendChild(node);
        }
        else {
            this.node.insertBefore(node, this.node.children[index]);
        }
    }
    remove() {
        if (this.hasParent()) {
            this.node.parentElement.removeChild(this.node);
            this.dispose();
        }
    }
    hasParent() {
        return !!this.node.parentElement;
    }
    isConnected() {
        return this.node.isConnected;
    }
    removeChild(child) {
        child.dispose();
        this.node.removeChild(child.node);
    }
    removeChildAt(index) {
        const childNode = this.node.childNodes[index];
        if (childNode) {
            const child = childNode[ownerSymbol];
            child.dispose();
            this.node.removeChild(child.node);
        }
    }
    clearChildren() {
        while (this.node.firstChild) {
            const owner = this.node.firstChild[ownerSymbol];
            owner.dispose();
            this.node.removeChild(this.node.firstChild);
        }
    }
    addChild(child) {
        if (child.node instanceof Template) {
            return;
        }
        return this.node.appendChild(child.node);
    }
    addChildAt(child, index) {
        if (child.node instanceof Template) {
            return;
        }
        return this.addDomNodeAt(child.node, index);
    }
    addChildren(nodes) {
        if (nodes.length === 0) {
            return;
        }
        let dataSegments = [];
        for (const c of nodes) {
            if (c instanceof Template) {
                continue;
            }
            if (typeof c === 'string') {
                dataSegments.push(c);
            }
            else if (c instanceof DataSource) {
                dataSegments.push(c);
                this.setInnerText(c.value);
                c.listen((v) => {
                    const value = dataSegments.reduce((p, c) => { var _a; return p + (c instanceof DataSource ? (_a = c.value, (_a !== null && _a !== void 0 ? _a : '')).toString() : c); }, '');
                    this.setInnerText(value);
                }, this.cancellationToken);
            }
            else {
                this.node.appendChild(c.node);
            }
        }
        if (dataSegments.length) {
            const value = dataSegments.reduce((p, c) => { var _a; return p + (c instanceof DataSource ? (_a = c.value, (_a !== null && _a !== void 0 ? _a : '')).toString() : c); }, '');
            this.setInnerText(value);
        }
    }
    dispose() {
        this.cancellationToken.cancel();
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