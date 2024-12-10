import { RectangleComponentModel } from './drawables/aurum_rectangle.js';
import { TextComponentModel } from './drawables/aurum_text.js';
import { LineComponentModel } from './drawables/aurum_line.js';
import { ElipseComponentModel } from './drawables/aurum_elipse.js';
import { PathComponentModel } from './drawables/aurum_path.js';
import { QuadraticCurveComponentModel } from './drawables/aurum_quadratic_curve.js';
import { BezierCurveComponentModel } from './drawables/aurum_bezier_curve.js';
import { deref } from './utilities.js';
import { ComponentModel } from './component_model.js';
import { CommonProps } from './common_props.js';
import { measureText } from './measure_text.js';

const regularPolygonKeys = ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'path', 'sides', 'radius', 'originX', 'originY'];
const pathKeys = ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'path', 'lineWidth', 'originX', 'originY'];
const elipseKeys = ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'rotation', 'rx', 'ry', 'startAngle', 'endAngle', 'originX', 'originY'];
const lineKeys = ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'tx', 'ty', 'lineWidth', 'originX', 'originY'];
const quadraticCurveKeys = ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'tx', 'ty', 'cx', 'cy', 'lineWidth', 'originX', 'originY'];
const bezierCurveKeys = ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'tx', 'ty', 'cx', 'cy', 'c2x', 'c2y', 'lineWidth', 'originX', 'originY'];
const textKeys = [
    'x',
    'y',
    'realWidth',
    'width',
    'font',
    'fontSize',
    'opacity',
    'strokeColor',
    'fillColor',
    'text',
    'fontWeight',
    'wrapWidth',
    'lineHeight',
    'textBaseline',
    'originX',
    'originY'
];
const rectangleKeys = ['x', 'y', 'width', 'height', 'opacity', 'strokeColor', 'fillColor', 'originX', 'originY'];

export function renderElipse(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    child: ElipseComponentModel,
    offsetX: number,
    offsetY: number
): boolean {
    const renderedState = resolveValues(child, elipseKeys, offsetX, offsetY);
    const { x, y, idle, fillColor, strokeColor, opacity, rx, ry, rotation, startAngle, endAngle } = renderedState;
    child.renderedState = renderedState;
    child.readWidth?.update(rx * 2);
    child.readHeight?.update(ry * 2);

    child.onPreDraw?.(child.renderedState);
    context.globalAlpha = opacity;
    const path2d = new Path2D();

    if ((fillColor || strokeColor) && rx > 0.01 && ry > 0.01 && (startAngle ?? 0 !== endAngle)) {
        path2d.ellipse(x, y, rx, ry, rotation ?? 0, startAngle ?? 0, endAngle ?? Math.PI * 2);
        child.renderedState.path = path2d;
    } else {
        child.renderedState.path = undefined;
    }

    drawCanvasPath(child, context, path2d, fillColor, strokeColor);

    return idle;
}

export function renderLine(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    child: LineComponentModel,
    offsetX: number,
    offsetY: number
): boolean {
    const renderedState = resolveValues(child, lineKeys, offsetX, offsetY);
    const { x, y, idle, fillColor, strokeColor, opacity, tx, ty, lineWidth } = renderedState;
    child.readWidth?.update(Math.abs(tx - x));
    child.readHeight?.update(Math.abs(ty - y));
    child.renderedState = renderedState;
    child.onPreDraw?.(child.renderedState);
    const path2d = new Path2D();

    context.globalAlpha = opacity;
    if (fillColor || strokeColor) {
        path2d.moveTo(x, y);
        path2d.lineTo(tx, ty);
        context.lineWidth = lineWidth;
        child.renderedState.path = path2d;
    } else {
        child.renderedState.path = undefined;
    }

    drawCanvasPath(child, context, path2d, fillColor, strokeColor);

    return idle;
}

export function renderQuadraticCurve(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    child: QuadraticCurveComponentModel,
    offsetX: number,
    offsetY: number
): boolean {
    const renderedState = resolveValues(child, quadraticCurveKeys, offsetX, offsetY);
    const { x, y, cx, cy, idle, fillColor, strokeColor, opacity, tx, ty, lineWidth } = renderedState;
    child.renderedState = renderedState;
    child.onPreDraw?.(child.renderedState);

    context.globalAlpha = opacity;
    const path2d = new Path2D();
    if (fillColor || strokeColor) {
        path2d.moveTo(x, y);
        path2d.quadraticCurveTo(cx, cy, tx, ty);
        context.lineWidth = lineWidth;
        child.renderedState.path = path2d;
    } else {
        child.renderedState.path = undefined;
    }

    drawCanvasPath(child, context, path2d, fillColor, strokeColor);

    return idle;
}

