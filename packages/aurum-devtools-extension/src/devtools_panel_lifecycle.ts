interface ListenerEvent<Listener> {
    addListener(listener: Listener): void;
}

export interface DevtoolsPanelLike {
    onShown: ListenerEvent<(window: Window) => void>;
    onHidden: ListenerEvent<() => void>;
}

export function bindPanelVisibility(panel: DevtoolsPanelLike): void {
    let panelWindow: Window | undefined;
    panel.onShown.addListener((shownWindow) => {
        panelWindow = shownWindow;
        panelWindow.__AURUM_DEVTOOLS_PANEL__?.setVisible(true);
    });
    panel.onHidden.addListener(() => {
        panelWindow?.__AURUM_DEVTOOLS_PANEL__?.setVisible(false);
    });
}
