import { afterAll, beforeAll, bench, describe } from 'vitest';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ArrayDataSource, Aurum, CancellationToken, DataSource, Renderable, dsMap } from '../src/index.js';

type TodoFilter = 'all' | 'active' | 'completed';

interface TodoSeed {
    id: number;
    title: string;
    completed: boolean;
}

interface TodoAppController {
    readonly host: HTMLElement;
    reset(todos: readonly TodoSeed[]): void;
    addMany(todos: readonly TodoSeed[]): void;
    deleteIds(ids: ReadonlySet<number>): void;
    toggleIds(ids: ReadonlySet<number>): void;
    editIds(ids: ReadonlySet<number>, suffix: string): void;
    setFilter(filter: TodoFilter): void;
    clearCompleted(): void;
    flushUserAction(action: () => void): void;
    dispose(): void;
}

const TODO_CSS = `
.todo-app{box-sizing:border-box;width:720px;padding:20px;border:1px solid #d8dee9;border-radius:14px;background:#fff;color:#202938;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 28px #1f293714}
.todo-header{display:flex;gap:8px;margin-bottom:12px}.todo-new,.todo-title{min-width:0;flex:1;padding:8px 10px;border:1px solid #cbd5e1;border-radius:7px}
.todo-add,.todo-delete,.todo-filter,.todo-clear{padding:7px 11px;border:0;border-radius:7px;background:#e2e8f0;color:#172033;cursor:pointer}.todo-add{background:#2563eb;color:white}
.todo-list{display:grid;gap:6px;margin:0;padding:0;list-style:none}.todo-item{display:flex;align-items:center;gap:9px;padding:8px;border-radius:8px;background:#f8fafc}.todo-item.completed .todo-title{text-decoration:line-through;color:#64748b}
.todo-footer{display:flex;align-items:center;gap:8px;margin-top:12px}.todo-filters{display:flex;gap:5px;margin-left:auto}.todo-filter.active{background:#334155;color:white}.todo-delete{background:#fee2e2;color:#991b1b}
`;

function createTodos(count: number, startId = 0): TodoSeed[] {
    return Array.from({ length: count }, (_, index) => ({
        id: startId + index,
        title: `Task ${startId + index}`,
        completed: (startId + index) % 3 === 0
    }));
}

function deterministicIds(total: number, count: number, seed: number): Set<number> {
    const result = new Set<number>();
    let state = seed >>> 0;
    while (result.size < count) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        result.add(state % total);
    }
    return result;
}

const reactElement = React.createElement;

interface ReactTodoAppHandle {
    reset(todos: readonly TodoSeed[]): void;
    addMany(todos: readonly TodoSeed[]): void;
    deleteIds(ids: ReadonlySet<number>): void;
    toggleIds(ids: ReadonlySet<number>): void;
    editIds(ids: ReadonlySet<number>, suffix: string): void;
    setFilter(filter: TodoFilter): void;
    clearCompleted(): void;
}

const ReactTodoRow = React.memo(function ReactTodoRow(props: {
    todo: TodoSeed;
    onToggle(id: number): void;
    onEdit(id: number, title: string): void;
    onDelete(id: number): void;
}): React.ReactElement {
    const { todo, onToggle, onEdit, onDelete } = props;
    return reactElement(
        'li',
        { className: `todo-item${todo.completed ? ' completed' : ''}`, 'data-role': 'todo-item', 'data-id': todo.id },
        reactElement('input', {
            className: 'todo-toggle',
            'data-role': 'toggle',
            type: 'checkbox',
            checked: todo.completed,
            onChange: () => onToggle(todo.id)
        }),
        reactElement('input', {
            className: 'todo-title',
            'data-role': 'title',
            value: todo.title,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => onEdit(todo.id, event.currentTarget.value)
        }),
        reactElement(
            'button',
            { className: 'todo-delete', 'data-role': 'delete', type: 'button', onClick: () => onDelete(todo.id) },
            'Delete'
        )
    );
});

