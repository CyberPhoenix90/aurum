import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    DataSource,
    ReadOnlyArrayDataSource,
    Renderable,
    aurumToString,
    createAPI,
    createRenderSession
} from '@aurumjs/html';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Accordion, AccordionItem } from '../src/accordion/accordion.js';
import { BarChart, DataPoint, Serie } from '../src/charts/barchart.js';
import { Toast, Toaster } from '../src/dialog/toaster.js';
import {
    MenuStrip,
    MenuStripButton,
    MenuStripMenu,
    MenuStripMenuContent,
    MenuStripRadioButton
} from '../src/menu_strip/menu_strip.js';
import { TreeViewComponent, TreeViewComponentProps } from '../src/tree_view/tree_view_component.js';
import { TreeEntry } from '../src/tree_view/tree_view_model.js';

type Model = AurumElementModel<any>;

function componentApi(): AurumComponentAPI {
    return createAPI(createRenderSession());
}

function model(factory: (...args: any[]) => any, props: any = {}, ...children: Renderable[]): Model {
    return Aurum.factory(factory, props, ...children) as Model;
}

function mappedChild(parent: Model, index: number): Model {
    return (parent.children[0] as ReadOnlyArrayDataSource<Model>).get(index);
}

class ResizeObserverMock {
    public static instances: ResizeObserverMock[] = [];
    public readonly observe = vi.fn();
    public readonly disconnect = vi.fn();

    public constructor(public readonly callback: ResizeObserverCallback) {
        ResizeObserverMock.instances.push(this);
    }

    public unobserve(): void {}
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    ResizeObserverMock.instances = [];
});

describe('accordion', () => {
    it('toggles items from pointer and keyboard input and enforces single-open mode', () => {
        const firstExpanded = new DataSource(false);
        const secondExpanded = new DataSource(false);
        const first = model(AccordionItem, { title: 'First', expanded: firstExpanded }, 'First body');
        const second = model(AccordionItem, { title: 'Second', expanded: secondExpanded }, 'Second body');
        const accordion = Accordion(
            { singleOpen: true, sizeMode: { type: 'fit-content' } },
            [first, second],
            componentApi()
        ) as Model;
        const firstHeader = mappedChild(accordion, 0).children[0] as Model;
        const secondHeader = mappedChild(accordion, 1).children[0] as Model;

        firstHeader.props.onClick();
        expect(firstExpanded.value).toBe(true);
        secondHeader.props.onClick();
        expect(secondExpanded.value).toBe(true);
        expect(firstExpanded.value).toBe(false);

        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();
        secondHeader.props.onKeyDown({ key: 'Enter', preventDefault, stopPropagation } as unknown as KeyboardEvent);
        expect(preventDefault).toHaveBeenCalledOnce();
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(secondExpanded.value).toBe(false);

        const focusNext = vi.fn();
        const focusPrevious = vi.fn();
        const target = {
            parentElement: {
                nextElementSibling: { childNodes: [{ focus: focusNext }] },
                previousElementSibling: { childNodes: [{ focus: focusPrevious }] }
            }
        };
        firstHeader.props.onKeyDown({ key: 'ArrowDown', target, preventDefault } as unknown as KeyboardEvent);
        firstHeader.props.onKeyDown({ key: 'ArrowUp', target, preventDefault } as unknown as KeyboardEvent);
        expect(focusNext).toHaveBeenCalledOnce();
        expect(focusPrevious).toHaveBeenCalledOnce();
        expect(AccordionItem({ title: 'transcluded' })).toBeUndefined();
    });

    it('applies fit-content and even-share measurements and releases resize observers', () => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);

        const fitExpanded = new DataSource(true);
        const fitApi = componentApi();
        const fit = Accordion(
            { sizeMode: { type: 'fit-content' } },
            [model(AccordionItem, { title: 'Fit', expanded: fitExpanded }, 'content')],
            fitApi
        ) as Model;
        const fitItem = mappedChild(fit, 0);
        const fitContent = (fitItem.children[1] as DataSource<Model>).value;
        const fitElement = { scrollHeight: 87, firstChild: {}, style: {} as Record<string, string> };
        fitContent.props.onAttach(fitElement);
        expect(fitElement.style.maxHeight).toBe('87px');

        const firstExpanded = new DataSource(true);
        const secondExpanded = new DataSource(true);
        const evenApi = componentApi();
        const even = Accordion(
            { sizeMode: { type: 'even-share', height: 300 } },
            [
                model(AccordionItem, { title: 'One', expanded: firstExpanded }, 'one'),
                model(AccordionItem, { title: 'Two', expanded: secondExpanded }, 'two')
            ],
            evenApi
        ) as Model;
        expect(even.props.style).toContain('height: 300px');
        even.props.onAttach({ clientHeight: 300 });
        const firstItem = mappedChild(even, 0);
        const secondItem = mappedChild(even, 1);
        (firstItem.children[0] as Model).props.onAttach({ clientHeight: 20 });
        (secondItem.children[0] as Model).props.onAttach({ clientHeight: 20 });
        const firstElement = { style: {} as Record<string, string> };
        const secondElement = { style: {} as Record<string, string> };
        ((firstItem.children[1] as DataSource<Model>).value as Model).props.onAttach(firstElement);
        ((secondItem.children[1] as DataSource<Model>).value as Model).props.onAttach(secondElement);
        expect(firstElement.style.maxHeight).toBe('130px');
        expect(secondElement.style.maxHeight).toBe('130px');

        (firstItem.children[0] as Model).props.onDetach();
        fitApi.renderSession.sessionToken.cancel();
        evenApi.renderSession.sessionToken.cancel();
        expect(ResizeObserverMock.instances.some((observer) => observer.disconnect.mock.calls.length > 0)).toBe(true);
    });
});

