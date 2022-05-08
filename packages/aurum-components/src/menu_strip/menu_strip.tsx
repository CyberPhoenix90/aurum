import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    ClassType,
    DataSource,
    dsUnique,
    Renderable,
    combineClass,
    AttributeValue,
    dsMap,
    dsDiff,
    dsTap
} from 'aurumjs';
import { currentTheme } from '../theme/theme';
import { css } from '@emotion/css';
import { aurumify } from '../utils';
import { Dialog } from '../dialog/dialog';
import { ContextMenu } from '../dialog/context_menu';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.themeColor4, theme.themeColor2, theme.highlightColor1],
        (fontFamily, size, fontColor, color4, color2) => css`
            display: flex;
            width: 100%;
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            background-color: ${color2};

            > span {
                padding: 6px 8px;
                cursor: pointer;
                user-select: none;
            }

            > span:hover {
                background-color: ${color4};
            }

            > span.menu-strip-radio-button.active {
                background-color: ${color4};
            }
        `,
        lifecycleToken
    )
);

export function MenuStrip(
    props: {
        style?: AttributeValue;
        class?: ClassType;
        dialogSource: ArrayDataSource<Renderable>;
    },
    children: Renderable[],
    api: AurumComponentAPI
): Renderable {
    const controller: MenuStripController = {
        openId: new DataSource(-1),
        openState: new DataSource(false),
        dialogSource: props.dialogSource,
        activeRadioButton: new DataSource<Renderable>(undefined)
    };

    const menus = children.filter(
        (c) => (c as AurumElementModel<any>).factory === MenuStripMenu || (c as AurumElementModel<any>).factory === MenuStripRadioButton
    );
    for (const menu of menus) {
        if (!(menu as AurumElementModel<any>).props) {
            (menu as AurumElementModel<any>).props = {};
        }
        (menu as AurumElementModel<any>).props.controller = controller;
    }

    return (
        <div style={props.style} class={combineClass(api.cancellationToken, style, props.class)}>
            {children}
        </div>
    );
}

interface MenuStripController {
    openId: DataSource<number>;
    openState: DataSource<boolean>;
    dialogSource: ArrayDataSource<Renderable>;
    activeRadioButton: DataSource<Renderable>;
}

let id = 0;

interface MenuStripRadioButtonProps {
    class?: ClassType;
    style?: AttributeValue;
    isActive?: DataSource<boolean>;
    onClick?: (e: MouseEvent) => void;
    onDeactivate?: () => void;
}

export function MenuStripRadioButton(
    this: AurumElementModel<MenuStripRadioButtonProps>,
    props: MenuStripRadioButtonProps,
    children: Renderable[],
    api: AurumComponentAPI
) {
    //@ts-ignore
    const controller = props.controller as MenuStripController;

    if (props.isActive == undefined) {
        props.isActive = new DataSource(false);
    }

    props.isActive.transform(
        dsUnique(),
        dsDiff(),
        dsTap(({ newValue, oldValue }) => {
            if (oldValue === true && newValue === false) {
                props.onDeactivate?.();
            }
            if (newValue && controller.activeRadioButton.value !== this) {
                controller.activeRadioButton.update(this);
            }
        }),
        api.cancellationToken
    );

    controller.activeRadioButton.transform(
        dsUnique(),
        dsTap((activeRadioButton) => {
            if (activeRadioButton === this && props.isActive.value === false) {
                props.isActive.update(true);
            } else if (activeRadioButton !== this && props.isActive.value === true) {
                props.isActive.update(false);
            }
        }),
        api.cancellationToken
    );

    return (
        <span
            onClick={(e) => {
                props.isActive.update(true);
                props.onClick?.(e);
            }}
            class={combineClass(
                api.cancellationToken,
                props.class,
                'menu-strip-radio-button',
                controller.activeRadioButton.transform(dsMap((v) => (v === this ? 'active' : '')))
            )}
        >
            {children}
        </span>
    );
}

export function MenuStripMenuContent(props: {}, children: Renderable[]) {
    return undefined;
}

export function MenuStripMenu(props: { class?: ClassType; style?: AttributeValue }, children: Renderable[], api: AurumComponentAPI) {
    const menuContent = children.find((c) => (c as AurumElementModel<any>).factory === MenuStripMenuContent);
    const menuId = id++;
    //@ts-ignore
    const magic: MenuStripController = props.controller;

    const isOpen = magic.openState.aggregate([magic.openId], (open, id) => open && id === menuId).transform(dsUnique());
    let dialog;
    let target;

    if (menuContent) {
        isOpen.listen((v) => {
            if (v) {
                dialog = (
                    <Dialog
                        class={props.class}
                        style={props.style}
                        onEscape={() => {
                            magic.openState.update(false);
                        }}
                        onClickOutside={() => {
                            magic.openState.update(false);
                        }}
                        onClickInside={() => {
                            magic.openState.update(false);
                        }}
                        target={target}
                        layout={{
                            direction: 'down',
                            targetPoint: 'start'
                        }}
                    >
                        <ContextMenu>{(menuContent as AurumElementModel<any>).children}</ContextMenu>
                    </Dialog>
                );
                magic.dialogSource.push(dialog);
            } else {
                magic.dialogSource.remove(dialog);
                dialog = undefined;
            }
        }, api.cancellationToken);
    }

    return (
        <span
            onMouseEnter={() => {
                magic.openId.update(menuId);
            }}
            onClick={() => {
                if (magic.openState.value) {
                    magic.openState.update(false);
                } else {
                    magic.openState.update(true);
                    magic.openId.update(menuId);
                }
            }}
            onAttach={(n) => (target = n)}
        >
            {children}
        </span>
    );
}
