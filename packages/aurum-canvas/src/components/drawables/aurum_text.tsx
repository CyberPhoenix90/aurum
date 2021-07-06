import { AurumComponentAPI, createLifeCycle, DataSource, dsUnique, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumTexteProps extends CommonProps {
    font?: string | ReadOnlyDataSource<string>;
    fontSize?: number | ReadOnlyDataSource<number>;
    fontWeight?: string | ReadOnlyDataSource<string>;
    width?: number | ReadOnlyDataSource<number>;
    wrapWidth?: number | ReadOnlyDataSource<number>;
    textBaseline?: string | ReadOnlyDataSource<string>;
    lineHeight?: number | ReadOnlyDataSource<number>;
}

export interface TextComponentModel extends ComponentModel {
    text: string | ReadOnlyDataSource<string>;
    font?: string | ReadOnlyDataSource<string>;
    textBaseline?: string | ReadOnlyDataSource<string>;
    fontSize?: number | ReadOnlyDataSource<number>;
    strokeColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    fontWeight?: string | ReadOnlyDataSource<string>;
    fillColor?: string | ReadOnlyDataSource<string> | CanvasGradient | ReadOnlyDataSource<CanvasGradient>;
    opacity?: number | ReadOnlyDataSource<number>;
    wrapWidth?: number | ReadOnlyDataSource<number>;
    lineHeight?: number | ReadOnlyDataSource<number>;
}

export function AurumText(props: AurumTexteProps, children: Renderable[], api: AurumComponentAPI): TextComponentModel {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);
    if (props.onAttach) {
        api.onAttach(() => props.onAttach());
    }
    if (props.onDetach) {
        api.onDetach(() => props.onDetach());
    }

    const content = api.prerender(children, lc).filter((c) => !!c);
    const text = new DataSource('');

    if (props.font instanceof DataSource) {
        props.font.listen(() => {
            if (result.renderedState) {
                result.renderedState.lines = [];
            }
        }, api.cancellationToken);
    }

    if (props.fontWeight instanceof DataSource) {
        props.fontWeight.listen(() => {
            if (result.renderedState) {
                result.renderedState.lines = [];
            }
        }, api.cancellationToken);
    }

    if (props.fontSize instanceof DataSource) {
        props.fontSize.listen(() => {
            if (result.renderedState) {
                result.renderedState.lines = [];
            }
        }, api.cancellationToken);
    }

    if (props.width instanceof DataSource) {
        props.width.listen(() => {
            if (result.renderedState) {
                result.renderedState.lines = [];
            }
        }, api.cancellationToken);
    }

    if (props.wrapWidth instanceof DataSource) {
        props.wrapWidth.listen(() => {
            if (result.renderedState) {
                result.renderedState.lines = [];
            }
        }, api.cancellationToken);
    }

    for (const i of content as Array<string | ReadOnlyDataSource<string>>) {
        if (i instanceof DataSource) {
            i.transform(dsUnique(), api.cancellationToken).listen((v) => {
                if (result.renderedState) {
                    result.renderedState.lines = [];
                }
                updateText(text, content as any);
            });
        }
    }
    updateText(text, content as any);

    const result = {
        ...props,
        opacity: props.opacity ?? 1,
        renderedState: undefined,
        text,
        children: [],
        animations: [],
        type: ComponentType.TEXT
    };
    return result;
}

function updateText(text: DataSource<string>, content: Array<string | ReadOnlyDataSource<string>>) {
    text.update(
        content.reduce<string>((p, c) => {
            if (typeof c === 'string') {
                return `${p}${c}`;
            } else {
                if (c.value) {
                    return `${p}${c.value}`;
                } else {
                    return p;
                }
            }
        }, '')
    );
}
