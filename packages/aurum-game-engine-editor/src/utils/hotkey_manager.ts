import { CancellationToken } from 'aurumjs';

export enum Modifiers {
	NONE = 0,
	SHIFT = 1,
	CTRL = 2,
	ALT = 4
}

export function registerHotkey(keyCode: string, modifiers: Modifiers, token: CancellationToken, action: () => void) {
	token.registerDomEvent(window, 'keydown', (e: KeyboardEvent) => {
		if (e.key === keyCode) {
			if (modifiers & Modifiers.SHIFT && !e.shiftKey) {
				return;
			}
			if (modifiers & Modifiers.CTRL && !e.ctrlKey) {
				return;
			}
			if (modifiers & Modifiers.ALT && !e.altKey) {
				return;
			}

			action();
		}
	});
}
