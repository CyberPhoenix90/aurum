import { css } from '@emotion/css';
import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    CancellationToken,
    ClassType,
    DataSource,
    Renderable,
    StyleType,
    combineClass,
    combineStyle,
    dsMap,
    dsUpdateToken,
    resolveChildren
} from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';

export interface AccordionProps {
    style?: StyleType;
    class?: ClassType;
    singleOpen?: boolean | DataSource<boolean>;
    sizeMode:
        | {
              type: 'fit-content';
          }
        | {
              type: 'even-share';
              height: number | string;
          };
}

export interface AccordionItemProps {
    title: Renderable;
    unresizable?: boolean;
    noCollapseButton?: boolean;
    expanded?: boolean | DataSource<boolean>;
}

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.themeColor1, theme.themeColor3, theme.themeColor2, theme.highlightColor1],
        (fontFamily, size, fontColor, color1, color3, color2, highlight) => css`
            background-color: ${color1};
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};

            display: flex;
            flex-direction: column;

            &.fit-content {
                .content {
                    transition: max-height 0.2s ease-out;
                }
            }

            &.even-share .open {
                flex: 1;
                .content {
                    flex-grow: 1;
                    flex-shrink: 1;
                    flex-basis: 0;
                    overflow-y: auto;
                }
            }

            .accordion-item {
                .content {
                    width: 100%;
                    overflow: hidden;
                    max-height: 0;
                }

                .header {
                    &:focus-visible {
                        position: relative;
                        outline: solid ${highlight} 4px;
                    }

                    user-select: none;
                    background-color: ${color2};
                    cursor: pointer;
                    padding-top: 6px;
                    padding-bottom: 6px;
                    padding-left: 8px;
                    width: calc(100% - 8px);
                    text-align: left;
                    border: none;
                    outline: none;
                    transition: background-color 0.4s;

                    &:hover {
                        background-color: ${color3};
                    }

                    i {
                        margin-right: 8px;
                        float: right;
                    }
                }
            }
        `,
        lifecycleToken
    )
);

export function Accordion(props: AccordionProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const accordionItems = resolveChildren<AurumElementModel<AccordionItemProps>>(
        children,
        api.cancellationToken,
        (c) => (c as AurumElementModel<{}>).factory === AccordionItem
    );
    const availableSpace = new DataSource<number>();
    const headerSpaceSizes = new ArrayDataSource<DataSource<number>>();
    const openStates = new ArrayDataSource<DataSource<Boolean>>();
    const openCount = ArrayDataSource.DynamicArrayDataSourceToArrayDataSource(openStates, api.cancellationToken).reduce((acc, cur) => acc + (cur ? 1 : 0), 0);
    const overhead = ArrayDataSource.DynamicArrayDataSourceToArrayDataSource(headerSpaceSizes, api.cancellationToken).reduce((acc, cur) => acc + cur, 0);
    const singleOpen = props.singleOpen ? DataSource.toDataSource(props.singleOpen) : new DataSource<boolean>(false);

    const onOpen = new DataSource<DataSource<boolean>>();
    onOpen.listen((changedState) => {
        if (singleOpen.value) {
            for (const openState of openStates) {
                if (openState !== changedState && openState.value) {
                    openState.update(false);
                }
            }
        }
    });

    const className = {
        'fit-content': props.sizeMode.type === 'fit-content',
        'even-share': props.sizeMode.type === 'even-share'
    };

    return (
        <div
            onAttach={(container) => {
                if (props.sizeMode.type === 'even-share') {
                    availableSpace.update(container.clientHeight);
                    const rso = new ResizeObserver(() => {
                        availableSpace.update(container.clientHeight);
                    });
                    rso.observe(container);
                    api.cancellationToken.addCancellable(() => rso.disconnect());
                }
            }}
            class={combineClass(api.cancellationToken, style, props.class, className)}
            style={combineStyle(
                api.cancellationToken,
                props.style,
                props.sizeMode.type === 'fit-content'
                    ? undefined
                    : `height: ${typeof props.sizeMode.height === 'number' ? props.sizeMode.height + 'px' : props.sizeMode.height}`
            )}
        >
            {accordionItems.map((accordionItem) => {
                const open = DataSource.toDataSource(accordionItem.props.expanded ?? false);
                const headerSpaceSize = new DataSource<number>(0);
                headerSpaceSizes.push(headerSpaceSize);
                openStates.push(open);
                const token = new CancellationToken();

                open.listenAndRepeat((state) => {
                    if (state) {
                        onOpen.update(open);
                    }
                }, token);

                return (
                    <div class={['accordion-item', open.transform(dsMap((v) => (v ? 'open' : 'closed')))]}>
                        <div
                            tabindex="0"
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    const selectedNode = e.target as HTMLElement;
                                    const nextNode = selectedNode.parentElement.nextElementSibling.childNodes[0] as HTMLElement;
                                    if (nextNode) {
                                        nextNode.focus();
                                    }
                                }

                                if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    const selectedNode = e.target as HTMLElement;
                                    const nextNode = selectedNode.parentElement.previousElementSibling.childNodes[0] as HTMLElement;
                                    if (nextNode) {
                                        nextNode.focus();
                                    }
                                }

                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    open.update(!open.value);
                                }
                            }}
                            onAttach={(header) => {
                                if (props.sizeMode.type === 'even-share') {
                                    headerSpaceSize.update(header.clientHeight);
                                    const rso = new ResizeObserver(() => {
                                        headerSpaceSize.update(header.clientHeight);
                                    });
                                    rso.observe(header);
                                    token.addCancellable(() => rso.disconnect());
                                }
                            }}
                            onDetach={() => {
                                token.cancel();
                                headerSpaceSizes.remove(headerSpaceSize);
                                openStates.remove(open);
                            }}
                            class="header"
                            onClick={() => {
                                open.update(!open.value);
                            }}
                        >
                            {accordionItem.props.title}
                            <i>{open.transform(dsMap((isOpen) => (isOpen ? '-' : '+')))}</i>
                        </div>
                        {open.transform(
                            dsUpdateToken(),
                            dsMap(({ token: openStateToken, value: isOpen }) =>
                                isOpen ? (
                                    <div
                                        onAttach={(div) => {
                                            if (props.sizeMode.type === 'even-share') {
                                                DataSource.fromAggregation([openCount, availableSpace, overhead], (length, available, overhead) => {
                                                    div.style.maxHeight = `${(available - overhead) / length}px`;
                                                });
                                            } else {
                                                div.style.maxHeight = div.scrollHeight + 'px';
                                                const rso = new ResizeObserver(() => {
                                                    div.style.maxHeight = div.scrollHeight + 'px';
                                                });
                                                rso.observe(div.firstChild as HTMLElement);
                                                openStateToken.addCancellable(() => rso.disconnect());
                                                token.addCancellable(() => rso.disconnect());
                                            }
                                        }}
                                        class="content"
                                    >
                                        <div>{accordionItem.children}</div>
                                    </div>
                                ) : undefined
                            )
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function AccordionItem(props: AccordionItemProps): Renderable {
    //Magical transclusion component
    return undefined;
}
