import { Renderable, AurumComponentAPI } from '../rendering/aurum_element';
import { ReadOnlyDataSource } from '../stream/data_source';
import { render } from '../rendering/renderer';
import { CancellationToken } from '../utilities/cancellation_token';

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

export function Switch<T = boolean>(props: SwitchProps<T>, children: Renderable[], api: AurumComponentAPI) {
	children = render(children);
	if (children.some((c) => !c[switchCaseIdentity])) {
		throw new Error('Switch only accepts SwitchCase as children');
	}
	if (children.filter((c) => ((c as any) as SwitchCaseInstance<any>).default).length > 1) {
		throw new Error('Too many default switch cases only 0 or 1 allowed');
	}

	const cleanUp = new CancellationToken();
	api.onDetach(() => {
		cleanUp.cancel();
	});

	const u = props.state.unique(cleanUp);
	return u.withInitial(u.value).map((state) => selectCase(state, children as any));
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