const ReactTodoApp = React.forwardRef<ReactTodoAppHandle, { initialTodos: readonly TodoSeed[] }>(function ReactTodoApp(
    props,
    ref
): React.ReactElement {
    const [todos, setTodos] = React.useState<TodoSeed[]>(() => props.initialTodos.map((todo) => ({ ...todo })));
    const [filter, setFilter] = React.useState<TodoFilter>('all');
    const [draft, setDraft] = React.useState('');
    const nextId = React.useRef(props.initialTodos.reduce((highest, todo) => Math.max(highest, todo.id + 1), 0));

    const reset = React.useCallback((nextTodos: readonly TodoSeed[]) => {
        nextId.current = nextTodos.reduce((highest, todo) => Math.max(highest, todo.id + 1), 0);
        setTodos(nextTodos.map((todo) => ({ ...todo })));
        setFilter('all');
        setDraft('');
    }, []);
    const addMany = React.useCallback((items: readonly TodoSeed[]) => {
        if (items.length === 0) return;
        nextId.current = Math.max(nextId.current, ...items.map((todo) => todo.id + 1));
        setTodos((current) => [...current, ...items.map((todo) => ({ ...todo }))]);
    }, []);
    const deleteIds = React.useCallback((ids: ReadonlySet<number>) => {
        setTodos((current) => current.filter((todo) => !ids.has(todo.id)));
    }, []);
    const toggleIds = React.useCallback((ids: ReadonlySet<number>) => {
        setTodos((current) => current.map((todo) => (ids.has(todo.id) ? { ...todo, completed: !todo.completed } : todo)));
    }, []);
    const editIds = React.useCallback((ids: ReadonlySet<number>, suffix: string) => {
        setTodos((current) => current.map((todo) => (ids.has(todo.id) ? { ...todo, title: `Task ${todo.id}${suffix}` } : todo)));
    }, []);
    const clearCompleted = React.useCallback(() => {
        setTodos((current) => current.filter((todo) => !todo.completed));
    }, []);
    const toggleOne = React.useCallback((id: number) => toggleIds(new Set([id])), [toggleIds]);
    const editOne = React.useCallback((id: number, title: string) => {
        setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, title } : todo)));
    }, []);
    const deleteOne = React.useCallback((id: number) => deleteIds(new Set([id])), [deleteIds]);
    const addDraft = React.useCallback(() => {
        const title = draft.trim();
        if (!title) return;
        const id = nextId.current++;
        setTodos((current) => [...current, { id, title, completed: false }]);
        setDraft('');
    }, [draft]);

    React.useImperativeHandle(ref, () => ({ reset, addMany, deleteIds, toggleIds, editIds, setFilter, clearCompleted }), [
        reset,
        addMany,
        deleteIds,
        toggleIds,
        editIds,
        clearCompleted
    ]);

    const visibleTodos = React.useMemo(
        () => todos.filter((todo) => filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed)),
        [todos, filter]
    );
    const remaining = React.useMemo(() => todos.reduce((count, todo) => count + (todo.completed ? 0 : 1), 0), [todos]);
    const filterButton = (value: TodoFilter, label: string): React.ReactElement =>
        reactElement(
            'button',
            {
                className: `todo-filter${filter === value ? ' active' : ''}`,
                'data-role': `filter-${value}`,
                type: 'button',
                onClick: () => setFilter(value)
            },
            label
        );

    return reactElement(
        'section',
        { className: 'todo-app', 'data-role': 'todo-app' },
        reactElement('style', null, TODO_CSS),
        reactElement('div', { className: 'todo-header' },
            reactElement('input', {
                className: 'todo-new',
                'data-role': 'new-todo',
                value: draft,
                placeholder: 'What needs doing?',
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.currentTarget.value),
                onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => event.key === 'Enter' && addDraft()
            }),
            reactElement('button', { className: 'todo-add', 'data-role': 'add-todo', type: 'button', onClick: addDraft }, 'Add')
        ),
        reactElement(
            'ul',
            { className: 'todo-list', 'data-role': 'todo-list' },
            visibleTodos.map((todo) =>
                reactElement(ReactTodoRow, { key: todo.id, todo, onToggle: toggleOne, onEdit: editOne, onDelete: deleteOne })
            )
        ),
        reactElement('footer', { className: 'todo-footer' },
            reactElement('span', { 'data-role': 'remaining' }, `${remaining} remaining`),
            reactElement('div', { className: 'todo-filters' },
                filterButton('all', 'All'),
                filterButton('active', 'Active'),
                filterButton('completed', 'Completed')
            ),
            reactElement('button', { className: 'todo-clear', 'data-role': 'clear-completed', type: 'button', onClick: clearCompleted }, 'Clear completed')
        )
    );
});

