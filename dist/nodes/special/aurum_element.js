import { ArrayDataSource, DataSource } from '../../stream/data_source';
import { ownerSymbol } from '../../utilities/owner_symbol';
import { AurumTextElement } from './aurum_text';
import { EventEmitter } from '../../utilities/event_emitter';
import { DuplexDataSource } from '../../stream/duplex_data_source';
/**
 * @inernal
 */
export const aurumElementModelIdentitiy = Symbol('AurumElementModel');
/**
 * @internal
 */
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
    mousewheel: 'onMouseWheel',
    load: 'onLoad',
    error: 'onError'
};
/**
 * @internal
 */
const defaultProps = ['id', 'name', 'draggable', 'tabindex', 'style', 'role', 'contentEditable'];
export function prerender(model) {
    if (model && model[aurumElementModelIdentitiy]) {
        const result = model.constructor(model.props, model.innerNodes);
        return prerender(result);
    }
    else {
        return model;
    }
}
export class AurumElement {
    constructor(props, children, domNodeName) {
        var _a;
        this.node = this.create(domNodeName);
        this.children = [];
        if (props != null) {
            if (props.onAttach) {
                this.onAttach = props.onAttach;
                this.needAttach = true;
            }
            this.onDetach = props.onDetach;
            this.initialize(props);
            (_a = props.onCreate) === null || _a === void 0 ? void 0 : _a.call(props, this.node);
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
                else if (props[events[key]] instanceof DuplexDataSource) {
                    this.node.addEventListener(key, (e) => props[events[key]].updateDownstream(e));
                }
                else if (typeof props[events[key]] === 'function') {
                    this.node.addEventListener(key, (e) => props[events[key]](e));
                }
            }
        }
    }
    render() {
        let absoluteIndex = 0;
        for (let i = 0; i < this.children.length; i++, absoluteIndex++) {
            if (this.children[i] instanceof AurumFragment) {
                absoluteIndex = this.renderFragment(this.children[i], absoluteIndex);
            }
            else {
                this.renderChild(this.children[i], absoluteIndex);
            }
        }
        while (this.node.childNodes.length > absoluteIndex) {
            const child = this.node.childNodes[this.node.childNodes.length - 1];
            this.node.removeChild(child);
        }
    }
    renderFragment(fragment, absoluteIndex) {
        for (let j = 0; j < fragment.children.length; j++, absoluteIndex++) {
            if (fragment.children[j] instanceof AurumFragment) {
                absoluteIndex = this.renderFragment(fragment.children[j], absoluteIndex);
            }
            else {
                this.renderChild(fragment.children[j], absoluteIndex);
            }
        }
        absoluteIndex--;
        return absoluteIndex;
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
        if (typeof data === 'string' || typeof data === 'boolean') {
            if (typeof data === 'boolean') {
                if (data) {
                    this.node.setAttribute(key, '');
                }
                else {
                    this.node.removeAttribute(key);
                }
            }
            else {
                this.node.setAttribute(key, data);
            }
        }
        else {
            data.unique().listenAndRepeat((v) => {
                if (typeof v === 'boolean') {
                    if (v) {
                        this.node.setAttribute(key, '');
                    }
                    else {
                        this.node.removeAttribute(key);
                    }
                }
                else {
                    this.node.setAttribute(key, v);
                }
            });
        }
    }
    handleAttach(parent) {
        var _a, _b, _c;
        if (this.needAttach) {
            if (parent.isConnected()) {
                (_a = this.onAttach) === null || _a === void 0 ? void 0 : _a.call(this, this.node);
                for (const child of this.node.childNodes) {
                    (_c = (_b = child[ownerSymbol]) === null || _b === void 0 ? void 0 : _b.handleAttach) === null || _c === void 0 ? void 0 : _c.call(_b, this);
                }
            }
            else {
                parent.needAttach = true;
            }
        }
    }
    //@ts-ignore
    handleDetach() {
        var _a, _b, _c;
        if (!this.node.isConnected) {
            (_a = this.onDetach) === null || _a === void 0 ? void 0 : _a.call(this, this.node);
            for (const child of this.node.childNodes) {
                if (child[ownerSymbol]) {
                    (_c = (_b = child[ownerSymbol]).handleDetach) === null || _c === void 0 ? void 0 : _c.call(_b);
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
                    data.unique().listen(() => {
                        this.node.className = data.value.join(' ');
                    });
                }
                else {
                    this.node.className = data.value;
                    data.unique().listen(() => {
                        this.node.className = data.value;
                    });
                }
            }
            data.unique().listen((v) => (this.node.className = v));
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
                    i.unique().listen((v) => {
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
                    });
                }
            }
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
        var _a;
        this.node.appendChild(child.node);
        (_a = child.handleAttach) === null || _a === void 0 ? void 0 : _a.call(child, this);
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
        if (child === undefined || child === null) {
            return;
        }
        if (child[aurumElementModelIdentitiy]) {
            //@ts-ignore
            child = prerender(child);
            if (child === undefined) {
                return;
            }
        }
        if (Array.isArray(child)) {
            for (const subChild of child) {
                this.addChild(subChild);
            }
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
            //@ts-ignore
            child.then((value) => {
                result.addChildren([value]);
                this.render();
            });
            return result;
        }
        else if (child instanceof ArrayDataSource) {
            //@ts-ignore
            const result = new AurumFragment({ repeatModel: child });
            result.onChange.subscribe(() => this.render());
            return result;
        }
        else if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean' || typeof child === 'bigint') {
            return new AurumTextElement(child.toString());
        }
        else if (child instanceof DataSource) {
            //@ts-ignore
            const result = new AurumFragment({}, [child]);
            result.onChange.subscribe(() => this.render());
            return result;
        }
        else {
            throw new Error('Unsupported child type');
        }
    }
    addChildAt(child, index) {
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
}
/**
 * @internal
 */
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
            let renderable;
            if (child[aurumElementModelIdentitiy]) {
                renderable = prerender(child);
            }
            else {
                renderable = child;
            }
            if (renderable instanceof AurumElement) {
                this.children.push(renderable);
            }
            else if (renderable instanceof DataSource) {
                let sourceChild = undefined;
                let wasArray;
                const freshnessToken = { ts: undefined };
                renderable.unique().listenAndRepeat((newValue) => {
                    freshnessToken.ts = Date.now();
                    if ((newValue === undefined || newValue === null) && wasArray) {
                        this.children.length = 0;
                        this.onChange.fire();
                        wasArray = false;
                        return;
                    }
                    else if (!Array.isArray(newValue) && wasArray) {
                        this.children.length = 0;
                        this.onChange.fire();
                        wasArray = false;
                    }
                    if (Array.isArray(newValue)) {
                        wasArray = true;
                        this.children.length = 0;
                        this.onChange.fire();
                        for (const newSubValue of newValue) {
                            this.handleSourceChild(newSubValue, undefined, undefined, freshnessToken, freshnessToken.ts);
                        }
                    }
                    else {
                        sourceChild = this.handleSourceChild(newValue, sourceChild, renderable, freshnessToken, freshnessToken.ts);
                    }
                });
            }
            else {
                throw new Error('case not yet implemented');
            }
        }
    }
    handleSourceChild(newValue, sourceChild, dataSource, freshnessToken, timestamp) {
        if (newValue === undefined || newValue === null) {
            if (sourceChild) {
                this.children.splice(this.children.indexOf(sourceChild), 1);
                sourceChild = undefined;
                this.onChange.fire();
            }
            return;
        }
        if (newValue[aurumElementModelIdentitiy]) {
            newValue = prerender(newValue);
        }
        if (typeof newValue === 'string' || typeof newValue === 'bigint' || typeof newValue === 'number' || typeof newValue === 'boolean') {
            if (!sourceChild) {
                const textNode = new AurumTextElement(dataSource !== null && dataSource !== void 0 ? dataSource : newValue);
                this.children.push(textNode);
                sourceChild = textNode;
                this.onChange.fire();
            }
            else if (sourceChild instanceof AurumElement) {
                const textNode = new AurumTextElement(dataSource !== null && dataSource !== void 0 ? dataSource : newValue);
                this.children.splice(this.children.indexOf(sourceChild), 1, textNode);
                sourceChild = textNode;
                this.onChange.fire();
            }
        }
        else if (newValue instanceof AurumElement) {
            if (newValue !== sourceChild) {
                if (sourceChild) {
                    this.children.splice(this.children.indexOf(sourceChild), 1, newValue);
                }
                else {
                    this.children.push(newValue);
                }
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
        else if (newValue instanceof DataSource) {
            if (!sourceChild) {
                const result = new AurumFragment({}, [newValue]);
                sourceChild = result;
                this.children.push(result);
                result.onChange.subscribe(() => this.onChange.fire());
                this.onChange.fire();
            }
            else if (sourceChild !== newValue) {
                const result = new AurumFragment({}, [newValue]);
                result.onChange.subscribe(() => this.onChange.fire());
                this.children.splice(this.children.indexOf(sourceChild), 1, result);
                sourceChild = result;
                this.onChange.fire();
            }
        }
        else if (newValue instanceof ArrayDataSource) {
            if (!sourceChild) {
                const result = new AurumFragment({ repeatModel: newValue });
                sourceChild = result;
                this.children.push(result);
                result.onChange.subscribe(() => this.onChange.fire());
                this.onChange.fire();
            }
            else if (sourceChild !== newValue) {
                const result = new AurumFragment({ repeatModel: newValue });
                result.onChange.subscribe(() => this.onChange.fire());
                this.children.splice(this.children.indexOf(sourceChild), 1, result);
                sourceChild = result;
                this.onChange.fire();
            }
        }
        return sourceChild;
    }
    handleRepeat(dataSource) {
        dataSource.listenAndRepeat((change) => {
            switch (change.operationDetailed) {
                case 'replace':
                    //TODO:FIX THIS
                    //@ts-ignore
                    this.children[change.index] = prerender(change.items[0]);
                    break;
                case 'swap':
                    const itemA = this.children[change.index];
                    const itemB = this.children[change.index2];
                    this.children[change.index2] = itemA;
                    this.children[change.index] = itemB;
                    break;
                case 'append':
                    //@ts-ignore
                    this.children = this.children.concat(change.items.map(prerender));
                    break;
                case 'prepend':
                    //@ts-ignore
                    this.children.unshift(...change.items.map(prerender));
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
}
//# sourceMappingURL=aurum_element.js.map