import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    createAPI,
    createRenderSession,
    DataSource,
    Renderable,
    aurumToString
} from '@aurumjs/html';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from '../src/alert/alert.js';
import { Card } from '../src/card/card.js';
import { ContextMenu, spawnContextMenu } from '../src/dialog/context_menu.js';
import { WindowManager } from '../src/dialog/window_manager.js';
import { ErrorIndicator } from '../src/form/error_indicator.js';
import { createForm } from '../src/form/form.js';
import { LoadingSpinner } from '../src/form/loading_spinner.js';
import { Button } from '../src/input/button.js';
import { ColorPicker } from '../src/input/color_picker.js';
import { FilePicker } from '../src/input/file_picker.js';
import { Submit } from '../src/input/submit.js';
import { TextAreaField } from '../src/input/text_area_field.js';
import { Grid } from '../src/layout/grid.js';
import { Currency } from '../src/misc/currency.js';
import { Sidebar, SidebarItem } from '../src/navigation/sidebar.js';
import { TreeEntry } from '../src/tree_view/tree_view_model.js';
import { isDirectory, isFile, sortItems, TreeViewSorting } from '../src/tree_view/tree_view_common.js';

function componentApi(): AurumComponentAPI {
    return createAPI(createRenderSession());
}

describe('public component primitives', () => {
    it('renders alerts, buttons, cards, grids, sidebars, and input wrappers', async () => {
        const closable = new DataSource(true);
        const loading = new DataSource(true);
        const pickedName = new DataSource('none');
        const pickedFile = new DataSource<File>();

        const html = await aurumToString(
            <div>
                <Alert type="success" message="Saved" />
                <Alert type="warning" icon="custom" message="Careful">
                    ignored
                </Alert>
                <Button buttonType="destructive" icon="!">
                    Delete
                </Button>
                <Card closable={closable}>Card body</Card>
                <Grid columns={2} gap="4px">
                    <span>A</span>
                    <span>B</span>
                </Grid>
                <Sidebar class="nav">
                    <SidebarItem href="/home" title="Home">
                        H
                    </SidebarItem>
                </Sidebar>
                <TextAreaField decorators={<b>decorator</b>} value="text" />
                <ColorPicker value={new DataSource('#ff0000')} />
                <FilePicker value={pickedName} file={pickedFile} filter=".txt" />
                <LoadingSpinner isLoading={loading} message="Working" size={20} />
            </div>
        );

        expect(html).toContain('✔️');
        expect(html).toContain('Saved');
        expect(html).toContain('custom');
        expect(html).toContain('Delete');
        expect(html).toContain('Card body');
        expect(html).toContain('href="/home"');
        expect(html).toContain('<textarea');
        expect(html).toContain('type="color"');
        expect(html).toContain('readonly');
        expect(html).toContain('Working');
    });

    it('formats static and reactive currency amounts', () => {
        const amount = new DataSource(1234.5);
        const reactive = Currency({ currency: 'USD', amount, locale: 'en-US' }, [], componentApi()) as DataSource<string>;
        const fixed = Currency({ currency: 'EUR', amount: 2, locale: 'en-US' }, [], componentApi()) as DataSource<string>;

        expect(reactive.value).toBe('$1,234.50');
        expect(fixed.value).toBe('€2.00');
        amount.update(10);
        expect(reactive.value).toBe('$10.00');
    });

    it('submits through the button wrapper and preserves a supplied disabled value', async () => {
        let submissions = 0;
        let clicks = 0;
        const form = createForm({ fields: { name: { source: new DataSource('Aurum'), required: true } } }, async () => {
            submissions++;
        });
        const model = Submit(
            { form, buttonType: 'action', disabled: false, onClick: () => clicks++ },
            ['Save'],
            componentApi()
        ) as AurumElementModel<any>;

        expect(model.factory).toBe(Button);
        expect(model.props.disabled).toBe(false);
        model.props.onClick({} as MouseEvent);
        await vi.waitFor(() => expect(submissions).toBe(1));
        expect(clicks).toBe(1);
    });

    it('renders form validation and submission errors', async () => {
        const value = new DataSource('ready');
        const form = createForm({ fields: { name: { source: value, required: true } } }, async (_value, fail) => fail('Server error'));
        await form.submit();
        value.update('');
        await form.validateAll();

        const html = await aurumToString(<ErrorIndicator form={form} />);
        expect(html).toContain('[name] This field is required');
        expect(html).toContain('Server error');
    });

    it('wraps context-menu items and exposes deterministic close behavior', async () => {
        const closed = vi.fn();
        const target = {} as HTMLElement;
        const menu = spawnContextMenu(['One', 'Two'], { target, offsetX: 4, offsetY: 8 }, { onClose: closed });
        const dialog = menu as AurumElementModel<any>;

        expect(dialog.props.target).toBe(target);
        expect(dialog.props.layout.offset).toEqual({ x: 4, y: 8 });
        dialog.props.onClickInside();
        dialog.props.onClickOutside();
        dialog.props.onEscape();
        expect(closed).toHaveBeenCalledTimes(3);

        const html = await aurumToString(<ContextMenu>{['One', ['Two']]}</ContextMenu>);
        expect(html).toContain('<li>One</li>');
        expect(html).toContain('<li>Two</li>');
    });

    it('moves a clicked managed window to the front and validates its child contract', () => {
        const windows = new ArrayDataSource<Renderable>(['first', 'second', 'third']);
        const rendered = WindowManager({}, [windows], componentApi()) as ArrayDataSource<AurumElementModel<any>>;
        const firstWrapper = rendered.get(0);
        const stopPropagation = vi.fn();

        firstWrapper.props.onMouseDown({ stopPropagation } as unknown as MouseEvent);
        expect(stopPropagation).toHaveBeenCalledOnce();
        expect(windows.toArray()).toEqual(['second', 'third', 'first']);
        expect(() => WindowManager({}, ['invalid'], componentApi())).toThrow('exactly one child');
    });
});

