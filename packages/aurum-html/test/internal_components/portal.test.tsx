import { afterEach, assert, describe, it } from 'vitest';
import { Aurum, CancellationToken, DataSource, Portal } from '../../src/index.js';

describe('Portal', () => {
    let attachment: CancellationToken | undefined;
    let firstTarget: HTMLElement;
    let secondTarget: HTMLElement;

    afterEach(() => {
        attachment?.cancel();
        attachment = undefined;
        firstTarget?.remove();
        secondTarget?.remove();
        document.getElementById('target')!.replaceChildren();
    });

    it('renders reactive content into another container and disposes it with its owner', () => {
        firstTarget = document.body.appendChild(document.createElement('aside'));
        const content = new DataSource('first');
        attachment = Aurum.attach(
            <div id="owner"><Portal target={firstTarget}><span>{content}</span></Portal></div>,
            document.getElementById('target')!
        );
        assert.equal(document.querySelector('#owner')!.childElementCount, 0);
        assert.equal(firstTarget.textContent, 'first');
        content.update('second');
        assert.equal(firstTarget.textContent, 'second');
        attachment.cancel();
        attachment = undefined;
        assert.equal(firstTarget.childNodes.length, 0);
    });

    it('moves content between reactive targets and unmounts it for a null target', () => {
        firstTarget = document.body.appendChild(document.createElement('aside'));
        secondTarget = document.body.appendChild(document.createElement('aside'));
        const target = new DataSource<HTMLElement | null>(firstTarget);
        attachment = Aurum.attach(
            <Portal target={target}><button>Action</button></Portal>,
            document.getElementById('target')!
        );
        assert.equal(firstTarget.textContent, 'Action');
        target.update(secondTarget);
        assert.equal(firstTarget.textContent, '');
        assert.equal(secondTarget.textContent, 'Action');
        target.update(null);
        assert.equal(secondTarget.textContent, '');
    });

    it('supports selector targets', () => {
        firstTarget = document.body.appendChild(document.createElement('aside'));
        firstTarget.id = 'portal-target';
        attachment = Aurum.attach(
            <Portal target="#portal-target">selected</Portal>,
            document.getElementById('target')!
        );
        assert.equal(firstTarget.textContent, 'selected');
    });
});
