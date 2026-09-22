import { ArrayDataSource, CancellationToken, DataSource, ReadOnlyDataSource } from '@aurumjs/streams';
import { afterEach, assert, describe, it, vi } from 'vitest';
import { ErrorBoundary, ErrorBoundaryProps } from '../src/builtin_components/error_boundary.js';
import { Lazy } from '../src/builtin_components/lazy.js';
import {
    AurumRouter,
    DefaultRoute,
    Outlet,
    Route,
    RouteMatch,
    createRouterHref,
    isRouteActive,
    navigate
} from '../src/builtin_components/router.js';
import { Suspense } from '../src/builtin_components/suspense.js';
import { DefaultSwitchCase, Switch, SwitchCase } from '../src/builtin_components/switch.js';
import { attachNotifier } from '../src/decorators/attach_notifier.js';
import {
    AurumComponent,
    AurumComponentAPI,
    AurumElementModel,
    ComponentLifeCycleInternal,
    RenderSession,
    Renderable,
    createAPI,
    createContext,
    createLifeCycle,
    createRenderSession
} from '../src/rendering/aurum_element.js';
import { RenderTreeNode, renderToTree } from '../src/rendering/render_tree.js';
import { Aurum, AurumDecorator } from '../src/jsx.js';
import { resolveChildren } from '../src/utilities/transclusion.js';

function model<Props>(value: unknown): AurumElementModel<Props> {
    return value as AurumElementModel<Props>;
}

function textContent(nodes: readonly RenderTreeNode[]): string {
    return nodes.map((node) => node.text ?? (node.children ? textContent(node.children) : '')).join('');
}