describe('tree entry helpers', () => {
    const fileA: TreeEntry<void> = { name: 'a.txt' };
    const fileB: TreeEntry<void> = { name: new DataSource('b.txt') };
    const folderA: TreeEntry<void> = { name: 'alpha', children: new ArrayDataSource() };
    const folderB: TreeEntry<void> = { name: 'beta', lazyLoad: async () => [] };

    it('identifies files and both eager and lazy directories', () => {
        expect(isFile(fileA)).toBe(true);
        expect(isDirectory(fileA)).toBe(false);
        expect(isDirectory(folderA)).toBe(true);
        expect(isDirectory(folderB)).toBe(true);
    });

    it('sorts alphabetically and honors file/folder priority', () => {
        expect(sortItems(fileA, fileB, TreeViewSorting.ALPHABETICAL_ASC, 'none')).toBeLessThan(0);
        expect(sortItems(fileA, fileB, TreeViewSorting.ALPHABETICAL_DESC, 'none')).toBeGreaterThan(0);
        expect(sortItems(fileA, folderA, TreeViewSorting.NONE, 'files')).toBeLessThan(0);
        expect(sortItems(fileA, folderA, TreeViewSorting.NONE, 'folders')).toBeGreaterThan(0);
        expect(sortItems(folderA, folderB, TreeViewSorting.FOLDERS_ALPHABETICAL_ASC_FILES_NONE, 'none')).toBeLessThan(0);
        expect(sortItems(folderA, folderB, TreeViewSorting.FOLDERS_ALPHABETICAL_DESC_FILES_NONE, 'none')).toBeGreaterThan(0);
        expect(() => sortItems(fileA, fileB, 99 as TreeViewSorting, 'none')).toThrow('Invalid sort option');
    });
});
