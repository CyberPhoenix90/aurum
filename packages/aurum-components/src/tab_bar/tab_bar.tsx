import {
    ArrayDataSource,
    Aurum,
    aurumClassName,
    combineClass,
    AurumComponentAPI,
    DataSource,
    dsMap,
    DuplexDataSource,
    Renderable,
    StyleType,
    ClassType
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

export type TabsetLabelContent = string | { id: string; content: Renderable };
export type TabsetLabelContentSource = ArrayDataSource<TabsetLabelContent>;

interface TabBarProps {
    canReorder?: boolean;
    canClose?: boolean;
    onClose?(tab: string, index: number): void;
    onReorder?(tabA: string, tabB: string): void;
    class?: ClassType;
    style?: StyleType;
    selected: DataSource<string> | DuplexDataSource<string>;
}

export function TabBar(props: TabBarProps, children: TabsetLabelContentSource[], api: AurumComponentAPI): any {
    const { selected, canClose, canReorder, onClose, onReorder } = props;

    children = children.flat();
    let heldItem: string = undefined;

    const tabs = new DataSource<TabsetLabelContent[]>();
    for (const c of children) {
        if (c instanceof ArrayDataSource) {
            c.listen(() => rebuildTabs(tabs, children));
        }
    }
    rebuildTabs(tabs, children);

    if (canClose) {
        api.cancellationToken.registerDomEvent(document, 'keydown', (e: KeyboardEvent) => {
            if (e.key === 'w' && e.altKey) {
                onClose?.(
                    selected.value,
                    tabs.value.findIndex((v) => v === selected.value)
                );
            }
        });
    }

    return (
        <div class={combineClass(api.cancellationToken, style, props.class)} style={props.style}>
            {tabs.transform(dsMap((tabsValue) => tabsValue.map((c, i) => renderTab(i, c))))}
        </div>
    );

    function renderTab(i: number, tab: TabsetLabelContent): any {
        let tabId: string, tabContent: Renderable;
        if (typeof tab === 'string') {
            tabId = tab;
            tabContent = tab;
        } else {
            tabId = tab.id;
            tabContent = tab.content;
        }

        const className = aurumClassName({
            tab: true,
            selected: selected.transform(dsMap((s) => s === tabId))
        });

        return (
            <div
                onDragStart={() => (heldItem = tabId)}
                onDragEnter={() => onReorder?.(tabId, heldItem)}
                draggable={canReorder ? 'true' : false}
                onMouseUp={(e: MouseEvent) => {
                    if (e.button === 1 && canClose) {
                        onClose?.(tabId, i);
                    } else if (e.button === 0) {
                        if (selected instanceof DataSource) {
                            selected.update(tabId);
                        } else {
                            selected.updateUpstream(tabId);
                        }
                    }
                }}
                class={className}
            >
                {tabContent}
                {canClose ? (
                    <span
                        class="close"
                        onClick={(e) => {
                            e.stopPropagation();
                            //If we update the DOM synchronously this will trigger another click on another tab
                            requestAnimationFrame(() => {
                                onClose?.(tabId, i);
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

function rebuildTabs(tabs: DataSource<TabsetLabelContent[]>, children: TabsetLabelContentSource[]): void {
    const result = [];
    for (const child of children) {
        if (child instanceof ArrayDataSource) {
            result.push(...child.getData());
        } else {
            result.push(child);
        }
    }

    const bad = result.find((e) => !(typeof e === 'string') && (!e.id || !e.content));
    if (bad) {
        throw new Error('Tabbar children must be strings or objects with an id and a content props or a datasource with those objects in it');
    }

    tabs.update(result);
}
