import { PointLike, Position, ReactivePointLike } from 'aurum-layout-engine';
import {
    Aurum,
    AurumComponentAPI,
    ComponentLifeCycle,
    createLifeCycle,
    DataSource,
    dsMap,
    Renderable,
    aurumElementModelIdentitiy,
    CancellationToken
} from 'aurumjs';
import { Container } from '../../entities/types/container/container_entity.js';
import { LabelGraphNode } from '../../entities/types/label/api.js';
import { Label } from '../../entities/types/label/label_entity.js';
import { LabelEntityStyle } from '../../entities/types/label/model.js';
import { SpriteGraphNode } from '../../entities/types/sprite/api.js';
import { Sprite, SpriteEntityProps, Texture } from '../../entities/types/sprite/sprite_entity.js';
import { ReadonlyData } from '../../models/input_data.js';
import { _ } from '../../utilities/other/streamline.js';
import { defaultMarkupModel, MarkupModel } from './text_formatter_markup_model.js';

export interface TextFormatterOptions {
    baseFontStyle?: LabelEntityStyle;
    defaultLineHeight?: number;
    wordBreak?: {
        lineWidth: number;
        strategy: WordbreakStrategy;
    };
    imageAtlas?: (id: string) => Texture;
    styleData?: StyleSheetList | HTMLStyleElement | Renderable;
}

export enum WordbreakStrategy {
    BreakWord,
    BreakAny,
    Elipsis,
    Hide
}

interface TextFormattingState {
    segments: Array<LabelGraphNode | SpriteGraphNode>;
    style: LabelEntityStyle;
    modifiers: {
        defaultLineHeight?: number;
        lineHeight?: number;
        breakingLine?: boolean;
        marginTop?: number;
        marginLeft?: number;
        marginRight?: number;
        storedOffset?: PointLike;
        mark?: string;
    };
    imageAtlas?: (id: string) => Texture;
    styleData?: StyleSheetList | StyleSheet;
}

export interface TextFormattingEffects {
    width?: string;
    height?: string;
    lineHeight?: number;
    breakLine?: boolean;
    image?: TextImage;
    mark?: string;
    marginLeft?: number;
    marginRight?: number;
    marginTop?: number;
}

export interface TextImage {
    id: string;
    width: string | number;
    height: string | number;
    crop?: {
        sourceX: number;
        sourceY: number;
        sourceW: number;
        sourceH: number;
    };
}

export interface TextFormatterProps extends TextFormatterOptions {
    x?: Position;
    y?: Position;
}

export function TextFormatter(props: TextFormatterProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const { x, y, ...options } = props;

    const lc = createLifeCycle();
    api.synchronizeLifeCycle(lc);
    const input = api.prerender(children, lc).map((e) => (typeof e === 'string' ? document.createTextNode(e) : e));

    if (input.find((e) => !(e instanceof HTMLElement || e instanceof Text))) {
        throw new Error('TextFormatter expects an HTML element as its children');
    }

    return (
        <Container x={x} y={y} width="content" height="content">
            {formatText(input as any, options, api.prerender.bind(api), lc, api.cancellationToken)}
        </Container>
    );
}

function formatText(
    markup: NodeList,
    options: TextFormatterOptions,
    prerender: (element: any, lc: ComponentLifeCycle) => any,
    lc: ComponentLifeCycle,
    token: CancellationToken
): LabelGraphNode[] {
    const result: LabelGraphNode[] = [];

    if (options.styleData[aurumElementModelIdentitiy]) {
        const styleLc = createLifeCycle();
        options.styleData = prerender(options.styleData, styleLc);
        document.head.appendChild(options.styleData as HTMLStyleElement);
        styleLc.onAttach();
        token.addCancelable(() => {
            styleLc.onDetach();
            (options.styleData as HTMLStyleElement).remove();
        });

        if (!(options.styleData instanceof HTMLStyleElement)) {
            throw new Error('TextFormatter expects a style element as its styleData');
        }
    }

    formatChildren(
        markup,
        {
            segments: result,
            style: options.baseFontStyle,
            modifiers: {
                storedOffset: { x: 0, y: 0 },
                defaultLineHeight: options.defaultLineHeight ?? 16,
                marginRight: 0,
                marginLeft: 0,
                marginTop: 0
            },
            imageAtlas: options.imageAtlas,
            styleData: options.styleData instanceof HTMLStyleElement ? options.styleData.sheet : (options.styleData as any)
        },
        prerender,
        lc
    );

    return result;
}