export function renderBezierCurve(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    child: BezierCurveComponentModel,
    offsetX: number,
    offsetY: number
): boolean {
    const renderedState = resolveValues(child, bezierCurveKeys, offsetX, offsetY);
    const { x, y, cx, cy, c2x, c2y, idle, fillColor, strokeColor, opacity, tx, ty, lineWidth } = renderedState;
    child.renderedState = renderedState;
    child.onPreDraw?.(child.renderedState);

    context.globalAlpha = opacity;
    const path2d = new Path2D();
    if (fillColor || strokeColor) {
        path2d.moveTo(x, y);
        path2d.bezierCurveTo(cx, cy, c2x, c2y, tx, ty);
        context.lineWidth = lineWidth;
        child.renderedState.path = path2d;
    } else {
        child.renderedState.path = undefined;
    }

    drawCanvasPath(child, context, path2d, fillColor, strokeColor);

    return idle;
}

function drawCanvasPath(
    child: CommonProps,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    path2d: Path2D,
    fillColor: any,
    strokeColor: any
) {
    if (child.fillColor) {
        context.fillStyle = fillColor;
        context.fill(path2d);
    }
    if (child.strokeColor) {
        context.strokeStyle = strokeColor;
        context.stroke(path2d);
    }

    if (child.clip) {
        context.clip(path2d);
    }
}

export function renderPath(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    child: PathComponentModel,
    offsetX: number,
    offsetY: number
): boolean {
    const renderedState = resolveValues(child, pathKeys, offsetX, offsetY);
    const { x, y, idle, fillColor, strokeColor, opacity, path, lineWidth } = renderedState;
    child.renderedState = renderedState;
    child.onPreDraw?.(child.renderedState);

    let path2d: Path2D;
    context.globalAlpha = opacity;
    if (fillColor || strokeColor) {
        context.lineWidth = lineWidth;
        path2d = new Path2D(path);
        child.renderedState.path = path2d;
    } else {
        child.renderedState.path = undefined;
    }

    if (child.fillColor) {
        context.translate(x, y);
        context.fillStyle = fillColor;
        context.fill(path2d);
        context.translate(-x, -y);
    }
    if (child.strokeColor) {
        context.translate(x, y);
        context.strokeStyle = strokeColor;
        context.stroke(path2d);
        context.translate(-x, -y);
    }

    if (child.clip) {
        context.translate(x, y);
        context.clip(path2d);
        context.translate(-x, -y);
    }

    return idle;
}

export function renderRegularPolygon(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    child: PathComponentModel,
    offsetX: number,
    offsetY: number
): boolean {
    const renderedState = resolveValues(child, regularPolygonKeys, offsetX, offsetY);
    const { x, y, idle, fillColor, strokeColor, opacity, sides, radius } = renderedState;
    child.readWidth?.update(radius * 2);
    child.readHeight?.update(radius * 2);

    child.renderedState = renderedState;

    child.onPreDraw?.(child.renderedState);
    context.globalAlpha = opacity;

    if (renderedState.sides < 3) {
        return idle;
    }
    const path2d = new Path2D();

    if (fillColor || strokeColor) {
        let angle = 0;
        for (let i = 0; i < sides; i++) {
            angle += Math.PI / (sides / 2);
            const targetX = radius * Math.cos(angle);
            const targetY = radius * Math.sin(angle);
            if (i === 0) {
                path2d.moveTo(targetX + radius + x, targetY + radius + y);
            } else {
                path2d.lineTo(targetX + radius + x, targetY + radius + y);
            }
        }

        child.renderedState.path = path2d;
    } else {
        child.renderedState.path = undefined;
    }

    drawCanvasPath(child, context, path2d, fillColor, strokeColor);

    return idle;
}

