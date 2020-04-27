import { ReadOnlyDataSource } from '../../stream/data_source';
import { ChildNode, prerender } from './aurum_element';

export interface SwitchProps<T = boolean> {
	state: ReadOnlyDataSource<T>;
}

const switchCaseIdentity = Symbol('switchCase');

export interface SwitchCaseInstance<T> {
	[switchCaseIdentity]: boolean;
	value: T;
	default: boolean;
	content: ChildNode[];
}

export function Switch<T = boolean>(props: SwitchProps<T>, children) {
	children = children.map(prerender);
	if (children.some((c) => !c[switchCaseIdentity])) {
		throw new Error('Switch only accepts SwitchCase as children');
	}
	if (children.filter((c) => c.default).length > 1) {
		throw new Error('Too many default switch cases only 0 or 1 allowed');
	}

	return props.state.unique().map((state) => selectCase(state, children));
}

function selectCase<T>(state: T, children: SwitchCaseInstance<T>[]) {
	return children.find((c) => c.value === state)?.content ?? children.find((p) => p.default)?.content;
}

export interface SwitchCaseProps<T> {
	when: T;
}

export function SwitchCase<T>(props: SwitchCaseProps<T>, children): SwitchCaseInstance<T> {
	return {
		[switchCaseIdentity]: true,
		content: children,
		default: false,
		value: props.when
	};
}

export function DefaultSwitchCase(props: {}, children): SwitchCaseInstance<any> {
	return {
		[switchCaseIdentity]: true,
		content: children,
		default: true,
		value: undefined
	};
}