describe('menu strip', () => {
    it('coordinates radio buttons and wraps regular buttons', () => {
        const firstActive = new DataSource(false);
        const secondActive = new DataSource(false);
        const firstDeactivated = vi.fn();
        const firstClicked = vi.fn();
        const first = model(
            MenuStripRadioButton,
            { isActive: firstActive, onDeactivate: firstDeactivated, onClick: firstClicked },
            'First'
        );
        const second = model(MenuStripRadioButton, { isActive: secondActive }, 'Second');
        const button = model(MenuStripButton, { buttonType: 'action', onClick: vi.fn() }, 'Run');
        const unrelated = <b>Label</b> as Model;
        const strip = MenuStrip({ dialogSource: new DataSource<Renderable>() }, [first, unrelated, second, button], componentApi()) as Model;

        expect(strip.children[0]).toEqual([first, unrelated, second, button]);
        expect(first.props.controller).toBe(second.props.controller);
        expect(button.props.controller).toBe(first.props.controller);
        expect(unrelated.props?.controller).toBeUndefined();

        const renderedFirst = first.factory(first.props, first.children, componentApi()) as Model;
        const renderedSecond = second.factory(second.props, second.children, componentApi()) as Model;
        renderedFirst.props.onClick({} as MouseEvent);
        expect(firstActive.value).toBe(true);
        expect(firstClicked).toHaveBeenCalledOnce();
        renderedSecond.props.onClick({} as MouseEvent);
        expect(secondActive.value).toBe(true);
        expect(firstActive.value).toBe(false);
        expect(firstDeactivated).toHaveBeenCalledOnce();

        const renderedButton = MenuStripButton(button.props, button.children) as Model;
        expect((renderedButton.children[0] as Model).name).toBe('Button');
        expect(MenuStripMenuContent({}, ['transcluded'])).toBeUndefined();
    });

    it('opens and closes menu dialogs through data-source and array queues', () => {
        const dialogSource = new DataSource<Renderable>();
        const menuContent = model(MenuStripMenuContent, {}, 'Open', 'Save');
        const menu = model(MenuStripMenu, { class: 'file-menu' }, 'File', menuContent);
        MenuStrip({ dialogSource }, [menu], componentApi());
        const renderedMenu = menu.factory(menu.props, menu.children, componentApi()) as Model;
        const target = {} as HTMLElement;
        renderedMenu.props.onAttach(target);

        for (const closeHandler of ['onEscape', 'onClickOutside', 'onClickInside']) {
            renderedMenu.props.onClick();
            const dialog = dialogSource.value as Model;
            expect(dialog.name).toBe('Dialog');
            expect(dialog.props.target).toBe(target);
            expect(dialog.props.layout).toEqual({ direction: 'down', targetPoint: 'start' });
            dialog.props[closeHandler]();
            expect(dialogSource.value).toBeUndefined();
        }

        const dialogs = new ArrayDataSource<Renderable>();
        const arrayMenu = model(MenuStripMenu, {}, 'Edit', model(MenuStripMenuContent, {}, 'Copy'));
        MenuStrip({ dialogSource: dialogs }, [arrayMenu], componentApi());
        const renderedArrayMenu = arrayMenu.factory(arrayMenu.props, arrayMenu.children, componentApi()) as Model;
        renderedArrayMenu.props.onAttach({} as HTMLElement);
        renderedArrayMenu.props.onMouseEnter();
        renderedArrayMenu.props.onClick();
        expect(dialogs.length.value).toBe(1);
        (dialogs.get(0) as Model).props.onClickInside();
        expect(dialogs.length.value).toBe(0);
    });
});

