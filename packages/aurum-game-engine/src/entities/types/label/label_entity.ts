import { ArrayDataSource, AurumComponentAPI, createLifeCycle, DataSource, dsUnique, Renderable } from 'aurumjs';
import { CommonEntityProps } from '../../../models/entities';
import { toSourceIfDefined } from '../../../utilities/data/to_source';
import { entityDefaults } from '../../entity_defaults';
import { normalizeComponents, propsToModel } from '../../shared';
import { LabelGraphNode } from './api';
import { LabelEntityStyle, LabelEntity } from './model';

export interface LabelEntityProps extends CommonEntityProps, LabelEntityStyle {
    onAttach?(node: LabelGraphNode): void;
    onDetach?(node: LabelGraphNode): void;
    class?: LabelEntity[] | ArrayDataSource<LabelEntity>;
}

export function Label(props: LabelEntityProps, children: Renderable[], api: AurumComponentAPI): LabelGraphNode {
    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);

    const content = api.prerender(children, lc);
    const text = new DataSource('');

    for (const i of content as Array<string | DataSource<string>>) {
        if (i instanceof DataSource) {
            i.transform(dsUnique()).listen((v) => {
                updateText(text, content as any);
            }, api.cancellationToken);
        }
    }
    updateText(text, content as any);

    return new LabelGraphNode({
        name: props.name ?? LabelGraphNode.name,
        components: normalizeComponents(props.components),
        children: undefined,
        cancellationToken: api.cancellationToken,
        models: {
            coreDefault: entityDefaults,
            appliedStyleClasses: props.class instanceof ArrayDataSource ? props.class : new ArrayDataSource(props.class),
            entityTypeDefault: labelDefaultModel,
            userSpecified: {
                ...propsToModel(props),
                autoWidth: new DataSource(0),
                autoHeight: new DataSource(0),
                text,
                fontFamily: toSourceIfDefined(props.fontFamily),
                fontSize: toSourceIfDefined(props.fontSize),
                fontStyle: toSourceIfDefined(props.fontStyle),
                fontWeight: toSourceIfDefined(props.fontWeight),
                renderCharCount: toSourceIfDefined(props.renderCharCount),
                dropShadow: toSourceIfDefined(props.dropShadow),
                dropShadowAngle: toSourceIfDefined(props.dropShadowAngle),
                dropShadowColor: toSourceIfDefined(props.dropShadowColor),
                dropShadowDistance: toSourceIfDefined(props.dropShadowDistance),
                dropShadowFuzziness: toSourceIfDefined(props.dropShadowFuzziness),
                stroke: toSourceIfDefined(props.stroke),
                strokeThickness: toSourceIfDefined(props.strokeThickness),
                color: toSourceIfDefined(props.color),
                textBaseline: toSourceIfDefined(props.textBaseline)
            }
        },
        onAttach: props.onAttach,
        onDetach: props.onDetach
    });
}

function updateText(text: DataSource<string>, content: Array<string | DataSource<string>>): void {
    text.update(
        content.reduce<string>((p, c) => {
            if (typeof c === 'string' || typeof c === 'number' || typeof c === 'bigint' || typeof c === 'boolean') {
                return `${p}${c}`;
            } else {
                if (c.value !== undefined) {
                    return `${p}${c.value}`;
                } else {
                    return p;
                }
            }
        }, '')
    );
}
const canvas: HTMLCanvasElement = typeof document === 'undefined' ? undefined : document.createElement('canvas');

export function measureStringWidth(text: string, fontWeight: string, fontSize: number, fontFamily: string): number {
    if (text.trim().length === 0) {
        return 0;
    }

    const context = canvas.getContext('2d');
    context.font = `${fontWeight || ''} ${fontSize}px ${fontFamily || ''}`;
    const width = context.measureText(text).width;

    return width;
}

export const labelDefaultModel: LabelEntity = {
    width: new DataSource('auto'),
    height: new DataSource('auto'),
    fontStyle: new DataSource(undefined),
    fontWeight: new DataSource(undefined),
    renderCharCount: new DataSource(undefined),
    dropShadow: new DataSource(undefined),
    dropShadowAngle: new DataSource(undefined),
    dropShadowColor: new DataSource(undefined),
    dropShadowDistance: new DataSource(undefined),
    dropShadowFuzziness: new DataSource(undefined),
    stroke: new DataSource(undefined),
    strokeThickness: new DataSource(undefined),
    color: new DataSource(undefined),
    textBaseline: new DataSource(undefined),
    fontSize: new DataSource(16),
    fontFamily: new DataSource('arial')
};
