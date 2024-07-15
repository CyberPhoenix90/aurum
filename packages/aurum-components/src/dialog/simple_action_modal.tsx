import { ArrayDataSource, Aurum, Renderable } from 'aurumjs';
import { FloatingWindow, WindowContent, WindowContentRow, WindowFooter, WindowTitle } from './floating_window.js';
import { Button, ButtonType } from '../aurum-components.js';

interface SimpleActionModalProps {
    dialogs: ArrayDataSource<Renderable>;
    icon?: string;
    title: string;
    message: Renderable;
    destructive?: boolean;
    width?: number;
    height?: number;
    onClose?: (acted: boolean) => void;
    actions: Array<{
        label: string;
        buttonType: ButtonType;
        action: () => void;
    }>;
}

export function SimpleActionModal(this: Renderable, props: SimpleActionModalProps): Renderable {
    const close = function (this: Renderable, ok: boolean) {
        props.dialogs.remove(this);
        props.onClose?.(ok);
    }.bind(this);

    return (
        <FloatingWindow
            onClose={() => close(false)}
            // do not accept on enter if the confirm modal is for destructive actions
            onEnter={() => !props.destructive && close(true)}
            onEscape={() => close(false)}
            closable
            draggable
            w={props.width ?? 400}
            h={props.height ?? 200}
        >
            <WindowTitle>
                {props.icon ? <i class={props.icon}></i> : ''}
                {props.title}
            </WindowTitle>
            <WindowContent>
                <WindowContentRow>{props.message}</WindowContentRow>
            </WindowContent>
            <WindowFooter>
                <div class="right">
                    {props.actions.map((a) => (
                        <Button
                            buttonType={a.buttonType}
                            onClick={() => {
                                close(true);
                                a.action();
                            }}
                        >
                            {a.label}
                        </Button>
                    ))}
                </div>
            </WindowFooter>
        </FloatingWindow>
    );
}
