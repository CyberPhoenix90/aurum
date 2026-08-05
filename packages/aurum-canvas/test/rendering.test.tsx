import { ArrayDataSource, Aurum, CancellationToken, DataSource, Renderable } from '@aurum/html';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    AurumCanvas,
    AurumElipse,
    AurumGroup,
    AurumImage,
    AurumRectangle,
    LargeContentBox
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
        token = Aurum.attach(<AurumCanvas width={20} height={20}>{children}</AurumCanvas>, target);

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
                <AurumRectangle
                    x={1}
                    y={1}
                    width={5}
                    height={5}
                    fillColor="red"
                    readWidth={width}
                    onPreDraw={() => draws++}
                />
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
