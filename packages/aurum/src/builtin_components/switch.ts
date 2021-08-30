import { AurumComponentAPI, AurumElementModel, aurumElementModelIdentitiy, Renderable } from '../rendering/aurum_element';
import { GenericDataSource, ReadOnlyDataSource } from '../stream/data_source';
import { dsMap, dsUnique } from '../stream/data_source_operators';
import { CancellationToken } from '../utilities/cancellation_token';

export interface SwitchProps<T = boolean> {
    state: ReadOnlyDataSource<T>;
}

export function Switch<T = boolean>(props: SwitchProps<T>, children: Renderable[], api: AurumComponentAPI) {
    children = [].concat.apply(
        [],
        children.filter((c) => !!c)
    );
    if (
        children.some(
            (c) =>
                !c[aurumElementModelIdentitiy] ||
                !((c as AurumElementModel<any>).factory === SwitchCase || (c as AurumElementModel<any>).factory === DefaultSwitchCase)
        )
    ) {
        throw new Error('Switch only accepts SwitchCase as children');
    }
    if (children.filter((c) => (c as AurumElementModel<any>).factory === DefaultSwitchCase).length > 1) {
        throw new Error('Too many default switch cases only 0 or 1 allowed');
    }

    const cleanUp = new CancellationToken();
    api.onDetach(() => {
        cleanUp.cancel();
    });

    const u: GenericDataSource<T> = props.state.transform(dsUnique(), cleanUp) as GenericDataSource<T>;
    return u.withInitial(props.state.value).transform(dsMap((state) => selectCase(state, children as AurumElementModel<SwitchCaseProps<any>>[])));
}

function selectCase<T>(state: T, children: AurumElementModel<SwitchCaseProps<any>>[]) {
    return children.find((c) => c.props?.when === state)?.children ?? children.find((p) => p.factory === DefaultSwitchCase)?.children;
}

export interface SwitchCaseProps<T> {
    when: T;
}

export function SwitchCase<T>(props: SwitchCaseProps<T>, children): undefined {
    return undefined;
}

export function DefaultSwitchCase(props: {}, children): undefined {
    return undefined;
}