function formatChildren(nodes: NodeList, state: TextFormattingState, prerender: (element: any, lc: ComponentLifeCycle) => any, lc: ComponentLifeCycle) {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] instanceof Element) {
            computeTokenStyle(nodes[i] as HTMLElement, state, prerender, lc);
        } else if (nodes[i] instanceof Text) {
            const text = trimText(nodes[i].textContent);
            if (text !== '') {
                processTextToken(text, state, prerender, lc);
            }
        }
    }
}

function processTextToken(text: string, state: TextFormattingState, prerender: (element: any, lc: ComponentLifeCycle) => any, lc: ComponentLifeCycle) {
    const position = getNextSegmentPosition(state);

    addSegment(
        prerender(
            <Label x={position.x} y={position.y} name={state.modifiers.mark} {...state.style}>
                {text}
            </Label>,
            lc
        ),
        state
    );
}

function trimText(text: string): string {
    return text.replace(/\s\s+/g, ' ');
}

function addSegment(segment: LabelGraphNode | SpriteGraphNode, state: TextFormattingState) {
    if (state.modifiers.breakingLine) {
        state.modifiers.breakingLine = false;
        state.modifiers.lineHeight = 0;
        state.modifiers.marginRight = 0;
    }

    state.modifiers.storedOffset.x = 0;
    state.modifiers.storedOffset.y = 0;
    state.modifiers.mark = undefined;

    if (state.modifiers.marginRight) {
        state.modifiers.storedOffset.x = state.modifiers.marginRight;
        state.modifiers.marginRight = 0;
    }

    if (state.modifiers.marginTop) {
        state.modifiers.storedOffset.y = -state.modifiers.marginTop;
        state.modifiers.marginTop = 0;
    }

    state.modifiers.marginLeft = 0;

    state.segments.push(segment);
}

function getNextSegmentPosition(state: TextFormattingState): ReactivePointLike {
    const last: LabelGraphNode | SpriteGraphNode = state.segments[state.segments.length - 1];
    let position: { x: ReadonlyData<number>; y: ReadonlyData<number> } = last ? { x: last.renderState.x, y: last.renderState.y } : { x: 0, y: 0 };

    const lineHeight = state.modifiers.lineHeight || state.modifiers.defaultLineHeight;
    const marginLeft = (state.modifiers.marginLeft ?? 0) + state.modifiers.storedOffset.x;
    const marginTop = (state.modifiers.marginTop ?? 0) + state.modifiers.storedOffset.y;

    if (state.modifiers.breakingLine && state.segments.length > 0) {
        position = { x: state.segments[0].renderState.x, y: last.renderState.y.transform(dsMap((s) => s + lineHeight)) };
    } else {
        position = last
            ? { x: DataSource.fromAggregation([last.renderState.x, last.renderState.width], (x, w) => x + w), y: last.renderState.y }
            : { x: 0, y: 0 };
    }

    state.modifiers.storedOffset.x = 0;
    state.modifiers.storedOffset.y = 0;

    return {
        x: DataSource.toDataSource(position.x).transform(dsMap((s) => s + marginLeft)),
        y: DataSource.toDataSource(position.y).transform(dsMap((s) => s + marginTop))
    };
}