function createReactTodoApp(initialTodos: readonly TodoSeed[]): TodoAppController {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root: Root = createRoot(host);
    let handle: ReactTodoAppHandle | null = null;
    flushSync(() =>
        root.render(
            reactElement(ReactTodoApp, {
                initialTodos,
                ref: (value: ReactTodoAppHandle | null) => {
                    handle = value;
                }
            })
        )
    );
    const commit = (action: (current: ReactTodoAppHandle) => void): void => flushSync(() => action(handle!));
    return {
        host,
        reset: (todos) => commit((current) => current.reset(todos)),
        addMany: (todos) => commit((current) => current.addMany(todos)),
        deleteIds: (ids) => commit((current) => current.deleteIds(ids)),
        toggleIds: (ids) => commit((current) => current.toggleIds(ids)),
        editIds: (ids, suffix) => commit((current) => current.editIds(ids, suffix)),
        setFilter: (filter) => commit((current) => current.setFilter(filter)),
        clearCompleted: () => commit((current) => current.clearCompleted()),
        flushUserAction: (action) => flushSync(action),
        dispose: () => {
            flushSync(() => root.unmount());
            host.remove();
        }
    };
}

interface AurumTodoRecord {
    id: number;
    title: DataSource<string>;
    completed: DataSource<boolean>;
    lifetime: CancellationToken;
    renderable?: Renderable;
}

function createAurumTodoRow(todo: AurumTodoRecord, remove: (id: number) => void): Renderable {
    const completedClass = todo.completed.transform(
        dsMap((completed) => (completed ? 'todo-item completed' : 'todo-item')),
        todo.lifetime
    );
    return (
        <li class={completedClass} data-role="todo-item" data-id={todo.id}>
            <input class="todo-toggle" data-role="toggle" type="checkbox" checked={todo.completed} />
            <input class="todo-title" data-role="title" value={todo.title} />
            <button class="todo-delete" data-role="delete" type="button" onClick={() => remove(todo.id)}>Delete</button>
        </li>
    );
}

