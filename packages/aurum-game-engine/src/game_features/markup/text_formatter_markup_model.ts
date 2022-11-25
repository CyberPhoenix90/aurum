import { LabelEntityStyle } from '../../entities/types/label/model.js';
import { _ } from '../../utilities/other/streamline.js';
import { TextFormattingEffects } from './text_formatter.js';

export interface MarkupModel {
    /**
     * maps arguments to default values
     */
    args: Record<string, string>;
    abstract?: boolean;
    extends?: string;
    apply(style: LabelEntityStyle, args?: Record<string, any>, effects?: TextFormattingEffects): void;
}

export const defaultMarkupModel: Record<string, MarkupModel> = {
    core: {
        abstract: true,
        args: {
            'margin-left': undefined,
            'margin-right': undefined,
            'margin-top': undefined
        },
        apply(style, args, effect) {
            if (args.id) {
                effect.mark = args.id;
            }

            if (args['margin-left']) {
                effect.marginLeft = parseInt(args['margin-left']);
            }
            if (args['margin-right']) {
                effect.marginRight = parseInt(args['margin-right']);
            }
            if (args['margin-top']) {
                effect.marginTop = parseInt(args['margin-top']);
            }
        }
    },
    div: {
        extends: 'core',
        args: {},
        apply() {}
    },
    span: {
        extends: 'core',
        args: {},
        apply() {}
    },
    img: {
        extends: 'core',
        args: {
            src: undefined,
            width: undefined,
            height: undefined,
            crop: undefined
        },
        apply(style: LabelEntityStyle, args, effect) {
            effect.image = {
                id: args.src,
                width: parseInt(args.width),
                height: parseInt(args.height),
                crop: args.crop
                    ? ((x) => ({ sourceX: x[0], sourceY: x[1], sourceW: x[2], sourceH: x[3] }))(args.crop.split(',').map((s) => parseInt(s)))
                    : undefined
            };
        }
    },
    font: {
        extends: 'core',
        args: { size: undefined, color: undefined, family: undefined },
        apply: (style, args, effects) => {
            Object.assign(
                style,
                _.trimObject(
                    {
                        fontSize: parseInt(args.size),
                        color: args.color,
                        fontFamily: args.family
                    },
                    {
                        undefined: true,
                        NaN: true,
                        null: true
                    }
                )
            );
            if (args.size) {
                effects.lineHeight = Math.max(effects.lineHeight, parseInt(args.size));
            }
        }
    },
    b: {
        extends: 'core',
        args: {},
        apply: (style) => {
            style.fontWeight = 'bold';
        }
    },
    i: {
        extends: 'core',
        args: {},
        apply: (style) => {
            style.fontStyle = 'italic';
        }
    },
    br: {
        args: {},
        apply: (style, args, effects) => (effects.breakLine = true)
    }
};
