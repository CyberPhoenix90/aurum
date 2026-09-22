import { AurumComponentAPI, AurumElementModel, createAPI, createRenderSession, DataSource, Renderable, aurumToString } from '@aurumjs/html';
import { describe, expect, it, vi } from 'vitest';
import { JSONRenderer, JSONRendererBranch } from '../src/input/json_renderer.js';

function componentApi(): AurumComponentAPI {
    return createAPI(createRenderSession());
}

describe('JSON renderer', () => {
    it('validates its child contract and follows a reactive root', () => {
        const api = componentApi();
        expect(() => JSONRenderer({}, [], api)).toThrow('exactly one child');
        expect(() => JSONRenderer({}, [{}, {}], api)).toThrow('exactly one child');

        const value = new DataSource<any>(null);
        const rendered = JSONRenderer({}, [value], api) as DataSource<Renderable>;
        expect(rendered.value).toEqual([]);
        value.update({ answer: 42 });
        expect((rendered.value as AurumElementModel<any>).factory).toBe(JSONRendererBranch);
    });

    it('renders primitive, special, date, empty, nested, and truncated values', async () => {
        const rendered = JSONRenderer(
            {
                maxStringSize: 4,
                preExpanded: true,
                previewFields: ['label'],
                datePreview: { isDate: (key) => key === 'created', formatDate: (value) => `date:${value}` }
            },
            [
                {
                    missing: undefined,
                    nothing: null,
                    count: 3,
                    enabled: true,
                    short: 'ok',
                    message: 'a long value',
                    created: 123,
                    emptyObject: {},
                    emptyArray: [],
                    nested: { label: 'preview', value: 1 }
                }
            ],
            componentApi()
        );

        const html = await aurumToString(rendered);
        expect(html).toContain('missing: <span');
        expect(html).toContain('undefined');
        expect(html).toContain('nothing: <span');
        expect(html).toContain('null');
        expect(html).toContain('date:123');
        expect(html).toContain('class="string">"ok"</span>');
        expect(html).toContain('a long value');
        expect(html).toContain('emptyObject: </span>{}');
        expect(html).toContain('emptyArray: </span>[]');
        expect(html).toContain('nested:');
    });

    it('edits plain and reactive properties, validates changes, and cancels cleanly', () => {
        const editing = new DataSource<string>();
        const reactive = new DataSource(1);
        const object = { plain: 'old', reactive };
        let callbacks: { onEditDone(value: unknown): void; onEditCancelled(): void };
        const inputComponent = vi.fn((_key: string, _value: unknown, nextCallbacks: typeof callbacks) => {
            callbacks = nextCallbacks;
            return 'editor';
        });
        const props = {
            id: '',
            editing,
            allowEdit: {
                inputComponent,
                validateNewValue: (key: string, value: unknown) => key !== 'plain' || value !== 'invalid'
            }
        } as any;
        const rendered = JSONRendererBranch(props, [object]) as DataSource<Renderable>;

        let rows = ((rendered.value as AurumElementModel<any>).children[0] as Array<DataSource<Renderable>>);
        (rows[0].value as AurumElementModel<any>).props.onClick();
        expect(editing.value).toBe('|plain');
        expect(inputComponent).toHaveBeenCalledWith('plain', 'old', expect.any(Object));
        callbacks!.onEditDone('invalid');
        expect(object.plain).toBe('old');
        expect(editing.value).toBeUndefined();

        rows = (rendered.value as AurumElementModel<any>).children[0] as Array<DataSource<Renderable>>;
        (rows[0].value as AurumElementModel<any>).props.onFocus();
        callbacks!.onEditDone('new');
        expect(object.plain).toBe('new');

        (rows[1].value as AurumElementModel<any>).props.onClick();
        callbacks!.onEditDone(2);
        expect(reactive.value).toBe(2);
        (rows[1].value as AurumElementModel<any>).props.onClick();
        callbacks!.onEditCancelled();
        expect(editing.value).toBeUndefined();
    });

    it('loads large objects in deterministic pages', () => {
        const editing = new DataSource<string>();
        const rendered = JSONRendererBranch({ id: '', editing, maxArrayIndexesPerLoadMore: 1 } as any, [{ a: 1, b: 2, c: 3 }]) as DataSource<Renderable>;
        let rows = (rendered.value as AurumElementModel<any>).children[0] as Renderable[];
        expect(rows.filter(Boolean)).toHaveLength(2);
        (rows[1] as AurumElementModel<any>).props.onClick();

        rows = (rendered.value as AurumElementModel<any>).children[0] as Renderable[];
        expect(rows.filter(Boolean)).toHaveLength(3);
    });
});