describe('toast and toaster', () => {
    it('renders every toast presentation type', async () => {
        const html = await aurumToString(
            <div>
                <Toast type="info">Info</Toast>
                <Toast type="success">Success</Toast>
                <Toast type="warning">Warning</Toast>
                <Toast type="error">Error</Toast>
            </div>
        );

        expect(html).toContain('Info');
        expect(html).toContain('Success');
        expect(html).toContain('Warning');
        expect(html).toContain('Error');
        expect(html).toMatch(/class="[^"]* info"/);
        expect(html).toMatch(/class="[^"]* success"/);
        expect(html).toMatch(/class="[^"]* warn"/);
        expect(html).toMatch(/class="[^"]* error"/);
    });

    it('queues reactive children, honors per-toast timing, and removes queued children', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            return setTimeout(() => callback(0), 0) as unknown as number;
        });
        const queue = new ArrayDataSource<Renderable>();
        const api = componentApi();
        const toaster = Toaster({ defaultToastActiveTime: 100, style: 'left:0;' }, [queue], api) as Model;
        const activeToast = toaster.children[0] as DataSource<Renderable>;
        const style = toaster.props.style as DataSource<string>;
        const first = model(Toast, { type: 'info', activeTime: 25 }, 'first');
        const second = model(Toast, { type: 'success' }, 'second');
        const removed = model(Toast, { type: 'error' }, 'removed');

        queue.push(first, second, removed);
        queue.remove(removed);
        expect(activeToast.value).toBe(first);
        expect(style.value).toContain('top:85%');

        await vi.advanceTimersByTimeAsync(25);
        expect(style.value).toContain('top:100%');
        await vi.advanceTimersByTimeAsync(400);
        await vi.advanceTimersByTimeAsync(1);
        expect(activeToast.value).toBe(second);
        expect(style.value).toContain('top:85%');

        await vi.advanceTimersByTimeAsync(500);
        expect(activeToast.value).toBeUndefined();
        api.renderSession.sessionToken.cancel();
    });
});

function renderTree<T>(props: TreeViewComponentProps<T>): {
    api: AurumComponentAPI;
    root: Model;
    entryModels: ReadOnlyArrayDataSource<Model>;
} {
    const shellSource = (TreeViewComponent(props) as Renderable[])[0] as DataSource<Model>;
    const shell = shellSource.value;
    const renderer = shell.children[0] as Model;
    const api = componentApi();
    const root = renderer.factory(renderer.props, renderer.children, api) as Model;
    return { api, root, entryModels: root.children[0] as ReadOnlyArrayDataSource<Model> };
}

function renderTreeEntry(entryModel: Model): { wrapper: Model; row: Model } {
    const wrapper = entryModel.factory(entryModel.props, entryModel.children, componentApi()) as Model;
    return { wrapper, row: (wrapper.children[0] as Renderable[])[0] as Model };
}

