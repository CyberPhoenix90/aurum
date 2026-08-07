import { afterEach, assert, describe, it } from 'vitest';
import {
    Aurum,
    AurumComponentAPI,
    CancellationToken,
    ComponentHandle,
    Renderable,
    createComponentHandle
} from '../../src/index.js';

interface InputHandle {
    focus(): void;
    getValue(): string;
}

function HandledInput(
    props: { handle: ComponentHandle<InputHandle> },
    _children: Renderable[],
    api: AurumComponentAPI
): Renderable {
    let input: HTMLInputElement | undefined;
    api.expose(props.handle, {
        focus: () => input?.focus(),
        getValue: () => input?.value ?? ''
    });
    return <input value="editor" onAttach={(node) => (input = node)} />;
}

describe('ComponentHandle', () => {
    let attachment: CancellationToken | undefined;

    afterEach(() => {
        attachment?.cancel();
        attachment = undefined;
        document.getElementById('target')!.replaceChildren();
    });

    it('exposes an awaitable DOM-ready public API and clears it with its owner', async () => {
        const handle = createComponentHandle<InputHandle>();
        assert.isUndefined(handle.value);
        const available = handle.awaitValue();
        attachment = Aurum.attach(<HandledInput handle={handle} />, document.getElementById('target')!);
        const exposed: InputHandle = await available;
        assert.equal(exposed.getValue(), 'editor');
        exposed.focus();
        assert.equal(document.activeElement, document.querySelector('input'));
        attachment.cancel();
        attachment = undefined;
        assert.isUndefined(handle.value);
    });
});
