import {
    Aurum,
    combineClass,
    AurumComponentAPI,
    DataSource,
    dsMap,
    DuplexDataSource,
    Renderable,
    StyleType,
    ClassType,
    resolveChildren,
    AurumElementModel
} from 'aurumjs';
import { css } from '@emotion/css';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.themeColor1, theme.themeColor2, theme.themeColor3],
        (fontFamily, size, fontColor, color1, color2, color3) => css`
            height: 24px;
            width: 100%;
            display: flex;
            background: ${color1};
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};

            .close {
                margin-top: 7px;
                margin-left: 7px;
                margin-bottom: 7px;
            }

            .tab {
                background: ${color3};
                cursor: pointer;
                padding: 2px 8px;
                margin-right: 1px;
                user-select: none;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
            }

            .selected {
                font-weight: bold;
                background: ${color2};
            }
        `,
        lifecycleToken
    )
);

interface TabBarProps<T> {
    keyboardNavigation?: boolean;
    canReorder?: boolean;
    canClose?: boolean;
    onClose?(tab: T, index: number): void;
    onReorder?(tabA: T, tabB: T): void;
    class?: ClassType;
    style?: StyleType;
    selected: DataSource<T> | DuplexDataSource<T>;
}

export function TabBar<T>(props: TabBarProps<T>, children: Renderable[], api: AurumComponentAPI): any {
    const { selected, canClose, canReorder, onClose, onReorder } = props;

    const resolvedChildren = resolveChildren<AurumElementModel<TabBarItemProps<T>>>(
        children,
        api.cancellationToken,
        (c) => (c as AurumElementModel<any>)?.factory === TabBarItem
    );

    const modelToTabItem = resolvedChildren.indexByProvider((c) => c.props.id);

    resolvedChildren.length.listen((v) => {
        if (resolvedChildren.find((v) => v.props.id === selected.value) === undefined) {
            if (v > 0) {
                updateSelected(resolvedChildren.get(0).props.id);
            } else {
                updateSelected(undefined);
            }
        } else if (v > 0 && selected.value === undefined) {
            if (selected instanceof DataSource) {
                updateSelected(resolvedChildren.get(0).props.id);
            }
        }
    }, api.cancellationToken);

    let heldItem: T = undefined;

    if (canClose) {
        if (props.keyboardNavigation) {
            api.cancellationToken.registerDomEvent(document, 'keydown', (e: KeyboardEvent) => {
                if (e.key === 'w' && e.altKey) {
                    const selectedTab = modelToTabItem.get(props.selected.value);
                    if (!selectedTab) {
                        return;
                    }

                    const canClose = selectedTab.props.canClose ?? true;

                    selectedTab.props.onClose?.(selectedTab.props.id);
                    canClose &&
                        onClose?.(
                            selected.value,
                            resolvedChildren.findIndex((v) => v.props.id === selected.value)
                        );
                } else if (e.key === ']' && e.ctrlKey) {
                    e.preventDefault();
                    const currentIndex = resolvedChildren.findIndex((v) => v.props.id === selected.value);
                    const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
                    if (nextIndex < 0) {
                        updateSelected(resolvedChildren.get(resolvedChildren.length.value - 1).props.id);
                    } else if (nextIndex >= resolvedChildren.length.value) {
                        updateSelected(resolvedChildren.get(0).props.id);
                    } else {
                        updateSelected(resolvedChildren.get(nextIndex).props.id);
                    }
                } else if (e.key === '[' && e.ctrlKey) {
                    e.preventDefault();
                    const currentIndex = resolvedChildren.findIndex((v) => v.props.id === selected.value);
                    const nextIndex = e.shiftKey ? currentIndex + 1 : currentIndex - 1;
                    if (nextIndex < 0) {
                        updateSelected(resolvedChildren.get(resolvedChildren.length.value - 1).props.id);
                    } else if (nextIndex >= resolvedChildren.length.value) {
                        updateSelected(resolvedChildren.get(0).props.id);
                    } else {
                        updateSelected(resolvedChildren.get(nextIndex).props.id);
                    }
                }
            });
        }
    }

    return (
        <div class={combineClass(api.cancellationToken, style, props.class)} style={props.style}>
            {resolvedChildren.map(renderTab)}
        </div>
    );

    function updateSelected(id: T) {
        if (selected instanceof DataSource) {
            selected.update(id);
        } else {
            selected.updateUpstream(id);
        }
    }

    function renderTab(tab: AurumElementModel<TabBarItemProps<T>>): Renderable {
        const tabId = tab.props.id;

        return (
            <div
                title={tab.props.title}
                onDragStart={() => (heldItem = tabId)}
                onDragEnter={() => onReorder?.(tabId, heldItem)}
                draggable={canReorder ? 'true' : false}
                onMouseUp={(e: MouseEvent) => {
                    if (e.button === 1 && canClose) {
                        onClose?.(
                            tabId,
                            resolvedChildren.findIndex((e) => e.props.id === tabId)
                        );
                    } else if (e.button === 0) {
                        if (selected instanceof DataSource) {
                            selected.update(tabId);
                        } else {
                            selected.updateUpstream(tabId);
                        }
                    }
                }}
                class={{
                    tab: true,
                    selected: selected.transform(dsMap((v) => v === tab.props.id))
                }}
            >
                {tab.children}
                {canClose ? (
                    <span
                        class="close"
                        onClick={(e) => {
                            e.stopPropagation();
                            //If we update the DOM synchronously this will trigger another click on another tab
                            requestAnimationFrame(() => {
                                onClose?.(
                                    tabId,
                                    resolvedChildren.findIndex((e) => e.props.id === tabId)
                                );
                            });
                        }}
                    >
                        ×
                    </span>
                ) : undefined}
            </div>
        );
    }
}

export interface TabBarItemProps<T> {
    id: T;
    title?: string;
    style?: StyleType;
    class?: ClassType;
    canClose?: boolean;
    onFocus?: (id: T) => void;
    onBlur?: (id: T) => void;
    onClose?: (id: T) => void;
}

export function TabBarItem<T>(props: TabBarItemProps<T>) {
    return undefined;
}
