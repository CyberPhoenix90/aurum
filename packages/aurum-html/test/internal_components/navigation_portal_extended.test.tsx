import { afterEach, assert, describe, it } from 'vitest';
import { Aurum, CancellationToken, DuplexDataSource, Portal, RouterLink, RouterNavLink } from '../../src/index.js';

describe('navigation and portal edge behavior', () => {
    let attachment: CancellationToken | undefined;
    let portalTarget: HTMLElement | undefined;

    afterEach(() => {
        attachment?.cancel();
        attachment = undefined;
        portalTarget?.remove();
        portalTarget = undefined;
        document.getElementById('target')!.replaceChildren();
        window.history.replaceState(undefined, '', '/');
    });

    it('runs router-link click handlers and respects prevented navigation', () => {
        let clicks = 0;
        window.history.replaceState(undefined, '', '/before');
        attachment = Aurum.attach(
            <RouterLink
                to="/blocked"
                onClick={(event) => {
                    clicks++;
                    event.preventDefault();
                }}
            >
                blocked
            </RouterLink>,
            document.getElementById('target')!
        );

        document.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
        assert.equal(clicks, 1);
        assert.equal(window.location.pathname, '/before');
    });

    it('leaves modified router-link clicks to the browser', () => {
        window.history.replaceState(undefined, '', '/before');
        attachment = Aurum.attach(<RouterLink to="/ignored">ignored</RouterLink>, document.getElementById('target')!);

        const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
        document.querySelector('a')!.dispatchEvent(event);
        assert.isFalse(event.defaultPrevented);
        assert.equal(window.location.pathname, '/before');
    });

    it('derives active navigation state from native path and hash sources', () => {
        window.history.replaceState(undefined, '', '/native/path');
        const active = new DuplexDataSource(false, false);
        const activeWrites: boolean[] = [];
        active.listenUpstream((value) => activeWrites.push(value));
        attachment = Aurum.attach(
            <nav>
                <RouterNavLink to="/native" active={active} class="base">native</RouterNavLink>
                <RouterNavLink to="/hash" hashRouting={true}>hash</RouterNavLink>
            </nav>,
            document.getElementById('target')!
        );

        const links = document.querySelectorAll('a');
        assert.include(links[0].className, 'base');
        assert.include(links[0].className, 'active');
        assert.deepEqual(activeWrites, [true]);
        assert.equal(links[1].getAttribute('href'), '#/hash');

        attachment.cancel();
        attachment = undefined;
        window.history.replaceState(undefined, '', '/native/path#/hash/path?query=1');
        attachment = Aurum.attach(
            <RouterNavLink to="/hash" hashRouting={true}>hash</RouterNavLink>,
            document.getElementById('target')!
        );
        assert.include(document.querySelector('a')!.className, 'active');
        assert.equal(document.querySelector('a')!.getAttribute('aria-current'), 'page');
    });

    it('supports default and factory portal targets while ignoring missing targets', () => {
        portalTarget = document.body.appendChild(document.createElement('aside'));
        attachment = Aurum.attach(
            <>
                <Portal><span id="default-portal">body</span></Portal>
                <Portal target={() => portalTarget}><span id="factory-portal">aside</span></Portal>
                <Portal target="#missing-portal-target"><span id="missing-portal">missing</span></Portal>
            </>,
            document.getElementById('target')!
        );

        assert.equal(document.getElementById('default-portal')!.parentElement, document.body);
        assert.equal(document.getElementById('factory-portal')!.parentElement, portalTarget);
        assert.isNull(document.getElementById('missing-portal'));

        attachment.cancel();
        attachment = undefined;
        assert.isNull(document.getElementById('default-portal'));
        assert.equal(portalTarget.childNodes.length, 0);
    });
});
