import { prerender } from './aurum_element';
const switchCaseIdentity = Symbol('switchCase');
export function Switch(props, children) {
    children = children.map(prerender);
    if (children.some((c) => !c[switchCaseIdentity])) {
        throw new Error('Switch only accepts SwitchCase as children');
    }
    if (children.filter((c) => c.default).length > 1) {
        throw new Error('Too many default switch cases only 0 or 1 allowed');
    }
    return props.state.unique().map((state) => selectCase(state, children));
}
function selectCase(state, children) {
    var _a, _b, _c;
    return _b = (_a = children.find((c) => c.value === state)) === null || _a === void 0 ? void 0 : _a.content, (_b !== null && _b !== void 0 ? _b : (_c = children.find((p) => p.default)) === null || _c === void 0 ? void 0 : _c.content);
}
export function SwitchCase(props, children) {
    return {
        [switchCaseIdentity]: true,
        content: children,
        default: false,
        value: props.when
    };
}
export function DefaultSwitchCase(props, children) {
    return {
        [switchCaseIdentity]: true,
        content: children,
        default: true,
        value: undefined
    };
}
//# sourceMappingURL=switch.js.map