function computeTokenStyle(token: HTMLElement, state: TextFormattingState, prerender: (element: any, lc: ComponentLifeCycle) => any, lc: ComponentLifeCycle) {
    const enhancedStyle = { ...state.style };
    const name = token.nodeName.toLowerCase();

    if (defaultMarkupModel[name]) {
        const selectedToken = defaultMarkupModel[name];
        const chain = getTokenInheritanceChain(selectedToken, defaultMarkupModel);
        const args = getArgsFromToken(chain, token.attributes);

        const effects: TextFormattingEffects = {
            lineHeight: state.modifiers.lineHeight || state.modifiers.defaultLineHeight
        };
        chain.forEach((c) => c.apply(enhancedStyle, args, effects));
        if (state.styleData || token.style) {
            applyCss(name, args.class, args.id, token.style, state.styleData, enhancedStyle, effects);
        }

        if (effects.breakLine) {
            state.modifiers.breakingLine = true;
        }

        if (effects.marginLeft) {
            state.modifiers.marginLeft = effects.marginLeft;
        }

        if (effects.marginTop) {
            state.modifiers.marginTop = effects.marginTop;
        }

        if (effects.marginRight) {
            state.modifiers.marginRight = effects.marginRight;
        }

        if (effects.mark) {
            state.modifiers.mark = effects.mark;
        }

        if (effects.image) {
            if (effects.width) {
                effects.image.width = effects.width;
            }
            if (effects.height) {
                effects.image.height = effects.height;
            }
            effects.lineHeight = Math.max(effects.lineHeight, parseInt(effects.image.height.toString()));

            const position = getNextSegmentPosition(state);
            const image = generateImage(
                effects.image,
                {
                    texture: state.imageAtlas?.(effects.image.id) ?? effects.image.id
                },
                position,
                prerender,
                lc
            );
            if (effects.lineHeight) {
                state.modifiers.lineHeight = effects.lineHeight;
            }
            addSegment(image, state);
        }

        if (effects.lineHeight) {
            state.modifiers.lineHeight = effects.lineHeight;
        }
    }

    formatChildren(
        token.childNodes,
        {
            ...state,
            style: enhancedStyle
        },
        prerender,
        lc
    );
}

function applyCss(
    tagName: string,
    className: string,
    id: string,
    styleTag: CSSStyleDeclaration,
    styleData: StyleSheetList | StyleSheet,
    style: LabelEntityStyle,
    effects: TextFormattingEffects
) {
    const styles: CSSStyleDeclaration[] = getCssStyles(tagName, className, id, styleData);

    styles.forEach((r) => applyCssRule(r, style, effects));
    if (styleTag) {
        applyCssRule(styleTag, style, effects);
    }
}

function applyCssRule(styleDeclaration: CSSStyleDeclaration, style: LabelEntityStyle, effects: TextFormattingEffects): void {
    if (styleDeclaration.marginLeft) {
        effects.marginLeft = parseInt(styleDeclaration.marginLeft);
    }
    if (styleDeclaration.marginRight) {
        effects.marginRight = parseInt(styleDeclaration.marginRight);
    }
    if (styleDeclaration.marginTop) {
        effects.marginTop = parseInt(styleDeclaration.marginTop);
    }

    if (styleDeclaration.width) {
        effects.width = styleDeclaration.width;
    }

    if (styleDeclaration.height) {
        effects.height = styleDeclaration.height;
    }

    let offset: PointLike;
    if (styleDeclaration.left || styleDeclaration.top) {
        offset = { x: parseInt(styleDeclaration.left) || 0, y: parseInt(styleDeclaration.top) || 0 };
    }

    if (styleDeclaration.fontSize) {
        effects.lineHeight = parseInt(styleDeclaration.fontSize);
    }

    if (styleDeclaration.lineHeight) {
        effects.lineHeight = parseInt(styleDeclaration.lineHeight);
    }

    Object.assign(
        style,
        _.trimObject(
            {
                color: styleDeclaration.color,
                alpha: parseInt(styleDeclaration.opacity),
                fontFamily: styleDeclaration.fontFamily,
                fontSize: parseInt(styleDeclaration.fontSize),
                fontStyle: styleDeclaration.fontStyle as any,
                fontWeight: styleDeclaration.fontWeight,
                offset,
                stroke: styleDeclaration.borderColor,
                strokeThickness: parseInt(styleDeclaration.borderRadius)
            } as LabelEntityStyle,
            {
                NaN: true,
                emptyString: true
            }
        )
    );
}

