import { CancellationToken, Renderable, Aurum } from '../src/aurumjs.js';

export function sleep(time): Promise<void> {
    return new Promise((r) => {
        setTimeout(r, time);
    });
}

export function getTestRoot(): HTMLElement {
    return document.getElementById('target');
}

export function attachToTestRoot(component: Renderable): CancellationToken {
    return Aurum.attach(component, document.getElementById('target'));
}
