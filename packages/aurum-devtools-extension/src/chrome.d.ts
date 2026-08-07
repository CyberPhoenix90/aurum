declare namespace chrome {
    namespace devtools {
        namespace panels {
            function create(
                title: string,
                iconPath: string,
                pagePath: string,
                callback?: (panel: ExtensionPanel) => void
            ): void;

            interface ExtensionPanel {
                onShown: ChromeEvent<(window: Window) => void>;
                onHidden: ChromeEvent<() => void>;
            }
        }

        namespace inspectedWindow {
            function eval(
                expression: string,
                callback: (result: unknown, exceptionInfo?: EvalExceptionInfo) => void
            ): void;

            interface EvalExceptionInfo {
                isException?: boolean;
                value?: string;
                description?: string;
            }
        }

        namespace network {
            const onNavigated: ChromeEvent<(url: string) => void>;
        }
    }

    interface ChromeEvent<Listener extends (...arguments_: never[]) => void> {
        addListener(callback: Listener): void;
        removeListener(callback: Listener): void;
    }
}

interface Window {
    __AURUM_DEVTOOLS_PANEL__?: {
        setVisible(visible: boolean): void;
    };
}
