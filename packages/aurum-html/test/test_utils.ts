import { CancellationToken, Renderable, Aurum } from '../src/index.js';

export function sleep(time: number): Promise<void> {
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

if (!document.getElementById('target')) {
    document.body.appendChild(document.createElement('div')).id = 'target';
}
