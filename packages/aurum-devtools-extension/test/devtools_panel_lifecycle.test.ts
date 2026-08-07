import { describe, expect, it } from 'vitest';
import { bindPanelVisibility, type DevtoolsPanelLike } from '../src/devtools_panel_lifecycle.js';

describe('DevTools panel visibility lifecycle', () => {
    it('suspends the shown panel on hide and resumes it on show', () => {
        let shownListener: ((window: Window) => void) | undefined;
        let hiddenListener: (() => void) | undefined;
        const panel: DevtoolsPanelLike = {
            onShown: { addListener: (listener) => (shownListener = listener) },
            onHidden: { addListener: (listener) => (hiddenListener = listener) }
        };
        const visibility: boolean[] = [];
        const panelWindow = {
            __AURUM_DEVTOOLS_PANEL__: { setVisible: (visible: boolean) => visibility.push(visible) }
        } as unknown as Window;

        bindPanelVisibility(panel);
        hiddenListener?.();
        expect(visibility).toEqual([]);
        shownListener?.(panelWindow);
        hiddenListener?.();
        shownListener?.(panelWindow);
        expect(visibility).toEqual([true, false, true]);
    });
});
