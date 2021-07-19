import { css } from '@emotion/css';
import { ArrayDataSource, Aurum, AurumComponentAPI, ClassType, combineClass, DataSource, dsMap, Renderable, resolveChildren } from 'aurumjs';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

const toasterStyle = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.heading3FontSize, theme.baseFontColor, theme.themeColor2, theme.boxShadow],
        (fontFamily, size, fontColor, color2, boxShadow) => css`
            display: flex;
            flex-direction: column;
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            background-color: ${color2};
            box-shadow: ${boxShadow};
            position: fixed;
            left: 50%;
            top: 100%;
            z-index: 10000;
            transition: all 0.4s ease;
        `,
        lifecycleToken
    )
);

const toastStyle = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.success, theme.warning, theme.error, theme.highContrastFontColor],
        (success, warning, error, highContrastFontColor) => css`
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
        `,
        lifecycleToken
    )
);

export interface ToasterProps {
    toastActiveTime: number;
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
                if (!api.cancellationToken.isCanceled) {
                    nextToast();
                }
            });
        }
    });

    nextToast();

    return (
        <div style={top.transform(dsMap((s) => `top:${s}%;`))} class={toasterStyle}>
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
                }, props.toastActiveTime);
            }
        }
    }
}
export function Toast(props: { type: 'info' | 'success' | 'warning' | 'error' }, children: Renderable[], api: AurumComponentAPI): Renderable {
    let toastClass: ClassType = toastStyle;
    switch (props.type) {
        case 'info':
            toastClass = combineClass(toastStyle, 'info');
            break;
        case 'success':
            toastClass = combineClass(toastStyle, 'success');
            break;
        case 'warning':
            toastClass = combineClass(toastStyle, 'warn');
            break;
        case 'error':
            toastClass = combineClass(toastStyle, 'error');
            break;
    }

    return <div class={toastClass}>{children}</div>;
}