async function flushPromises(): Promise<void> {
    for (let index = 0; index < 6; index++) await Promise.resolve();
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('renderer component primitives', () => {
    it('creates component and fragment models and applies decorators in order', () => {
        function Subject(props: { label?: string }): Renderable {
            return props.label;
        }
        const calls: string[] = [];
        const first: AurumDecorator = (current) => {
            calls.push(current.name);
            return { ...current, name: `First(${current.name})` };
        };
        const second: AurumDecorator = (current) => {
            calls.push(current.name);
            return { ...current, name: `Second(${current.name})` };
        };
        const decorated = model(
            Aurum.factory(Subject, { label: 'value', decorate: [first, second] } as { label: string } & { decorate: AurumDecorator[] }, 'child')
        );

        assert.equal(decorated.name, 'Second(First(Subject))');
        assert.equal(decorated.factory, Subject);
        assert.equal((decorated.props as { label: string }).label, 'value');
        assert.deepEqual((decorated.props as { decorate: AurumDecorator[] }).decorate, [first, second]);
        assert.deepEqual(decorated.children, ['child']);
        assert.deepEqual(calls, ['Subject', 'First(Subject)']);
        assert.deepEqual(Aurum.factory(Aurum.fragment as unknown as AurumComponent<unknown>, null, 'a', 'b'), ['a', 'b']);

        const withoutProps = model(Aurum.factory(Subject, null));
        assert.deepEqual(withoutProps.props, {});
        assert.throws(() => Aurum.factory('section', null), /requires @aurumjs\/html/);
        assert.throws(() => Aurum.factory(Subject, { decorate: 42 } as never), /Decorate must be a function/);
    });

    it('provides context snapshots with copy-on-write isolation and validates context objects', () => {
        const Theme = createContext('default');
        const parentSession = createRenderSession();
        const parentAPI = createAPI(parentSession);
        assert.equal(parentAPI.readContext(Theme), 'default');

        parentAPI.provideContext(Theme, 'outer');
        const childSession = createRenderSession(parentSession);
        const childAPI = createAPI(childSession);
        parentAPI.provideContext(Theme, 'new outer');

        assert.equal(childAPI.readContext(Theme), 'outer');
        childAPI.provideContext(Theme, 'inner');
        assert.equal(childAPI.readContext(Theme), 'inner');
        assert.equal(parentAPI.readContext(Theme), 'new outer');
        assert.throws(() => parentAPI.provideContext({} as never, 'bad'), /created by createContext/);
        assert.throws(() => parentAPI.readContext({} as never), /created by createContext/);

        const providerSession = createRenderSession();
        const providerAPI = createAPI(providerSession);
        assert.deepEqual(Theme.Provider({ value: 'provided' }, ['child'], providerAPI), ['child']);
        assert.equal(providerAPI.readContext(Theme), 'provided');
    });

    it('synchronizes lifecycle callbacks and scopes prerendered child sessions', () => {
        const session = createRenderSession();
        const attached = vi.fn();
        const detached = vi.fn();
        const synchronized = { onAttach: attached, onDetach: detached };
        const api = createAPI(session);
        api.synchronizeLifeCycle(synchronized);

        for (const callback of session.attachCalls) callback();
        assert.equal(attached.mock.calls.length, 1);
        session.sessionToken.cancel();
        assert.equal(detached.mock.calls.length, 1);

        const parent = createRenderSession();
        let childSession: RenderSession | undefined;
        const childAttached = vi.fn();
        const childDetached = vi.fn();
        const strategy = (target: Renderable, current: RenderSession): string => {
            childSession = current;
            const childAPI = createAPI(current, strategy);
            childAPI.onAttach(childAttached);
            childAPI.onDetach(childDetached);
            return `rendered:${String(target)}`;
        };
        const parentAPI = createAPI(parent, strategy);
        const lifeCycle = createLifeCycle();
        assert.equal(parentAPI.prerender('content', lifeCycle), 'rendered:content');
        assert.equal(childAttached.mock.calls.length, 0);
        lifeCycle.onAttach();
        assert.equal(childAttached.mock.calls.length, 1);
        lifeCycle.onDetach();
        assert.equal(childDetached.mock.calls.length, 1);
        assert.isTrue(childSession!.sessionToken.isCancelled);
        lifeCycle.onAttach();
        assert.equal(childAttached.mock.calls.length, 1);
    });

    it('clears render-session resources on cancellation', () => {
        const session = createRenderSession();
        const api = createAPI(session);
        const token = api.cancellationToken;
        session.devtoolsTargets.push({});
        session.devtoolsComponentStack = [{}];
        session.devtoolsParentComponent = {};

        session.sessionToken.cancel();

        assert.isTrue(token.isCancelled);
        assert.deepEqual(session.devtoolsTargets, []);
        assert.deepEqual(session.devtoolsComponentStack, []);
        assert.isUndefined(session.devtoolsParentComponent);
    });

    it('selects reactive switch cases, falls back, validates children, and detaches cleanly', () => {
        const state = new DataSource('on');
        const onCase = model(Aurum.factory(SwitchCase<string>, { when: 'on' }, 'enabled'));
        const defaultCase = model(Aurum.factory(DefaultSwitchCase, {}, 'disabled'));
        const session = createRenderSession();
        const selected = Switch({ state }, [false, [onCase], defaultCase], createAPI(session)) as ReadOnlyDataSource<Renderable>;

        assert.deepEqual(selected.value, ['enabled']);
        state.update('off');
        assert.deepEqual(selected.value, ['disabled']);
        session.sessionToken.cancel();
        state.update('on');
        assert.deepEqual(selected.value, ['disabled']);

        const invalid = model(Aurum.factory(() => 'invalid', {}));
        assert.throws(() => Switch({ state }, [invalid], createAPI(createRenderSession())), /only accepts SwitchCase/);
        assert.throws(
            () => Switch({ state }, [defaultCase, model(Aurum.factory(DefaultSwitchCase, {}, 'other'))], createAPI(createRenderSession())),
            /Too many default switch cases/
        );
        assert.isUndefined(SwitchCase({ when: true }, ['unused']));
        assert.isUndefined(DefaultSwitchCase({}, ['unused']));
    });

    it('combines static, nested, reactive-array, and data-source children', () => {
        const lifetime = new CancellationToken();
        const dynamic = new ArrayDataSource<Renderable>([3]);
        const scalar = new DataSource<Renderable>('scalar');
        const validated: Renderable[] = [];
        const resolved = resolveChildren<Renderable>([1, [2], 'between', dynamic, scalar], lifetime, (child) => validated.push(child));

        assert.deepEqual(resolved.getData(), [1, 2, 'between', 3, scalar]);
        dynamic.push(4);
        assert.deepEqual(resolved.getData(), [1, 2, 'between', 3, 4, scalar]);
        assert.deepEqual(validated, [4]);

        lifetime.cancel();
        dynamic.push(5);
        assert.deepEqual(resolved.getData(), [1, 2, 'between', 3, 4, scalar]);
    });

    it('fires attach-notifier decorators for the wrapped component lifetime', () => {
        const onAttach = vi.fn();
        const onDetach = vi.fn();
        const decorated = Aurum.factory(
            () => 'subject',
            { decorate: attachNotifier(onAttach, onDetach) } as { decorate: AurumDecorator }
        ) as Renderable;

        const tree = renderToTree(decorated);
        assert.equal(textContent(tree.roots), 'subject');
        assert.equal(onAttach.mock.calls.length, 1);
        tree.dispose();
        assert.equal(onDetach.mock.calls.length, 1);
    });
});

describe('async component boundaries', () => {
    it('shows suspense content, resolves nested promises, and renders rejection details', async () => {
        let resolve!: (value: Renderable) => void;
        const pending = new Promise<Renderable>((done) => (resolve = done));
        const boundary = model(
            Aurum.factory(ErrorBoundary, { suspenseFallback: 'loading', errorFallback: (error: unknown) => `failed:${(error as Error).message}` }, pending)
        );
        const tree = renderToTree(boundary);
        assert.equal(textContent(tree.roots), 'loading');

        resolve(Promise.resolve(['ready', '!']));
        await flushPromises();
        assert.equal(textContent(tree.roots), 'ready!');

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const error = new Error('loader');
        const rejectedTree = renderToTree(
            model(Aurum.factory(ErrorBoundary, { suspenseFallback: 'waiting', errorFallback: (reason: unknown) => `recovered:${(reason as Error).message}` }, Promise.reject(error)))
        );
        await flushPromises();
        assert.equal(textContent(rejectedTree.roots), 'recovered:loader');
        assert.equal(consoleError.mock.calls[0][0], error);
    });

    it('ignores async completion after the boundary session is cancelled', async () => {
        let resolve!: (value: Renderable) => void;
        const pending = new Promise<Renderable>((done) => (resolve = done));
        const session = createRenderSession();
        const output = ErrorBoundary({ suspenseFallback: 'waiting' }, [pending], createAPI(session)) as DataSource<Renderable>;
        session.sessionToken.cancel();
        resolve('late');
        await flushPromises();
        assert.equal(output.value, 'waiting');
    });

    it('builds Lazy and Suspense boundaries for direct and default module exports', async () => {
        const Loaded: AurumComponent<{ label: string }> = (props) => props.label;
        const direct = model(Lazy({ loader: async () => Loaded, lazyComponentProps: { label: 'direct' }, fallback: 'loading' }));
        const module = model(Lazy({ loader: async () => ({ default: Loaded }), lazyComponentProps: { label: 'module' }, errorFallback: 'failed' }));

        assert.equal(direct.factory, ErrorBoundary);
        assert.equal((direct.props as ErrorBoundaryProps).suspenseFallback, 'loading');
        const directLoaded = model<{ label: string }>(await (direct.children[0] as Promise<unknown>));
        const moduleLoaded = model<{ label: string }>(await (module.children[0] as Promise<unknown>));
        assert.equal(directLoaded.factory, Loaded);
        assert.equal(directLoaded.props.label, 'direct');
        assert.equal(moduleLoaded.factory, Loaded);
        assert.equal(moduleLoaded.props.label, 'module');

        const suspense = model(Suspense({ fallback: 'pending' }, ['content'], createAPI(createRenderSession())));
        assert.equal(suspense.factory, ErrorBoundary);
        assert.equal((suspense.props as ErrorBoundaryProps).suspenseFallback, 'pending');
        assert.throws(() => ((suspense.props as ErrorBoundaryProps).errorFallback as (error: unknown) => Renderable)(new Error('boom')), /boom/);
    });
});

describe('router primitives', () => {
    it('matches nested routes, decodes parameters, composes outlets, and notifies navigation', () => {
        const url = new DataSource('/app/users/Ada%20Lovelace?tab=profile');
        const routeData = new DataSource<RouteMatch | undefined>(undefined);
        const calls: string[] = [];
        const child = model(
            Aurum.factory(
                Route,
                {
                    href: ':id',
                    render: (match) => `profile:${match.params.id}`,
                    onNavigateTo: () => calls.push('child to'),
                    onNavigateFrom: () => calls.push('child from')
                },
                'unused'
            )
        );
        const parent = model(
            Aurum.factory(
                Route,
                { href: '/users', onNavigateTo: () => calls.push('parent to'), onNavigateFrom: () => calls.push('parent from') },
                'users:',
                model(Aurum.factory(Outlet, null)),
                child
            )
        );
        const fallback = model(Aurum.factory(DefaultRoute, { render: () => 'not found', onNavigateTo: () => calls.push('fallback to') }));
        const changes: Array<RouteMatch | undefined> = [];
        const rendered = AurumRouter(
            {
                urlProvider: url,
                urlPreprocessing: (value) => value.replace('/app', ''),
                routeData,
                onRouteChange: (match) => changes.push(match)
            },
            [parent, fallback],
            createAPI(createRenderSession())
        );

        assert.deepEqual(rendered.value, ['users:', 'profile:Ada Lovelace']);
        assert.equal(routeData.value?.pathname, '/users/Ada%20Lovelace');
        assert.deepEqual(routeData.value?.params, { id: 'Ada Lovelace' });
        assert.deepEqual(calls, ['parent to', 'child to']);

        url.update('/app/missing');
        assert.equal(rendered.value, 'not found');
        assert.deepEqual(calls, ['parent to', 'child to', 'child from', 'parent from', 'fallback to']);
        assert.equal(changes.length, 2);
        assert.equal(changes[1]?.pathname, '/missing');
    });

    it('recomputes when route collections change and preserves output when validation vetoes navigation', () => {
        const url = new DataSource('/wanted');
        const routes = new ArrayDataSource<Renderable>([model(Aurum.factory(DefaultRoute, {}, 'fallback'))]);
        const accepted: string[] = [];
        const session = createRenderSession();
        const output = AurumRouter(
            {
                urlProvider: url,
                validateNavigation: (value) => {
                    accepted.push(value);
                    return value !== '/blocked';
                }
            },
            [routes],
            createAPI(session)
        );
        assert.deepEqual(output.value, ['fallback']);

        routes.unshift(model(Aurum.factory(Route, { href: '/wanted' }, 'wanted')));
        assert.deepEqual(output.value, ['wanted']);
        url.update('/blocked');
        assert.deepEqual(output.value, ['wanted']);
        assert.deepEqual(accepted, ['/wanted', '/wanted', '/blocked']);

        const invalid = model(Aurum.factory(() => 'not a route', {}));
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        assert.throws(() => routes.push(invalid), /only accepts Route and DefaultRoute/);
        session.sessionToken.cancel();
    });

    it('ranks static, optional, wildcard, and malformed encoded parameters', () => {
        const url = new DataSource('/docs/new');
        const routes = [
            model(Aurum.factory(Route, { href: '/docs/:section?', render: (match) => `optional:${match.params.section ?? 'none'}` })),
            model(Aurum.factory(Route, { href: '/docs/new' }, 'static')),
            model(Aurum.factory(Route, { href: '/files/*path', render: (match) => `files:${match.params.path}` })),
            model(Aurum.factory(Route, { href: '/bad/:value', render: (match) => `bad:${match.params.value}` }))
        ];
        const output = AurumRouter({ urlProvider: url }, routes, createAPI(createRenderSession()));

        assert.deepEqual(output.value, ['static']);
        url.update('/docs/');
        assert.equal(output.value, 'optional:none');
        url.update('/files/a%20folder/readme');
        assert.equal(output.value, 'files:a folder/readme');
        url.update('/bad/%E0%A4%A');
        assert.equal(output.value, 'bad:%E0%A4%A');
    });

    it('appends nested content without an outlet and replaces outlets inside component models', () => {
        function Shell(_props: object, children: Renderable[]): Renderable {
            return children;
        }
        const url = new DataSource('/settings/profile');
        const child = model(Aurum.factory(Route, { href: 'profile' }, 'profile'));
        const withoutOutlet = model(Aurum.factory(Route, { href: '/settings' }, 'settings', child));
        const appended = AurumRouter({ urlProvider: url }, [withoutOutlet], createAPI(createRenderSession()));
        assert.deepEqual(appended.value, [['settings'], ['profile']]);

        const shell = model(Aurum.factory(Shell, {}, 'shell:', model(Aurum.factory(Outlet, null))));
        const withWrappedOutlet = model(Aurum.factory(Route, { href: '/settings' }, shell, child));
        const replaced = AurumRouter({ urlProvider: url }, [withWrappedOutlet], createAPI(createRenderSession()));
        const renderedShell = (replaced.value as AurumElementModel<object>[])[0];
        assert.notEqual(renderedShell, shell);
        assert.deepEqual(renderedShell.children, ['shell:', ['profile']]);
    });

    it('normalizes route hrefs, active-route checks, and browser navigation modes', () => {
        assert.equal(createRouterHref('/users'), '/users');
        assert.equal(createRouterHref('users', true), '#/users');
        assert.isTrue(isRouteActive('/users/42?tab=one', '/users'));
        assert.isFalse(isRouteActive('/users/42', '/users', true));
        assert.isFalse(isRouteActive('/other', '/'));
        assert.isTrue(isRouteActive('/', '/', true));

        const pushState = vi.fn();
        const replaceState = vi.fn();
        const dispatchEvent = vi.fn();
        vi.stubGlobal('window', { history: { pushState, replaceState }, dispatchEvent });
        vi.stubGlobal(
            'HashChangeEvent',
            class {
                public constructor(public readonly type: string) {}
            }
        );

        const state = { from: 'test' };
        navigate('/next', { state });
        navigate('hash-next', { replace: true, hashRouting: true });
        assert.deepEqual(pushState.mock.calls[0], [state, '', '/next']);
        assert.deepEqual(replaceState.mock.calls[0], [undefined, '', '#/hash-next']);
        assert.equal(dispatchEvent.mock.calls[0][0].type, 'hashchange');

        vi.stubGlobal('window', undefined);
        assert.doesNotThrow(() => navigate('/server'));
        assert.isUndefined(Route({ href: '/' }, []));
        assert.isUndefined(DefaultRoute({}, []));
        assert.isUndefined(Outlet());
    });
});