function createAurumTodoApp(initialTodos: readonly TodoSeed[]): TodoAppController {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const visibleRows = new ArrayDataSource<Renderable>();
    const remaining = new DataSource(0);
    const filter = new DataSource<TodoFilter>('all');
    const draft = new DataSource('');
    let records: AurumTodoRecord[] = [];
    let nextId = 0;
    let bulkUpdating = false;

    const matchesFilter = (todo: AurumTodoRecord): boolean =>
        filter.value === 'all' || (filter.value === 'completed' ? todo.completed.value : !todo.completed.value);
    const refreshVisible = (): void => visibleRows.merge(records.filter(matchesFilter).map((todo) => todo.renderable!));
    const refreshSummary = (): void => {
        remaining.update(records.reduce((count, todo) => count + (todo.completed.value ? 0 : 1), 0));
        if (filter.value !== 'all') refreshVisible();
    };
    const removeOne = (id: number): void => {
        const index = records.findIndex((todo) => todo.id === id);
        if (index === -1) return;
        const [removed] = records.splice(index, 1);
        removed.lifetime.cancel();
        visibleRows.remove(removed.renderable!);
        refreshSummary();
    };
    const createRecord = (seed: TodoSeed): AurumTodoRecord => {
        const lifetime = new CancellationToken();
        const record: AurumTodoRecord = {
            id: seed.id,
            title: new DataSource(seed.title),
            completed: new DataSource(seed.completed),
            lifetime
        };
        record.completed.listen(() => {
            if (!bulkUpdating) refreshSummary();
        }, lifetime);
        record.renderable = createAurumTodoRow(record, removeOne);
        return record;
    };
    const reset = (todos: readonly TodoSeed[]): void => {
        for (const todo of records) todo.lifetime.cancel();
        records = todos.map(createRecord);
        nextId = todos.reduce((highest, todo) => Math.max(highest, todo.id + 1), 0);
        filter.update('all');
        draft.update('');
        visibleRows.merge(records.map((todo) => todo.renderable!));
        refreshSummary();
    };
    const addMany = (todos: readonly TodoSeed[]): void => {
        if (todos.length === 0) return;
        const added = todos.map(createRecord);
        records.push(...added);
        nextId = Math.max(nextId, ...todos.map((todo) => todo.id + 1));
        const visibleAdded = added.filter(matchesFilter).map((todo) => todo.renderable!);
        if (visibleAdded.length) visibleRows.appendArray(visibleAdded);
        refreshSummary();
    };
    const addDraft = (): void => {
        const title = draft.value.trim();
        if (!title) return;
        addMany([{ id: nextId++, title, completed: false }]);
        draft.update('');
    };
    const setFilter = (value: TodoFilter): void => {
        filter.update(value);
        refreshVisible();
    };
    const filterClass = (value: TodoFilter): DataSource<string> =>
        filter.transform(dsMap((current) => (current === value ? 'todo-filter active' : 'todo-filter')));

    const app = (
        <section class="todo-app" data-role="todo-app">
            <style>{TODO_CSS}</style>
            <div class="todo-header">
                <input
                    class="todo-new"
                    data-role="new-todo"
                    value={draft}
                    placeholder="What needs doing?"
                    onKeyDown={(event) => event.key === 'Enter' && addDraft()}
                />
                <button class="todo-add" data-role="add-todo" type="button" onClick={addDraft}>Add</button>
            </div>
            <ul class="todo-list" data-role="todo-list">{visibleRows}</ul>
            <footer class="todo-footer">
                <span data-role="remaining">{remaining}<span> remaining</span></span>
                <div class="todo-filters">
                    <button class={filterClass('all')} data-role="filter-all" type="button" onClick={() => setFilter('all')}>All</button>
                    <button class={filterClass('active')} data-role="filter-active" type="button" onClick={() => setFilter('active')}>Active</button>
                    <button class={filterClass('completed')} data-role="filter-completed" type="button" onClick={() => setFilter('completed')}>Completed</button>
                </div>
                <button class="todo-clear" data-role="clear-completed" type="button" onClick={() => controller.clearCompleted()}>Clear completed</button>
            </footer>
        </section>
    );
    const attachment = Aurum.attach(app, host);

    const controller: TodoAppController = {
        host,
        reset,
        addMany,
        deleteIds: (ids) => {
            const removed = records.filter((todo) => ids.has(todo.id));
            records = records.filter((todo) => !ids.has(todo.id));
            for (const todo of removed) todo.lifetime.cancel();
            visibleRows.merge(records.filter(matchesFilter).map((todo) => todo.renderable!));
            refreshSummary();
        },
        toggleIds: (ids) => Aurum.batchRender(() => {
            bulkUpdating = true;
            try {
                for (const todo of records) if (ids.has(todo.id)) todo.completed.update(!todo.completed.value);
            } finally {
                bulkUpdating = false;
            }
            refreshSummary();
        }),
        editIds: (ids, suffix) => Aurum.batchRender(() => {
            for (const todo of records) if (ids.has(todo.id)) todo.title.update(`Task ${todo.id}${suffix}`);
        }),
        setFilter,
        clearCompleted: () => {
            const completed = new Set(records.filter((todo) => todo.completed.value).map((todo) => todo.id));
            controller.deleteIds(completed);
        },
        flushUserAction: (action) => action(),
        dispose: () => {
            for (const todo of records) todo.lifetime.cancel();
            attachment.cancel();
            host.remove();
        }
    };
    reset(initialTodos);
    return controller;
}

