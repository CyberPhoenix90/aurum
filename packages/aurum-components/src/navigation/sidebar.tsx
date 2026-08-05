import {
    AttributeValue,
    Aurum,
    AurumComponentAPI,
    AurumElementModel,
    ClassType,
    combineClass,
    DataDrain,
    Renderable,
    resolveChildren,
    StyleType,
    css
} from 'aurumjs';
import { theme } from '../theme/theme.js';

export interface SidebarProps {
    class?: ClassType;
    style?: StyleType;
}

const { fontFamily, baseFontSize: size, baseFontColor: fontColor, themeColor1: color1, highlightColor1: highlight, boxShadow } = theme;
const style = css`
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
        `;

export function Sidebar(props: SidebarProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const resolvedChildren = resolveChildren(children, api.cancellationToken, (c) => (c as AurumElementModel<any>).factory === SidebarItem);

    return (
        <div class={combineClass(api.cancellationToken, style, props.class)} style={props.style}>
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
        style?: StyleType;
    },
    children: Renderable[],
    api: AurumComponentAPI
): Renderable {
    return (
        <li title={props.title} onClick={props.onClick} class={combineClass(api.cancellationToken, props.class, 'sidebar-item')} style={props.style}>
            <a href={props.href}>{children}</a>
        </li>
    );
}
