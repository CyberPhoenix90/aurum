import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    ComponentHandle,
    createComponentHandle,
    createLifeCycle,
    DataSource,
    Renderable
} from '../src/index.js';

function Component(): Renderable {
    return ['text', [Promise.resolve(1), new DataSource<Renderable>(['nested'])], new ArrayDataSource<Renderable>([true])];
}

function PrerenderingComponent(_props: object, children: Renderable[], api: AurumComponentAPI): Renderable {
    const rendered: Renderable[] = api.prerender(children, createLifeCycle());
    return rendered;
}

const component = <Component></Component>;
const prerendered = <PrerenderingComponent>{component}</PrerenderingComponent>;
// @ts-expect-error Renderer-only JSX must not imply that HTML is installed.
const invalidIntrinsic = <div></div>;

interface EditorHandle {
    focus(): void;
    getSelection(): string;
}

function HandledComponent(
    props: { handle: ComponentHandle<EditorHandle> },
    _children: Renderable[],
    api: AurumComponentAPI
): undefined {
    api.expose(props.handle, {
        focus: () => undefined,
        getSelection: () => 'selection'
    });
    // @ts-expect-error The complete EditorHandle contract must be exposed.
    api.expose(props.handle, { focus: () => undefined });
    return undefined;
}

const editorHandle = createComponentHandle<EditorHandle>();
const handled = <HandledComponent handle={editorHandle} />;
void component;
void prerendered;
void invalidIntrinsic;
void handled;
