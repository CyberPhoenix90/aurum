import { ArrayDataSource, Aurum, CancellationToken, DataSource, Renderable } from '@aurumjs/html';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    AurumBezierCurve,
    AurumCanvas,
    AurumElipse,
    AurumGroup,
    AurumImage,
    AurumLine,
    AurumPath,
    AurumQuadraticCurve,
    AurumRectangle,
    AurumRegularPolygon,
    AurumText,
    LargeContentBox,
    State
} from '../src/aurum-canvas.js';

describe('canvas rendering', () => {
    let token: CancellationToken | undefined;
    let target: HTMLDivElement;

    beforeEach(() => {
        document.body.innerHTML = '';
        document.body.style.margin = '0';
        target = document.createElement('div');
        document.body.appendChild(target);
    });

    afterEach(() => token?.cancel());

    it('draws nested rectangles using parent-relative coordinates', () => {
        token = Aurum.attach(
            <AurumCanvas width={30} height={30}>
                <AurumGroup x={4} y={5}>
                    <AurumRectangle x={2} y={3} width={4} height={5} fillColor="red" />
                </AurumGroup>
            </AurumCanvas>,
            target
        );

        expect(pixel(7, 9)).toEqual([255, 0, 0, 255]);
        expect(pixel(1, 1)).toEqual([0, 0, 0, 0]);
    });

    it('renders ellipses with an explicit zero start angle', () => {
        token = Aurum.attach(
            <AurumCanvas width={20} height={20}>
                <AurumElipse x={10} y={10} rx={5} ry={5} startAngle={0} endAngle={Math.PI * 2} fillColor="red" />
            </AurumCanvas>,
            target
        );
        expect(pixel(10, 10)).toEqual([255, 0, 0, 255]);
    });

    it('coalesces reactive property updates into a repaint', async () => {
        const x = new DataSource(1);
        let draws = 0;
        token = Aurum.attach(
            <AurumCanvas width={30} height={10}>
                <AurumRectangle x={x} y={1} width={4} height={4} fillColor="red" onPreDraw={() => draws++} />
            </AurumCanvas>,
            target
        );

        x.update(8);
        x.update(12);
        await nextFrame();

        expect(draws).toBe(2);
        expect(pixel(2, 2)).toEqual([0, 0, 0, 0]);
        expect(pixel(13, 2)).toEqual([255, 0, 0, 255]);
    });

    it('renders additions and removals from reactive collections', async () => {
        const children = new ArrayDataSource<Renderable>();
        token = Aurum.attach(
            <AurumCanvas width={20} height={20}>
                {children}
            </AurumCanvas>,
            target
        );

        children.push(<AurumRectangle x={2} y={2} width={5} height={5} fillColor="blue" />);
        await nextFrame();
        expect(pixel(3, 3)).toEqual([0, 0, 255, 255]);

        children.clear();
        await nextFrame();
        expect(pixel(3, 3)).toEqual([0, 0, 0, 0]);

        children.merge([<AurumRectangle x={2} y={2} width={5} height={5} fillColor="blue" />]);
        await nextFrame();
        expect(pixel(3, 3)).toEqual([0, 0, 255, 255]);
    });

    it('repaints after automatic resolution changes', async () => {
        token = Aurum.attach(
            <AurumCanvas style={{ width: '20px', height: '20px' }}>
                <AurumRectangle x={1} y={1} width={5} height={5} fillColor="red" />
            </AurumCanvas>,
            target
        );
        const canvas = getCanvas();
        await until(() => canvas.width === 20 && pixel(2, 2)[0] === 255);

        canvas.style.width = '40px';
        await until(() => canvas.width === 40 && pixel(2, 2)[0] === 255);
    });

    it('uses and reactively updates the background color', async () => {
        const background = new DataSource('red');
        token = Aurum.attach(<AurumCanvas width={10} height={10} backgroundColor={background} />, target);
        expect(pixel(5, 5)).toEqual([255, 0, 0, 255]);

        background.update('blue');
        await nextFrame();
        expect(pixel(5, 5)).toEqual([0, 0, 255, 255]);
    });

    it('dispatches pointer events in reverse paint order and supports mouse move', () => {
        const calls: string[] = [];
        token = Aurum.attach(
            <AurumCanvas width={20} height={20}>
                <AurumRectangle x={0} y={0} width={10} height={10} fillColor="red" onMouseClick={() => calls.push('bottom')} />
                <AurumRectangle
                    x={0}
                    y={0}
                    width={10}
                    height={10}
                    fillColor="blue"
                    onMouseMove={() => calls.push('move')}
                    onMouseClick={(event) => {
                        calls.push('top');
                        event.stopPropagation();
                    }}
                />
            </AurumCanvas>,
            target
        );

        dispatchMouse('mousemove', 5, 5);
        dispatchMouse('click', 5, 5);
        expect(calls).toEqual(['move', 'top']);
    });

    it('hit tests through non-uniform scale and translation', () => {
        const scale = new DataSource({ x: 2, y: 3 });
        const translate = new DataSource({ x: 10, y: 20 });
        let clicks = 0;
        token = Aurum.attach(
            <AurumCanvas width={100} height={120} scale={scale} translate={translate}>
                <AurumRectangle x={5} y={7} width={10} height={10} fillColor="red" onMouseClick={() => clicks++} />
            </AurumCanvas>,
            target
        );

        dispatchMouse('click', 32, 84);
        dispatchMouse('click', 10, 10);
        expect(clicks).toBe(1);
    });

    it('scopes keyboard events to the focused canvas', () => {
        const calls: string[] = [];
        token = Aurum.attach(
            <>
                <AurumCanvas width={10} height={10} onKeyDown={() => calls.push('first')} />
                <AurumCanvas width={10} height={10} onKeyDown={() => calls.push('second')} />
            </>,
            target
        );
        const canvases = target.querySelectorAll('canvas');
        canvases[0].focus();
        canvases[0].dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
        expect(calls).toEqual(['first']);
    });

    it('stops reacting and repainting after detach', async () => {
        const x = new DataSource(1);
        let draws = 0;
        token = Aurum.attach(
            <AurumCanvas width={20} height={20}>
                <AurumRectangle x={x} y={1} width={5} height={5} fillColor="red" onPreDraw={() => draws++} />
            </AurumCanvas>,
            target
        );
        token.cancel();
        token = undefined;
        x.update(10);
        await nextFrame();
        expect(draws).toBe(1);
    });

    it('publishes measurements without creating a repaint loop', async () => {
        const width = new DataSource(0);
        let draws = 0;
        token = Aurum.attach(
            <AurumCanvas width={20} height={20}>
                <AurumRectangle x={1} y={1} width={5} height={5} fillColor="red" readWidth={width} onPreDraw={() => draws++} />
            </AurumCanvas>,
            target
        );
        await nextFrame();
        await nextFrame();
        expect(width.value).toBe(5);
        expect(draws).toBe(1);
    });

    it('loads and paints image nodes', async () => {
        const source =
            'data:image/svg+xml;charset=utf-8,' +
            encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="rgb(0,255,0)"/></svg>');
        token = Aurum.attach(
            <AurumCanvas width={10} height={10}>
                <AurumImage x={1} y={1} width={4} height={4} src={source} />
            </AurumCanvas>,
            target
        );
        await until(() => pixel(2, 2)[1] === 255);
        expect(pixel(2, 2)).toEqual([0, 255, 0, 255]);
    });

    it('renders and clips large content boxes', () => {
        token = Aurum.attach(
            <AurumCanvas width={20} height={20}>
                <LargeContentBox x={2} y={2} width={8} height={8} fillColor="blue">
                    <AurumRectangle x={6} y={1} width={8} height={4} fillColor="red" />
                </LargeContentBox>
            </AurumCanvas>,
            target
        );

        expect(pixel(9, 4)).toEqual([255, 0, 0, 255]);
        expect(pixel(12, 4)).toEqual([0, 0, 0, 0]);
    });

    it('renders every vector primitive and publishes their resolved geometry', () => {
        const states: Record<string, any> = {};
        token = Aurum.attach(
            <AurumCanvas width={120} height={80}>
                <AurumLine x={2} y={4} tx={28} ty={4} lineWidth={2} strokeColor="red" onPreDraw={(state) => (states.line = state)} />
                <AurumQuadraticCurve
                    x={32}
                    y={12}
                    cx={44}
                    cy={0}
                    tx={56}
                    ty={12}
                    strokeColor="green"
                    onPreDraw={(state) => (states.quadratic = state)}
                />
                <AurumBezierCurve
                    x={62}
                    y={12}
                    cx={68}
                    cy={0}
                    c2x={80}
                    c2y={24}
                    tx={88}
                    ty={12}
                    strokeColor="blue"
                    onPreDraw={(state) => (states.bezier = state)}
                />
                <AurumPath x={2} y={20} path="M 0 0 L 20 0 L 10 16 Z" fillColor="purple" onPreDraw={(state) => (states.path = state)} />
                <AurumRegularPolygon x={30} y={20} sides={5} radius={10} fillColor="orange" onPreDraw={(state) => (states.polygon = state)} />
                <AurumText x={60} y={40} fontSize={14} fillColor="black" onPreDraw={(state) => (states.text = state)}>
                    Aurum
                </AurumText>
            </AurumCanvas>,
            target
        );

        expect(Object.keys(states).sort()).toEqual(['bezier', 'line', 'path', 'polygon', 'quadratic', 'text']);
        expect(states.line.path).toBeInstanceOf(Path2D);
        expect(states.quadratic.path).toBeInstanceOf(Path2D);
        expect(states.bezier.path).toBeInstanceOf(Path2D);
        expect(states.path.path).toBeInstanceOf(Path2D);
        expect(states.polygon.path).toBeInstanceOf(Path2D);
        expect(states.text.lines).toEqual(['Aurum']);
        expect(states.text.realWidth).toBeGreaterThan(0);
        expect(pixel(12, 4)[3]).toBeGreaterThan(0);
    });

    it('updates text content and clears cached wrapping measurements', async () => {
        const text = new DataSource('one two');
        const wrapWidth = new DataSource(200);
        let state: any;
        token = Aurum.attach(
            <AurumCanvas width={120} height={60}>
                <AurumText x={2} y={18} wrapWidth={wrapWidth} fillColor="black" onPreDraw={(value) => (state = value)}>
                    {text}
                </AurumText>
            </AurumCanvas>,
            target
        );
        expect(state.lines).toEqual(['one two']);

        wrapWidth.update(20);
        text.update('one two three');
        await nextFrame();
        expect(state.lines.length).toBeGreaterThan(1);
        expect(state.text).toBe('one two three');
    });

    it('activates state nodes when a reactive state changes', async () => {
        const state = new DataSource('idle');
        token = Aurum.attach(
            <AurumCanvas width={30} height={10}>
                <AurumRectangle state={state} x={1} y={1} width={5} height={5} fillColor="red">
                    <State id="moved" x={15} transitionTime={0} />
                </AurumRectangle>
            </AurumCanvas>,
            target
        );
        expect(pixel(2, 2)).toEqual([255, 0, 0, 255]);

        state.update('moved');
        await nextFrame();
        expect(pixel(2, 2)).toEqual([0, 0, 0, 0]);
        expect(pixel(16, 2)).toEqual([255, 0, 0, 255]);
    });

    it('tracks hover entry, movement, exit, and cursor ownership', () => {
        const calls: string[] = [];
        token = Aurum.attach(
            <AurumCanvas width={20} height={20}>
                <AurumRectangle
                    x={1}
                    y={1}
                    width={8}
                    height={8}
                    fillColor="red"
                    hoverFillColor="blue"
                    cursor="crosshair"
                    onMouseEnter={() => calls.push('enter')}
                    onMouseMove={() => calls.push('move')}
                    onMouseLeave={() => calls.push('leave')}
                />
            </AurumCanvas>,
            target
        );
        const canvas = getCanvas();

        dispatchMouse('mousemove', 3, 3);
        expect(calls).toEqual(['enter', 'move']);
        expect(canvas.style.cursor).toBe('crosshair');
        dispatchMouse('mousemove', 15, 15);
        expect(calls).toEqual(['enter', 'move', 'leave']);
        expect(canvas.style.cursor).toBe('auto');
    });

    function getCanvas(): HTMLCanvasElement {
        return target.querySelector('canvas') as HTMLCanvasElement;
    }

    function pixel(x: number, y: number): number[] {
        return Array.from((getCanvas().getContext('2d') as CanvasRenderingContext2D).getImageData(x, y, 1, 1).data);
    }

    function dispatchMouse(type: string, x: number, y: number): void {
        const canvas = getCanvas();
        const bounds = canvas.getBoundingClientRect();
        canvas.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: bounds.left + x, clientY: bounds.top + y }));
    }
});

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function until(predicate: () => boolean, timeout = 1000): Promise<void> {
    const start = performance.now();
    while (!predicate()) {
        if (performance.now() - start > timeout) {
            throw new Error('Timed out waiting for canvas state');
        }
        await nextFrame();
    }
}
