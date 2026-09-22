import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    CancellationToken,
    createAPI,
    createRenderSession,
    DataSource,
    getValueOf,
    Renderable
} from '@aurumjs/html';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from '../src/dialog/dialog.js';
import {
    FloatingWindow,
    WindowContent,
    WindowContentRow,
    WindowFooter,
    WindowTitle
} from '../src/dialog/floating_window.js';
import { SimpleActionModal } from '../src/dialog/simple_action_modal.js';
import {
    PanelContent,
    PanelDockBottom,
    PanelDockLeft,
    PanelDockRight,
    PanelDockTop,
    renderBottomDock,
    renderLeftDock,
    renderRightDock,
    renderTopDock
} from '../src/layout/panel_dock.js';
import { PanelComponent } from '../src/layout/panel_layout.js';
import { TreeLayout } from '../src/layout/tree_layout.js';

type Handler = (event: any) => void;

function componentApi(): AurumComponentAPI {
    return createAPI(createRenderSession());
}

function fakeWindow(): { target: any; dispatch(type: string, event: any): void } {
    const handlers = new Map<string, Set<Handler>>();
    const target = {
        innerWidth: 800,
        innerHeight: 600,
        addEventListener(type: string, handler: Handler) {
            let group = handlers.get(type);
            if (!group) handlers.set(type, (group = new Set()));
            group.add(handler);
        },
        removeEventListener(type: string, handler: Handler) {
            handlers.get(type)?.delete(handler);
        }
    };
    return {
        target,
        dispatch(type, event) {
            for (const handler of handlers.get(type) ?? []) handler(event);
        }
    };
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('dialogs and windows', () => {
    it('positions a dialog from target geometry and distinguishes inside/outside clicks', () => {
        vi.useFakeTimers();
        const events = fakeWindow();
        class FakeElement {
            public parentElement: FakeElement | null = null;
            public getBoundingClientRect() {
                return { left: 10, top: 4, right: 40, bottom: 24, width: 30, height: 20 } as DOMRect;
            }
        }
        vi.stubGlobal('window', events.target);
        vi.stubGlobal('HTMLElement', FakeElement);
        vi.stubGlobal('SVGElement', class {});
        const inside = vi.fn();
        const outside = vi.fn();
        const escape = vi.fn();
        const model = Dialog(
            {
                target: new FakeElement() as unknown as HTMLElement,
                layout: { direction: 'right', targetPoint: 'end', offset: { x: 2, y: 3 } },
                blockNativeContextMenu: true,
                onClickInside: inside,
                onClickOutside: outside,
                onEscape: escape
            },
            ['dialog'],
            componentApi()
        ) as AurumElementModel<any>;
        const root = new FakeElement();
        model.props.onAttach(root);

        expect(String(getValueOf(model.props.style))).toContain('left:42px; top:27px');
        events.dispatch('keydown', { key: 'Escape' });
        expect(escape).toHaveBeenCalledOnce();
        vi.runOnlyPendingTimers();

        const child = new FakeElement();
        child.parentElement = root;
        events.dispatch('click', { target: child });
        events.dispatch('click', { target: new FakeElement() });
        expect(inside).toHaveBeenCalledOnce();
        expect(outside).toHaveBeenCalledOnce();
        const preventDefault = vi.fn();
        model.props.onContextMenu({ preventDefault });
        expect(preventDefault).toHaveBeenCalledOnce();
    });

    it('centers, drags, and dispatches keyboard actions from a floating window', () => {
        const events = fakeWindow();
        vi.stubGlobal('window', events.target);
        const escape = vi.fn();
        const enter = vi.fn();
        const self = Aurum.factory(
            FloatingWindow,
            { w: 200, h: 100, draggable: true, closable: true, onEscape: escape, onEnter: enter },
            Aurum.factory(WindowTitle, { class: 'title' }, 'Title'),
            Aurum.factory(WindowContent, { class: 'body' }, Aurum.factory(WindowContentRow, {}, 'Body')),
            Aurum.factory(WindowFooter, { class: 'footer' }, 'Footer')
        );
        const root = self.factory.call(self, self.props, self.children, componentApi()) as AurumElementModel<any>;
        const focus = vi.fn();
        root.props.onAttach({ focus });
        expect(focus).toHaveBeenCalledOnce();
        expect(String(getValueOf(root.props.style))).toContain('left:300px; top:250px; width:200px; height:100px');

        root.props.onKeyUp({ key: 'Escape' } as KeyboardEvent);
        root.props.onKeyUp({ key: 'Enter' } as KeyboardEvent);
        expect(escape).toHaveBeenCalledOnce();
        expect(enter).toHaveBeenCalledOnce();

        const title = root.children[0] as AurumElementModel<any>;
        title.props.onMouseDown({ clientX: 10, clientY: 20 } as MouseEvent);
        events.dispatch('mousemove', { clientX: 30, clientY: 55 });
        expect(String(getValueOf(root.props.style))).toContain('left:320px; top:285px');
        events.dispatch('mouseup', {});
        events.dispatch('mousemove', { clientX: 100, clientY: 100 });
        expect(String(getValueOf(root.props.style))).toContain('left:320px; top:285px');
    });

    it('validates floating-window transclusion and runs modal actions exactly once', () => {
        const events = fakeWindow();
        vi.stubGlobal('window', events.target);
        const invalid = Aurum.factory(FloatingWindow, { w: 10, h: 10 }, Aurum.factory(WindowTitle, {}, 'Only title'));
        expect(() => invalid.factory.call(invalid, invalid.props, invalid.children, componentApi())).toThrow('must have a title and a content');

        const acted = vi.fn();
        const closed = vi.fn();
        const dialogs = new ArrayDataSource<Renderable>();
        const modal = Aurum.factory(SimpleActionModal, {
            dialogs,
            title: 'Confirm',
            message: 'Continue?',
            onClose: closed,
            actions: [{ label: 'Yes', buttonType: 'action', action: acted }]
        });
        dialogs.push(modal);
        const floating = modal.factory.call(modal, modal.props, modal.children, componentApi()) as AurumElementModel<any>;
        const footer = floating.children.find((child) => (child as AurumElementModel<any>).factory === WindowFooter) as AurumElementModel<any>;
        const actionContainer = footer.children[0] as AurumElementModel<any>;
        const action = (actionContainer.children[0] as AurumElementModel<any>[])[0];
        action.props.onClick();

        expect(acted).toHaveBeenCalledOnce();
        expect(closed).toHaveBeenCalledWith(true);
        expect(dialogs.length.value).toBe(0);
    });
});

describe('panel and tree layouts', () => {
    it('renders every dock and rejects duplicate or unsupported panel children', () => {
        const token = new CancellationToken();
        const left = Aurum.factory(PanelDockLeft as any, { size: 40, minSize: 10, maxSize: 80, resizable: true }, 'left');
        const top = Aurum.factory(PanelDockTop as any, { size: 20 }, 'top');
        const right = Aurum.factory(PanelDockRight as any, { size: 30, minSize: 10, maxSize: 60, resizable: true }, 'right');
        const bottom = Aurum.factory(PanelDockBottom as any, { size: 25, minSize: 5, maxSize: 50, resizable: true }, 'bottom');
        const content = Aurum.factory(PanelContent as any, { class: 'main' }, 'content');
        const panel = PanelComponent({ dragHandleThickness: 3 }, [left, top, right, bottom, content], componentApi()) as AurumElementModel<any>;

        expect(panel.name).toBe('div');
        expect(panel.children.filter(Boolean)).toHaveLength(3);
        expect(renderTopDock(top, new DataSource(20), token)).toBeTruthy();
        expect(renderRightDock(right, new DataSource(30), new DataSource(10), new DataSource(60), token)).toHaveLength(2);
        expect(() => PanelComponent({}, [left, left], componentApi())).toThrow('only one left sidebar');
        expect(() => PanelComponent({}, [Aurum.factory('span', {}, 'bad')], componentApi())).toThrow('unspported child type');
        token.cancel();
    });

    it('clamps vertical and horizontal dock dragging to configured bounds', () => {
        const events = fakeWindow();
        vi.stubGlobal('window', events.target);
        const token = new CancellationToken();
        const size = new DataSource(20);
        const min = new DataSource(10);
        const max = new DataSource(40);
        const left = Aurum.factory(PanelDockLeft as any, { resizable: true }, 'left');
        const leftParts = renderLeftDock(left, size, min, max, token, 4);
        const verticalHandle = (leftParts[1] as DataSource<Renderable>).value as AurumElementModel<any>;
        verticalHandle.props.onMouseDown({ pageX: 10 } as MouseEvent);
        events.dispatch('mousemove', { pageX: 100, preventDefault: vi.fn() });
        expect(size.value).toBe(40);
        events.dispatch('mouseup', {});

        const bottom = Aurum.factory(PanelDockBottom as any, { resizable: true }, 'bottom');
        const bottomNode = renderBottomDock(bottom, size, min, max, token, 4) as AurumElementModel<any>;
        const horizontalHandle = (bottomNode.children[0] as DataSource<Renderable>).value as AurumElementModel<any>;
        horizontalHandle.props.onMouseDown({ pageY: 100 } as MouseEvent);
        events.dispatch('mousemove', { pageY: 200, preventDefault: vi.fn() });
        expect(size.value).toBe(10);
        events.dispatch('mouseup', {});
        token.cancel();
    });

    it('reactively replaces tree-layout roots', () => {
        const first = { content: new ArrayDataSource<Renderable>(['first']) };
        const second = {
            content: new ArrayDataSource<Renderable>(['second']),
            left: new DataSource({ content: new ArrayDataSource<Renderable>(['nested']) })
        };
        const root = new DataSource(first);
        const rendered = TreeLayout({ root }, [], componentApi()) as DataSource<Renderable>;

        expect((rendered.value as AurumElementModel<any>).factory).toBe(PanelComponent);
        root.update(second);
        const panel = rendered.value as AurumElementModel<any>;
        expect(panel.children.some((child) => (child as AurumElementModel<any>)?.factory === (PanelDockLeft as any))).toBe(true);
    });
});
