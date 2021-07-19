import { css } from '@emotion/css';
import { AttributeValue, Aurum, AurumComponentAPI, AurumElementModel, ClassType, combineClass, DataDrain, Renderable, resolveChildren } from 'aurumjs';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

export interface SidebarProps {
    class?: ClassType;
    style?: AttributeValue;
}

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.fontFamily, theme.baseFontSize, theme.baseFontColor, theme.themeColor1, theme.highlightColor1, theme.boxShadow],
        (fontFamily, size, fontColor, color1, highlight, boxShadow) => css`
            height: 100%;
            width: 62px;
            display: flex;
            flex-direction: column;
            background: ${color1};
            color: ${fontColor};
            font-family: ${fontFamily};
            font-size: ${size};
            box-shadow: ${boxShadow};

            > ul {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .sidebar-item {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 64px;
                height: 64px;
                user-select: none;
                cursor: pointer;

                &:hover {
                    background: ${highlight};
                }

                transition: all 300ms;
            }
        `,
        lifecycleToken
    )
);

export function Sidebar(props: SidebarProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const resolvedChildren = resolveChildren(children, api.cancellationToken, (c) => (c as AurumElementModel<any>).factory === SidebarItem);

    return (
        <div class={combineClass(style, props.class)} style={props.style}>
            <ul>{resolvedChildren}</ul>
        </div>
    );
}

export function SidebarItem(
    props: {
        href?: AttributeValue;
        title?: AttributeValue;
        onClick?: DataDrain<MouseEvent>;
        class?: ClassType;
        style?: AttributeValue;
    },
    children: Renderable[]
): Renderable {
    return (
        <li title={props.title} onClick={props.onClick} class={combineClass(props.class, 'sidebar-item')} style={props.style}>
            <a href={props.href}>{children}</a>
        </li>
    );
}