function todoTitles(controller: TodoAppController): string[] {
    return Array.from(controller.host.querySelectorAll<HTMLInputElement>('[data-role="title"]')).map((input) => input.value);
}

function validateTodoApp(createApp: (todos: readonly TodoSeed[]) => TodoAppController): void {
    const app = createApp([
        { id: 0, title: 'first', completed: false },
        { id: 1, title: 'second', completed: true }
    ]);
    try {
        const root = app.host.querySelector<HTMLElement>('[data-role="todo-app"]')!;
        if (!root || !root.querySelector('style')?.textContent?.includes('.todo-app')) throw new Error('TODO app styles were not mounted');
        const draft = root.querySelector<HTMLInputElement>('[data-role="new-todo"]')!;
        app.flushUserAction(() => {
            const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
            valueSetter.call(draft, 'from the user');
            draft.dispatchEvent(new InputEvent('input', { bubbles: true }));
            root.querySelector<HTMLButtonElement>('[data-role="add-todo"]')!.click();
        });
        if (!todoTitles(app).includes('from the user')) throw new Error('TODO add interaction failed');

        app.flushUserAction(() => root.querySelector<HTMLButtonElement>('[data-role="filter-completed"]')!.click());
        if (root.querySelectorAll('[data-role="todo-item"]').length !== 1) throw new Error('TODO filter interaction failed');
        app.flushUserAction(() => root.querySelector<HTMLButtonElement>('[data-role="filter-all"]')!.click());

        const firstToggle = root.querySelector<HTMLInputElement>('[data-role="toggle"]')!;
        app.flushUserAction(() => firstToggle.click());
        if (!root.querySelector('[data-id="0"]')?.classList.contains('completed')) throw new Error('TODO toggle interaction failed');

        app.flushUserAction(() => root.querySelector<HTMLButtonElement>('[data-id="1"] [data-role="delete"]')!.click());
        if (root.querySelector('[data-id="1"]')) throw new Error('TODO delete interaction failed');
    } finally {
        app.dispose();
    }
}

const benchmarkOptions = { time: 300, warmupTime: 100 };
const baseTodos = createTodos(1_000);
const largeTodos = createTodos(2_000);
const appendedTodos = createTodos(1_000, 2_000);
const random250 = deterministicIds(2_000, 250, 0x51f15e);
const random250Todos = largeTodos.filter((todo) => random250.has(todo.id));
const completedTodos = largeTodos.filter((todo) => todo.completed);
const appendedIds = new Set(appendedTodos.map((todo) => todo.id));
const stressTodos = createTodos(10_000);
const stressAppendedTodos = createTodos(10_000, 10_000);
const stressAppendedIds = new Set(stressAppendedTodos.map((todo) => todo.id));
const stressRandom2500 = deterministicIds(10_000, 2_500, 0x10facade);
const stressRandom2500Todos = stressTodos.filter((todo) => stressRandom2500.has(todo.id));
const stressOptions = { time: 100, iterations: 3, warmupTime: 0, warmupIterations: 1 };
let activeSuite: symbol | undefined;
let activeController: TodoAppController | undefined;

