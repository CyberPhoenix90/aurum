import { Aurum, AurumComponentAPI, ClassType, combineStyle, Renderable, StyleType } from 'aurumjs';

export interface DialogProps {
    class?: ClassType;
    style?: StyleType;
    blockNativeContextMenu?: boolean;
    onClickOutside?(e: MouseEvent): void;
    onClickInside?(e: MouseEvent): void;
    onEscape?(e: KeyboardEvent): void;
    target: HTMLElement | { x: number; y: number };
    layout?: {
        direction?: 'down' | 'right' | 'left' | 'up';
        targetPoint?: 'start' | 'center' | 'end';
        orientationX?: 'left' | 'right' | 'center';
        orientationY?: 'top' | 'center' | 'bottom';
        offset?: { x: number; y: number };
    };
}

export function Dialog(props: DialogProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    let posX: number;
    let posY: number;

    let root: HTMLDivElement;

    api.cancellationToken.registerDomEvent(window, 'keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            props.onEscape?.(e);
        }
    });

    setTimeout(() => {
        if (!api.cancellationToken.isCancelled) {
            api.cancellationToken.registerDomEvent(window, 'click', (e: MouseEvent) => {
                let ptr = e.target;
                while (ptr) {
                    if (ptr === root) {
                        props.onClickInside?.(e);
                        return;
                    } else {
                        ptr = (ptr as HTMLElement).parentElement;
                    }
                }

                props.onClickOutside?.(e);
            });
        }
    });

    if (props.target instanceof HTMLElement || props.target instanceof SVGElement) {
        const bb = props.target.getBoundingClientRect();
        applyLayout(bb);
    } else {
        posX = props.target.x;
        posY = props.target.y;
    }

    if (props.layout?.offset) {
        posX += props.layout.offset.x;
        posY += props.layout.offset.y;
    }

    return (
        <div
            class={props.class}
            onAttach={(node) => (root = node)}
            onContextMenu={(e) => {
                if (props.blockNativeContextMenu) {
                    e.preventDefault();
                }
            }}
            style={combineStyle(api.cancellationToken, props.style, `position:absolute; left:${posX}px; top:${posY}px;`)}
        >
            {children}
        </div>
    );

    function applyLayout(bb: DOMRect) {
        switch (props?.layout?.direction ?? 'down') {
            case 'down':
                posY = bb.bottom;
                if (props.layout) {
                    posX = bb.left + bb.width * pointToOrigin(props.layout.targetPoint ?? 'center');
                } else {
                    posX = bb.left + bb.width / 2;
                }
                break;
            case 'left':
                posX = bb.left;
                if (props.layout) {
                    posY = bb.top + bb.height * pointToOrigin(props.layout.targetPoint ?? 'center');
                } else {
                    posY = bb.top + bb.height / 2;
                }
                break;
            case 'up':
                posY = bb.top;
                if (props.layout) {
                    posX = bb.left + bb.width * pointToOrigin(props.layout.targetPoint ?? 'center');
                } else {
                    posX = bb.left + bb.width / 2;
                }
                break;
            case 'right':
                posX = bb.right;
                if (props.layout) {
                    posY = bb.top + bb.height * pointToOrigin(props.layout.targetPoint ?? 'center');
                } else {
                    posY = bb.top + bb.height / 2;
                }
                break;
        }
    }
}

function pointToOrigin(point: 'start' | 'center' | 'end' | 'left' | 'right' | 'top' | 'bottom'): number {
    switch (point) {
        case 'center':
            return 0.5;
        case 'start':
        case 'top':
        case 'left':
            return 0;
        case 'right':
        case 'bottom':
        case 'end':
            return 1;
    }
}