export function renderText(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    child: TextComponentModel,
    offsetX: number,
    offsetY: number
): boolean {
    const renderedState = resolveValues(child, textKeys, offsetX, offsetY, false);
    let {
        x,
        y,
        idle,
        fontSize = 16,
        textBaseline,
        font,
        fillColor,
        strokeColor,
        opacity,
        text,
        fontWeight,
        width,
        wrapWidth,
        lineHeight,
        originX
    } = renderedState;

    if (child.renderedState?.width && !renderedState.width) {
        renderedState.width = child.renderedState.width;
    }

    if (child.renderedState?.realWidth && !renderedState.realWidth) {
        renderedState.realWidth = child.renderedState.realWidth;
    }

    renderedState.lines = child.renderedState?.lines;
    child.renderedState = renderedState;

    child.renderedState.lines = child.renderedState.lines ?? [];
    let lines = child.renderedState.lines;
    if (textBaseline) {
        context.textBaseline = textBaseline;
    }
    context.font = `${fontWeight ? fontWeight + ' ' : ''}${fontSize}px ${font ?? 'Arial'}`;
    renderedState.height = fontSize;

    if (lines.length === 0) {
        let longestMeasuredWidth = 0;
        const inputLines = text.split('\n');
        for (const inputLine of inputLines) {
            if (wrapWidth) {
                child.renderedState.realWidth = 0;
                const pieces: string[] = inputLine.split(' ');
                let line = pieces.shift();
                while (pieces.length) {
                    const measuredWidth = measureText(context, line + ' ' + pieces[0]);
                    if (measuredWidth.width <= wrapWidth) {
                        longestMeasuredWidth = Math.max(longestMeasuredWidth, measuredWidth.width);
                        line += ' ' + pieces.shift();
                    } else {
                        const measuredWidth = measureText(context, line);
                        longestMeasuredWidth = Math.max(longestMeasuredWidth, measuredWidth.width);
                        lines.push(line);
                        line = pieces.shift();
                    }
                }
                const measuredWidth = measureText(context, line);
                longestMeasuredWidth = Math.max(longestMeasuredWidth, measuredWidth.width);
                lines.push(line);
            } else {
                longestMeasuredWidth = Math.max(longestMeasuredWidth, measureText(context, inputLine).width);

                lines.push(inputLine);
            }
        }
        if (!width) {
            child.renderedState.realWidth = child.renderedState.width = longestMeasuredWidth;
        } else {
            child.renderedState.realWidth = longestMeasuredWidth;
        }
    }

    child.onPreDraw?.(child.renderedState);
    context.globalAlpha = opacity;

    if (originX) {
        x -= Math.min(child.renderedState.realWidth, child.renderedState.width) * originX;
    }

    child.readWidth?.update(child.renderedState.realWidth);
    child.readHeight?.update(child.renderedState.lines.length * (lineHeight ?? 16));

    for (let i = 0; i < lines.length; i++) {
        if (fillColor) {
            context.fillStyle = fillColor;
            context.fillText(lines[i], x, y + (lineHeight ?? 16) * i, width);
        }
        if (strokeColor) {
            context.strokeStyle = strokeColor;
            context.strokeText(lines[i], x, y + (lineHeight ?? 16) * i, width);
        }
    }

    return idle;
}

export function renderRectangle(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    child: RectangleComponentModel,
    offsetX: number,
    offsetY: number
): boolean {
    const renderedState = resolveValues(child, rectangleKeys, offsetX, offsetY);
    const { x, y, width, height, idle, fillColor, strokeColor, opacity } = renderedState;
    child.readWidth?.update(width);
    child.readHeight?.update(height);

    child.renderedState = renderedState;

    child.onPreDraw?.(child.renderedState);

    if (opacity <= 0 && !child.clip) {
        return idle;
    }

    context.globalAlpha = opacity;

    if (fillColor) {
        context.fillStyle = fillColor;
        context.fillRect(x, y, width, height);
    }
    if (strokeColor) {
        context.strokeStyle = strokeColor;
        context.strokeRect(x, y, width, height);
    }

    if (child.clip) {
        context.beginPath();
        context.rect(x, y, width, height);
        context.clip();
    }

    return idle;
}

export function resolveValues(node: ComponentModel, props: string[], offsetX: number, offsetY: number, applyOrigin: boolean = true): any {
    const result = {
        idle: true,
        x: 0,
        y: 0
    };
    let idle = true;

    for (const key of props) {
        const baseValue = deref(node[key]);
        const state = node.animationStates?.find((n) => n[key] != undefined);
        if (state) {
            let progress;
            if (!state.transitionTime) {
                progress = 1;
            } else {
                progress = Math.min(1, (Date.now() - node.animationTime) / deref(state.transitionTime));
            }
            const targetValue = state[key];
            result[key] = baseValue + (targetValue - baseValue) * progress;
            if (progress < 1) {
                idle = false;
            }
        } else {
            result[key] = baseValue;
        }
    }
    result.x += offsetX;
    result.y += offsetY;

    if (applyOrigin) {
        //@ts-ignore
        if (result.originX && result.width) {
            //@ts-ignore
            result.x -= result.width * result.originX;
        }

        //@ts-ignore
        if (result.originY && result.height) {
            //@ts-ignore
            result.y -= result.height * result.originY;
        }
    }

    if ('tx' in result) {
        //@ts-ignore
        result.tx += offsetX;
    }
    if ('ty' in result) {
        //@ts-ignore
        result.ty += offsetY;
    }

    if ('cx' in result) {
        //@ts-ignore
        result.cx += offsetX;
    }
    if ('cy' in result) {
        //@ts-ignore
        result.cy += offsetY;
    }

    if ('c2x' in result) {
        //@ts-ignore
        result.c2x += offsetX;
    }
    if ('c2y' in result) {
        //@ts-ignore
        result.c2y += offsetY;
    }
    result.idle = idle;
    return result;
}