function getCssStyles(tagName: string, className: string, id: string, styleData: StyleSheetList | StyleSheet): CSSStyleDeclaration[] {
    const result = [];

    if (styleData === undefined) {
        return [];
    }

    const tagRule = searchForSelector('', tagName, styleData);
    const classRule = searchForSelector('.', className, styleData);
    const idRule = searchForSelector('#', id, styleData);
    const tagClassRule = searchForSelector(tagName + '.', className, styleData);
    const tagIdRule = searchForSelector(tagName + '.', className, styleData);

    if (tagRule) {
        result.push(tagRule);
    }

    if (classRule) {
        result.push(classRule);
    }

    if (idRule) {
        result.push(idRule);
    }

    if (tagClassRule) {
        result.push(tagClassRule);
    }

    if (tagIdRule) {
        result.push(tagIdRule);
    }

    return result;
}

function searchForSelector(prefix: string, name: string, styleData: StyleSheetList | StyleSheet): CSSStyleDeclaration | undefined {
    return styleData instanceof StyleSheetList ? searchForSelectorInList(prefix, name, styleData) : searchForSelectorInSheet(prefix, name, styleData);
}

function searchForSelectorInList(prefix: string, name: string, styleData: StyleSheetList): CSSStyleDeclaration | undefined {
    for (let i: number = 0; i < styleData.length; i++) {
        const result = searchForSelectorInSheet(prefix, name, styleData[i]);
        if (result) {
            return result;
        }
    }

    return undefined;
}

function searchForSelectorInSheet(prefix: string, name: string, styleData: StyleSheet): CSSStyleDeclaration | undefined {
    for (let n: number = 0; n < (styleData as CSSStyleSheet).cssRules.length; n++) {
        const selector: string = ((styleData as CSSStyleSheet).cssRules[n] as CSSStyleRule).selectorText;
        if (selector === `${prefix}${name}`) {
            return ((styleData as CSSStyleSheet).cssRules[n] as CSSStyleRule).style;
        }
    }

    return undefined;
}

function getTokenInheritanceChain(token: MarkupModel, tokenMap: Record<string, MarkupModel>): MarkupModel[] {
    const result = [token];
    while (token.extends) {
        token = tokenMap[token.extends];
        result.push(token);
    }

    return result;
}

function getArgsFromToken(tokenInheritanceChain: MarkupModel[], attributes: NamedNodeMap) {
    const result = Object.assign({}, ...tokenInheritanceChain.map((t) => t.args));
    for (let a = 0; a < attributes.length; a++) {
        result[attributes[a].name] = attributes[a].value;
    }

    return result;
}

function generateImage(
    image: TextImage,
    configuration: SpriteEntityProps,
    position: ReactivePointLike,
    prerender: (element: any, lc: ComponentLifeCycle) => any,
    lc: ComponentLifeCycle
): SpriteGraphNode {
    configuration.x = position.x;
    configuration.y = position.y;

    if (image.width) {
        configuration.width = image.width;
    }

    if (image.height) {
        configuration.height = image.height;
    }

    if (image.crop) {
        configuration.drawOffsetX = image.crop.sourceX;
        configuration.drawOffsetY = image.crop.sourceY;
        configuration.drawDistanceX = image.crop.sourceW;
        configuration.drawDistanceY = image.crop.sourceH;
    }

    return prerender(<Sprite {...configuration}></Sprite>, lc);
}
