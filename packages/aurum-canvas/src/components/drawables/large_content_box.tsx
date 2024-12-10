import { AurumComponentAPI, createLifeCycle, DataSource, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props.js';
import { ComponentModel, ComponentType } from '../component_model.js';

export interface LargeContentBoxProps extends CommonProps {
    width: number | ReadOnlyDataSource<number>;
    height: number | ReadOnlyDataSource<number>;
}

export interface LargeContentBoxModel extends ComponentModel {
    opacity?: number | ReadOnlyDataSource<number>;
    width: number | ReadOnlyDataSource<number>;
    height: number | ReadOnlyDataSource<number>;
}

/**
 * Large content box is a component that will stack its children vertically and will not clip them. It does not allow manual Y-positioning of its children
 * The box will automatically show a scrollbar if the content is larger than the box. The box is highly optimized for large content and will only render the visible part of the content
 * It could be compared to a virtual list but for canvas
 * For performance reasons, the box will not update its content unless manually triggered by the user
 */
export function LargeContentBox(props: LargeContentBoxProps, children: Renderable[], api: AurumComponentAPI): LargeContentBoxModel {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);
    if (props.onAttach) {
        api.onAttach(() => props.onAttach());
    }
    if (props.onDetach) {
        api.onDetach(() => props.onDetach());
    }

    const components = api.prerender(children, lc).filter((c) => !!c);
    return {
        readIsHovering: new DataSource(),
        ...props,
        opacity: props.opacity ?? 1,
        renderedState: undefined,
        children: components as any,
        animations: [],
        type: ComponentType.LARGE_CONTENT_BOX
    };
}