function keyboardEvent(key: string): KeyboardEvent {
    const event = new Event('keydown', { cancelable: true }) as KeyboardEvent;
    Object.defineProperty(event, 'key', { value: key });
    return event;
}

describe('tree view', () => {
    it('switches reactively between the empty state and populated renderer', () => {
        const entries = new ArrayDataSource<TreeEntry<void>>();
        const source = (TreeViewComponent({ entries, noEntriesMsg: 'Nothing here' }) as Renderable[])[0] as DataSource<Model>;
        expect(source.value.children).toEqual(['Nothing here']);
        expect(source.value.props.class).toContain('tree-view-component no-entries');

        entries.push({ name: 'file.txt' });
        expect((source.value.children[0] as Model).name).toBe('RenderTreeView');
        expect(source.value.props.class).toContain('tree-view-component');
    });

    it('navigates open folders with the keyboard and restores focus after renaming', () => {
        const windowTarget = new EventTarget();
        vi.stubGlobal('window', windowTarget);
        const child: TreeEntry<void> = { name: 'child.txt' };
        const folder: TreeEntry<void> = {
            name: 'folder',
            children: new ArrayDataSource([child]),
            open: new DataSource(true)
        };
        const sibling: TreeEntry<void> = { name: 'sibling.txt' };
        const renaming = new DataSource<TreeEntry<void>>();
        const selected = vi.fn();
        const { api, entryModels } = renderTree({
            entries: new ArrayDataSource([folder, sibling]),
            allowFocus: true,
            renaming,
            onEntrySelected: selected
        });
        const { row: folderRow } = renderTreeEntry(entryModels.get(0));

        folderRow.props.onMouseUp();
        expect(selected).toHaveBeenLastCalledWith(folder);
        windowTarget.dispatchEvent(keyboardEvent('ArrowDown'));
        expect(selected).toHaveBeenLastCalledWith(child);
        windowTarget.dispatchEvent(keyboardEvent('ArrowLeft'));
        expect(selected).toHaveBeenLastCalledWith(folder);
        windowTarget.dispatchEvent(keyboardEvent('ArrowLeft'));
        expect(folder.open.value).toBe(false);
        windowTarget.dispatchEvent(keyboardEvent('ArrowRight'));
        expect(folder.open.value).toBe(true);
        windowTarget.dispatchEvent(keyboardEvent('ArrowRight'));
        expect(selected).toHaveBeenLastCalledWith(child);
        windowTarget.dispatchEvent(keyboardEvent('ArrowUp'));
        expect(selected).toHaveBeenLastCalledWith(folder);

        renaming.update(folder);
        renaming.update(undefined);
        expect(selected).toHaveBeenLastCalledWith(folder);
        api.renderSession.sessionToken.cancel();
    });

    it('forwards entry events, renames reactive entries, and performs validated drag and drop', () => {
        const sourceName = new DataSource('source');
        const source: TreeEntry<void> = { name: sourceName };
        const target: TreeEntry<void> = { name: 'target' };
        const renaming = new DataSource<TreeEntry<void>>();
        const clicked = vi.fn();
        const doubleClicked = vi.fn();
        const rightClicked = vi.fn();
        const keyDown = vi.fn();
        const keyUp = vi.fn();
        const dropped = vi.fn();
        const canDrop = vi.fn(() => true);
        const { entryModels } = renderTree({
            entries: new ArrayDataSource([source, target]),
            allowDragAndDrop: true,
            renaming,
            onEntryClicked: clicked,
            onEntryDoubleClicked: doubleClicked,
            onEntryRightClicked: rightClicked,
            onKeyDown: keyDown,
            onKeyUp: keyUp,
            canDrop,
            onEntryDrop: dropped
        });
        const { row: sourceRow } = renderTreeEntry(entryModels.get(0));
        const { row: targetRow } = renderTreeEntry(entryModels.get(1));
        const mouse = {} as MouseEvent;
        const key = { key: 'a' } as KeyboardEvent;

        sourceRow.props.onClick(mouse);
        sourceRow.props.onDblClick(mouse);
        sourceRow.props.onContextMenu(mouse);
        sourceRow.props.onKeyDown(key);
        sourceRow.props.onKeyUp(key);
        expect(clicked).toHaveBeenCalledWith(mouse, source, []);
        expect(doubleClicked).toHaveBeenCalledWith(mouse, source, []);
        expect(rightClicked).toHaveBeenCalledWith(mouse, source, []);
        expect(keyDown).toHaveBeenCalledWith(key, source, []);
        expect(keyUp).toHaveBeenCalledWith(key, source, []);

        sourceRow.props.onDragStart({ preventDefault: vi.fn() } as unknown as DragEvent);
        targetRow.props.onDragEnter({} as DragEvent);
        targetRow.props.onDragLeave();
        targetRow.props.onDragEnter({} as DragEvent);
        sourceRow.props.onDragEnd();
        expect(canDrop).toHaveBeenCalledWith(source, target);
        expect(dropped).toHaveBeenCalledWith(source, target);

        renaming.update(source);
        const renameSource = sourceRow.children[1] as DataSource<Renderable>;
        const renameParts = renameSource.value as Renderable[];
        const textField = renameParts.find((part) => (part as Model)?.name === 'TextField') as Model;
        (textField.props.value as DataSource<string>).update('renamed');
        textField.props.onKeyDown({ key: 'Enter' } as KeyboardEvent);
        expect(sourceName.value).toBe('renamed');
        expect(renaming.value).toBeUndefined();

        renaming.update(source);
        const secondTextField = ((sourceRow.children[1] as DataSource<Renderable>).value as Renderable[]).find(
            (part) => (part as Model)?.name === 'TextField'
        ) as Model;
        (secondTextField.props.value as DataSource<string>).update('');
        secondTextField.props.onBlur();
        expect(sourceName.value).toBe('renamed');
    });

    it('loads lazy folders once and allows arrow-only expansion', async () => {
        let finishLoading: (entries: TreeEntry<void>[]) => void;
        const lazyLoad = vi.fn(
            () =>
                new Promise<TreeEntry<void>[]>((resolve) => {
                    finishLoading = resolve;
                })
        );
        const folder: TreeEntry<void> = { name: 'lazy', lazyLoad };
        const arrowClicked = vi.fn();
        const { entryModels } = renderTree({
            entries: new ArrayDataSource([folder]),
            disableAutoOpenOnSelect: true,
            onArrowClicked: arrowClicked
        });
        const { row } = renderTreeEntry(entryModels.get(0));
        const arrow = row.children[0] as Model;
        const arrowClass = arrow.props.class as DataSource<string>;

        expect(arrowClass.value).toBe('arrow-right');
        row.props.onClick({} as MouseEvent);
        expect(folder.open.value).toBe(false);
        arrow.props.onClick({} as MouseEvent);
        expect(folder.open.value).toBe(true);
        expect(lazyLoad).toHaveBeenCalledOnce();
        expect(arrowClicked).toHaveBeenCalledOnce();
        expect(arrowClass.value).toBe('arrow-loading');

        finishLoading([{ name: 'loaded.txt' }]);
        await vi.waitFor(() => expect(folder.children.length.value).toBe(1));
        expect(folder.lazyLoad).toBeUndefined();
        expect(arrowClass.value).toBe('arrow-down');
    });
});

