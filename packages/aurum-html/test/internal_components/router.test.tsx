import { afterEach, assert, describe, it } from 'vitest';
import {
    Aurum,
    AurumRouter,
    CancellationToken,
    DataSource,
    DefaultRoute,
    Outlet,
    Route,
    RouteMatch,
    RouterLink,
    RouterNavLink,
    createRouterHref,
    isRouteActive
} from '../../src/index.js';

describe('Router', () => {
    let attachToken: CancellationToken | undefined;

    afterEach(() => {
        attachToken?.cancel();
        attachToken = undefined;
        document.getElementById('target')!.replaceChildren();
        window.history.replaceState(undefined, '', '/');
    });

    it('renders exact routes and remains empty for an unmatched URL', () => {
        const url = new DataSource('/');
        attachToken = Aurum.attach(
            <AurumRouter urlProvider={url}><Route href="/"><span>home</span></Route></AurumRouter>,
            document.getElementById('target')!
        );
        assert.equal(document.getElementById('target')!.textContent, 'home');
        url.update('/missing');
        assert.equal(document.getElementById('target')!.textContent, '');
    });

    it('matches decoded required, optional, and wildcard parameters', () => {
        const url = new DataSource('/blog/hello%20world?draft=1');
        const routeData = new DataSource<RouteMatch | undefined>();
        attachToken = Aurum.attach(
            <AurumRouter urlProvider={url} routeData={routeData}>
                <Route href="/blog/:slug" render={(match) => <span>{match.params.slug}</span>} />
                <Route href="/archive/:year?" render={(match) => <span>{match.params.year ?? 'all'}</span>} />
                <Route href="/files/*path" render={(match) => <span>{match.params.path}</span>} />
            </AurumRouter>,
            document.getElementById('target')!
        );
        assert.equal(document.getElementById('target')!.textContent, 'hello world');
        assert.equal(routeData.value?.pathname, '/blog/hello%20world');
        url.update('/archive');
        assert.equal(document.getElementById('target')!.textContent, 'all');
        url.update('/files/maps/first.json');
        assert.equal(document.getElementById('target')!.textContent, 'maps/first.json');
    });

    it('composes nested layouts through Outlet', () => {
        const url = new DataSource('/blog/first');
        attachToken = Aurum.attach(
            <AurumRouter urlProvider={url}>
                <Route href="/">
                    <main><header>layout:</header><Outlet /></main>
                    <Route href="blog/:slug" render={(match) => <article>{match.params.slug}</article>} />
                </Route>
            </AurumRouter>,
            document.getElementById('target')!
        );
        assert.equal(document.querySelector('main')!.textContent, 'layout:first');
        assert.equal(document.querySelector('article')!.textContent, 'first');
    });

    it('uses the default route and reports route transitions', () => {
        const url = new DataSource('/first');
        const events: string[] = [];
        const matches: Array<string | undefined> = [];
        attachToken = Aurum.attach(
            <AurumRouter urlProvider={url} onRouteChange={(match) => matches.push(match?.pathname)}>
                <Route href="/first" onNavigateTo={() => events.push('enter-first')} onNavigateFrom={() => events.push('leave-first')}>first</Route>
                <Route href="/second" onNavigateTo={() => events.push('enter-second')}>second</Route>
                <DefaultRoute>fallback</DefaultRoute>
            </AurumRouter>,
            document.getElementById('target')!
        );
        url.update('/second');
        url.update('/missing');
        assert.equal(document.getElementById('target')!.textContent, 'fallback');
        assert.deepEqual(events, ['enter-first', 'leave-first', 'enter-second']);
        assert.deepEqual(matches, ['/first', '/second', '/missing']);
    });

    it('can reject navigation while retaining the previous route', () => {
        const url = new DataSource('/allowed');
        attachToken = Aurum.attach(
            <AurumRouter urlProvider={url} validateNavigation={(next) => next !== '/blocked'}>
                <Route href="/allowed">allowed</Route><Route href="/blocked">blocked</Route>
            </AurumRouter>,
            document.getElementById('target')!
        );
        url.update('/blocked');
        assert.equal(document.getElementById('target')!.textContent, 'allowed');
    });

    it('provides active links and hash href helpers', () => {
        const url = new DataSource('/docs/start');
        attachToken = Aurum.attach(
            <nav>
                <RouterNavLink to="/docs" urlProvider={url} activeClass="selected">Docs</RouterNavLink>
                <RouterNavLink to="/" exact={true} urlProvider={url}>Home</RouterNavLink>
            </nav>,
            document.getElementById('target')!
        );
        const links = document.querySelectorAll('a');
        assert.include(links[0].className, 'selected');
        assert.equal(links[0].getAttribute('aria-current'), 'page');
        assert.notInclude(links[1].className, 'active');
        url.update('/');
        assert.notInclude(links[0].className, 'selected');
        assert.include(links[1].className, 'active');
        assert.equal(createRouterHref('/docs', true), '#/docs');
        assert.isTrue(isRouteActive('/docs/start', '/docs'));
        assert.isFalse(isRouteActive('/docs/start', '/docs', true));
    });

    it('uses history navigation for unmodified router-link clicks', () => {
        attachToken = Aurum.attach(<RouterLink to="/router-target">target</RouterLink>, document.getElementById('target')!);
        document
            .querySelector('a')!
            .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
        assert.equal(window.location.pathname, '/router-target');
    });
});
