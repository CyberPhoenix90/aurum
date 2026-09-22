import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    createAPI,
    createRenderSession,
    DataSource,
    ReadOnlyArrayDataSource,
    Renderable
} from '@aurumjs/html';
import { describe, expect, it, vi } from 'vitest';
import { createForm } from '../src/form/form.js';
import { DropDownMenu, DropDownMenuOption } from '../src/input/drop_down_menu.js';
import { ListSelect, ListSelectOption } from '../src/input/list_select.js';
import { TabBar, TabBarItem } from '../src/tab_bar/tab_bar.js';

function componentApi(): AurumComponentAPI {
    return createAPI(createRenderSession());
}

function option<T>(factory: typeof ListSelectOption | typeof DropDownMenuOption, value: T, label: string): AurumElementModel<{ value: T }> {
    return Aurum.factory(factory, { value }, label);
}

function key(name: string): KeyboardEvent {
    return { key: name } as KeyboardEvent;
}

describe('list selection controls', () => {
    it('keeps list index and value synchronized for keyboard, pointer, and external updates', () => {
        const selectedValue = new DataSource('alpha');
        const selectedIndex = new DataSource(0);
        const root = ListSelect(
            { selectedValue, selectedIndex },
            [option(ListSelectOption, 'alpha', 'Alpha'), option(ListSelectOption, 'beta', 'Beta'), option(ListSelectOption, 'bravo', 'Bravo')],
            componentApi()
        ) as AurumElementModel<any>;
        const list = root.children[0] as AurumElementModel<any>;
        list.props.onAttach({ children: [{ textContent: 'Alpha' }, { textContent: 'Beta' }, { textContent: 'Bravo' }] } as unknown as HTMLUListElement);

        list.props.onKeyDown(key('ArrowDown'));
        expect(selectedIndex.value).toBe(1);
        expect(selectedValue.value).toBe('beta');
        list.props.onKeyDown(key('ArrowUp'));
        list.props.onKeyDown(key('ArrowUp'));
        expect(selectedIndex.value).toBe(2);
        list.props.onKeyDown(key('b'));
        expect(selectedIndex.value).toBe(1);

        const items = list.children[0] as ReadOnlyArrayDataSource<AurumElementModel<any>>;
        items.get(2).props.onClick();
        expect(selectedValue.value).toBe('bravo');
        selectedValue.update('alpha');
        expect(selectedIndex.value).toBe(0);
    });

    it('derives list options and bindings from a form schema', () => {
        const choice = new DataSource<'one' | 'two'>('one');
        const form = createForm<{ choice: 'one' | 'two' }>(
            { fields: { choice: { source: choice, oneOf: ['one', 'two'] } } },
            async () => undefined
        );
        const root = ListSelect<'one' | 'two', { choice: 'one' | 'two' }>({ form, name: 'choice' }, [], componentApi()) as AurumElementModel<any>;
        const list = root.children[0] as AurumElementModel<any>;
        const items = list.children[0] as ReadOnlyArrayDataSource<AurumElementModel<any>>;

        expect(items.length.value).toBe(2);
        items.get(1).props.onClick();
        expect(choice.value).toBe('two');
    });

    it('opens a drop-down, moves its highlight, commits a choice, and follows external values', () => {
        const selectedValue = new DataSource('alpha');
        const selectedIndex = new DataSource(0);
        const isOpen = new DataSource(false);
        const root = DropDownMenu(
            { selectedValue, selectedIndex, isOpen },
            [option(DropDownMenuOption, 'alpha', 'Alpha'), option(DropDownMenuOption, 'beta', 'Beta')],
            componentApi()
        ) as AurumElementModel<any>;
        root.props.onAttach({ clientWidth: 180, clientHeight: 24 } as HTMLDivElement);

        root.props.onClick();
        expect(isOpen.value).toBe(true);
        const dialogSource = root.children[2] as DataSource<Renderable>;
        expect((dialogSource.value as AurumElementModel<any>).name).toBe('Dialog');
        root.props.onKeyDown(key('ArrowDown'));
        root.props.onKeyDown(key('Enter'));
        expect(isOpen.value).toBe(false);
        expect(selectedIndex.value).toBe(1);
        expect(selectedValue.value).toBe('beta');

        selectedValue.update('alpha');
        expect(selectedIndex.value).toBe(0);
        root.props.onKeyDown(key('Escape'));
        expect(isOpen.value).toBe(false);
    });
});

describe('tab bar', () => {
    it('selects, reorders, closes, and falls back when a selected tab disappears', () => {
        const selected = new DataSource<string>('first');
        const onClose = vi.fn();
        const onReorder = vi.fn();
        const first = Aurum.factory(TabBarItem, { id: 'first', title: 'First' }, 'First');
        const second = Aurum.factory(TabBarItem, { id: 'second', title: 'Second' }, 'Second');
        const tabs = new ArrayDataSource<Renderable>([first, second]);
        const root = TabBar({ selected, canClose: true, canReorder: true, onClose, onReorder }, [tabs], componentApi()) as AurumElementModel<any>;
        const renderedTabs = root.children[0] as ReadOnlyArrayDataSource<AurumElementModel<any>>;
        const firstTab = renderedTabs.get(0);
        const secondTab = renderedTabs.get(1);

        secondTab.props.onMouseUp({ button: 0 } as MouseEvent);
        expect(selected.value).toBe('second');
        secondTab.props.onMouseUp({ button: 1 } as MouseEvent);
        expect(onClose).toHaveBeenCalledWith('second', 1);
        firstTab.props.onDragStart();
        secondTab.props.onDragEnter();
        expect(onReorder).toHaveBeenCalledWith('second', 'first');

        tabs.remove(second);
        expect(selected.value).toBe('first');
        tabs.clear();
        expect(selected.value).toBeUndefined();
    });
});