function enterSuite(suite: symbol): void {
    if (activeSuite === suite) return;
    activeController?.dispose();
    activeController = undefined;
    activeSuite = suite;
}

beforeAll(() => {
    validateTodoApp(createReactTodoApp);
    validateTodoApp(createAurumTodoApp);
});

function registerTodoBenchmarks(label: string, createApp: (todos: readonly TodoSeed[]) => TodoAppController): void {
    describe(`${label} styled TODO app`, () => {
        const suite = Symbol(label);
        let editRevision = 0;
        const getApp = (): TodoAppController => {
            enterSuite(suite);
            return (activeController ??= createApp(largeTodos));
        };

        bench(`mount and dispose 100 TODO items`, () => {
            enterSuite(suite);
            createApp(createTodos(100)).dispose();
        }, benchmarkOptions);

        bench(`mount and dispose 1,000 TODO items`, () => {
            enterSuite(suite);
            createApp(baseTodos).dispose();
        }, benchmarkOptions);

        bench(`append and remove 1,000 TODO items`, () => {
            const app = getApp();
            app.addMany(appendedTodos);
            app.deleteIds(appendedIds);
        }, benchmarkOptions);

        bench(`delete and restore 250 deterministic random TODO items`, () => {
            const app = getApp();
            app.deleteIds(random250);
            app.addMany(random250Todos);
        }, benchmarkOptions);

        bench(`toggle 250 deterministic random TODO items twice`, () => {
            const app = getApp();
            app.toggleIds(random250);
            app.toggleIds(random250);
        }, benchmarkOptions);

        bench(`edit 250 deterministic random TODO items`, () => {
            const app = getApp();
            app.editIds(random250, ` edited ${editRevision++ & 1}`);
        }, benchmarkOptions);

        bench(`filter 2,000 TODO items to completed and back`, () => {
            const app = getApp();
            app.setFilter('completed');
            app.setFilter('all');
        }, benchmarkOptions);

        bench(`clear and restore completed TODO items from 2,000`, () => {
            const app = getApp();
            app.clearCompleted();
            app.addMany(completedTodos);
        }, benchmarkOptions);
    });
}

registerTodoBenchmarks('React 19', createReactTodoApp);
registerTodoBenchmarks('Aurum', createAurumTodoApp);

function registerTodoStressBenchmarks(label: string, createApp: (todos: readonly TodoSeed[]) => TodoAppController): void {
    describe(`${label} styled TODO app — 10× stress`, () => {
        const suite = Symbol(`${label}-stress`);
        let editRevision = 0;
        const getApp = (): TodoAppController => {
            enterSuite(suite);
            return (activeController ??= createApp(stressTodos));
        };

        bench(`append and remove 10,000 TODO items`, () => {
            const app = getApp();
            app.addMany(stressAppendedTodos);
            app.deleteIds(stressAppendedIds);
        }, stressOptions);

        bench(`delete and restore 2,500 deterministic random TODO items`, () => {
            const app = getApp();
            app.deleteIds(stressRandom2500);
            app.addMany(stressRandom2500Todos);
        }, stressOptions);

        bench(`toggle 2,500 deterministic random TODO items twice`, () => {
            const app = getApp();
            app.toggleIds(stressRandom2500);
            app.toggleIds(stressRandom2500);
        }, stressOptions);

        bench(`edit 2,500 deterministic random TODO items`, () => {
            const app = getApp();
            app.editIds(stressRandom2500, ` stress-edited ${editRevision++ & 1}`);
        }, stressOptions);

        bench(`filter 10,000 TODO items to completed and back`, () => {
            const app = getApp();
            app.setFilter('completed');
            app.setFilter('all');
        }, stressOptions);
    });
}

registerTodoStressBenchmarks('React 19', createReactTodoApp);
registerTodoStressBenchmarks('Aurum', createAurumTodoApp);

afterAll(() => {
    activeController?.dispose();
});
