import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    ClassType,
    combineClass,
    DataSource,
    dsMap,
    Renderable,
    resolveChildren,
    AurumElementModel,
    combineStyle,
    StyleType,
    css
} from 'aurumjs';
import { theme } from '../theme/theme.js';

const toasterStyle = css`
            display: flex;
            width: 100%;
            position: fixed;
            top: 100%;
            z-index: 10000;
            transition: all 0.4s ease;
        `;

const { fontFamily, heading3FontSize: size, baseFontColor: fontColor, themeColor2: color2, boxShadow, success, warning, error, highContrastFontColor } = theme;
const toastStyle = css`
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            background-color: ${color2};
            box-shadow: ${boxShadow};
            margin: auto;
            padding: 8px;
            &.success {
                background-color: ${success};
                color: ${highContrastFontColor};
            }
            &.warn {
                background-color: ${warning};
                color: ${highContrastFontColor};
            }
            &.error {
                background-color: ${error};
                color: ${highContrastFontColor};
            }
        `;

export interface ToasterProps {
    defaultToastActiveTime: number;
    style?: StyleType;
    class?: ClassType;
}

export function Toaster(props: ToasterProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const toastQueue: ArrayDataSource<Renderable> = new ArrayDataSource<Renderable>();
    const activeToast = new DataSource<Renderable>();
    const top: DataSource<number> = new DataSource<number>(100);

    const resolvedChildren = resolveChildren<Renderable>(children, api.cancellationToken);
    toastQueue.appendArray(resolvedChildren.toArray());
    resolvedChildren.onItemsAdded.subscribe((added) => {
        toastQueue.push(...added);
        nextToast();
    });
    resolvedChildren.onItemsRemoved.subscribe((removed) => {
        for (const item of removed) {
            const index = toastQueue.indexOf(item);
            if (index >= 0) {
                toastQueue.splice(index, 1);
            }
        }
    });

    activeToast.listen((v) => {
        if (!v) {
            requestAnimationFrame(() => {
                if (!api.cancellationToken.isCancelled) {
                    nextToast();
                }
            });
        }
    });

    nextToast();

    return (
        <div
            style={combineStyle(api.cancellationToken, props.style, top.transform(dsMap((s) => `top:${s}%;`)))}
            class={combineClass(api.cancellationToken, props.class, toasterStyle)}
        >
            {activeToast}
        </div>
    );

    function nextToast() {
        if (!activeToast.value && toastQueue.length.value > 0) {
            const toast = toastQueue.shift();
            if (toast) {
                activeToast.update(toast);
                top.update(85);
                api.cancellationToken.setTimeout(() => {
                    top.update(100);
                    api.cancellationToken.setTimeout(() => {
                        activeToast.update(undefined);
                    }, 400);
                }, (toast as any as AurumElementModel<ToastProps>)?.props?.activeTime ?? props.defaultToastActiveTime);
            }
        }
    }
}
export interface ToastProps {
    type: 'info' | 'success' | 'warning' | 'error';
    activeTime?: number;
}

export function Toast(props: ToastProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    let toastClass: ClassType = toastStyle;
    switch (props.type) {
        case 'info':
            toastClass = combineClass(api.cancellationToken, toastStyle, 'info');
            break;
        case 'success':
            toastClass = combineClass(api.cancellationToken, toastStyle, 'success');
            break;
        case 'warning':
            toastClass = combineClass(api.cancellationToken, toastStyle, 'warn');
            break;
        case 'error':
            toastClass = combineClass(api.cancellationToken, toastStyle, 'error');
            break;
    }

    return <div class={toastClass}>{children}</div>;
}