function firstSerieModel(chart: Model): Model {
    const canvas = chart.children[0] as Model;
    const series = canvas.children[0] as Model[] | ReadOnlyArrayDataSource<Model>;
    return Array.isArray(series) ? series[0] : series.get(0);
}

function renderBars(method: 'avg' | 'max' | 'min'): ReadOnlyArrayDataSource<Model> {
    const chart = BarChart(
        {
            series: [
                {
                    label: method,
                    color: 'red',
                    data: [
                        { timestamp: 0, value: 2 },
                        { timestamp: 1, value: 6 },
                        { timestamp: 10, value: 10 }
                    ]
                }
            ],
            buckets: 2,
            bucketAggregationMethod: method
        },
        [],
        componentApi()
    ) as Model;
    chart.props.onAttach({ getBoundingClientRect: () => ({ width: 200, height: 100 }) });
    const serie = firstSerieModel(chart);
    return serie.factory(serie.props, serie.children, componentApi()) as ReadOnlyArrayDataSource<Model>;
}

describe('bar chart', () => {
    it('sizes bars and supports average, maximum, and minimum bucket aggregation', () => {
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        const expectedFirstHeight = { avg: 40, max: 60, min: 20 };

        for (const method of ['avg', 'max', 'min'] as const) {
            const bars = renderBars(method);
            expect(bars.length.value).toBe(2);
            expect((bars.get(0).props.height as DataSource<number>).value).toBe(expectedFirstHeight[method]);
            expect((bars.get(0).props.width as DataSource<number>).value).toBe(98);
            expect((bars.get(0).props.x as DataSource<number>).value).toBe(0);
            expect((bars.get(1).props.y as DataSource<number>).value).toBe(0);
            expect((bars.get(1).props.x as DataSource<number>).value).toBe(101);
            expect(bars.get(0).props.fillColor).toBe('red');
        }
    });

    it('reacts to container resizing and dynamic bucket counts', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        const bounds = { width: 120, height: 60 };
        const buckets = new DataSource(2);
        const chart = BarChart(
            {
                series: [{ label: 'dynamic', color: 'blue', data: [{ timestamp: 0, value: 5 }, { timestamp: 10, value: 10 }] }],
                buckets,
                bucketAggregationMethod: 'max'
            },
            [],
            componentApi()
        ) as Model;
        chart.props.onAttach({ getBoundingClientRect: () => bounds });
        const serie = firstSerieModel(chart);
        const bars = serie.factory(serie.props, serie.children, componentApi()) as ReadOnlyArrayDataSource<Model>;
        expect(bars.length.value).toBe(2);

        bounds.width = 240;
        bounds.height = 120;
        ResizeObserverMock.instances[0].callback([], ResizeObserverMock.instances[0] as unknown as ResizeObserver);
        expect((bars.get(0).props.width as DataSource<number>).value).toBe(118);

        buckets.update(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(bars.length.value).toBe(1);
        expect((bars.get(0).props.width as DataSource<number>).value).toBe(238);
    });

    it('recomputes all bounds after a boundary and maximum point is removed', () => {
        const low: DataPoint = { timestamp: 0, value: 2 };
        const middle: DataPoint = { timestamp: 5, value: 3 };
        const high: DataPoint = { timestamp: 10, value: 10 };
        const points = new ArrayDataSource([low, middle, high]);
        const series = new ArrayDataSource<Serie>([{ label: 'dynamic', color: 'green', data: points }]);
        const chart = BarChart(
            { series, buckets: 2, bucketAggregationMethod: 'max' },
            [],
            componentApi()
        ) as Model;
        const serie = firstSerieModel(chart);

        expect(serie.props.startTs.value).toBe(0);
        expect(serie.props.endTs.value).toBe(10);
        expect(serie.props.maxValue.value).toBe(10);
        points.remove(high);
        expect(serie.props.startTs.value).toBe(0);
        expect(serie.props.endTs.value).toBe(5);
        expect(serie.props.maxValue.value).toBe(3);
        points.remove(low);
        expect(serie.props.startTs.value).toBe(5);
        expect(serie.props.endTs.value).toBe(5);
        expect(serie.props.maxValue.value).toBe(3);

        const temporarySerie: Serie = {
            label: 'temporary',
            color: 'purple',
            data: [{ timestamp: -5, value: 8 }]
        };
        series.push(temporarySerie);
        expect(serie.props.startTs.value).toBe(-5);
        expect(serie.props.maxValue.value).toBe(8);
        series.remove(temporarySerie);
        expect(serie.props.startTs.value).toBe(5);
        expect(serie.props.endTs.value).toBe(5);
        expect(serie.props.maxValue.value).toBe(3);
    });
});
