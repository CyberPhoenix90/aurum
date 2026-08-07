import { AurumComponentAPI, ReadOnlyDataSource, Renderable } from '@aurum/rendering';
import { CancellationToken } from '@aurum/streams';
import { Aurum } from '../utilities/aurum.js';

export type PortalTarget = HTMLElement | string | null | undefined;

export interface PortalProps {
    /** Target element, selector, or reactive target. Defaults to document.body. */
    target?: PortalTarget | ReadOnlyDataSource<PortalTarget> | (() => PortalTarget);
}

/** Renders children into another DOM container and keeps their lifetime tied to the owning component. */
export function Portal(props: PortalProps, children: Renderable[], api: AurumComponentAPI): undefined {
    let mounted: CancellationToken | undefined;

    const mount = (requestedTarget: PortalTarget): void => {
        mounted?.cancel();
        mounted = undefined;

        const target = resolvePortalTarget(requestedTarget);
        if (target) mounted = Aurum.attach(children, target);
    };

    api.onAttach(() => {
        const target = props?.target;
        if (isReadOnlyDataSource(target)) {
            target.listenAndRepeat(mount, api.cancellationToken);
        } else {
            mount(typeof target === 'function' ? target() : target);
        }
    });
    api.onDetach(() => {
        mounted?.cancel();
        mounted = undefined;
    });

    return undefined;
}

function resolvePortalTarget(target: PortalTarget): HTMLElement | undefined {
    if (target instanceof HTMLElement) return target;
    if (typeof target === 'string') return document.querySelector<HTMLElement>(target) ?? undefined;
    if (target === undefined) return document.body ?? undefined;
    return undefined;
}

function isReadOnlyDataSource(value: PortalProps['target']): value is ReadOnlyDataSource<PortalTarget> {
    return typeof value === 'object' && value !== null && 'value' in value && typeof value.listenAndRepeat === 'function';
}
