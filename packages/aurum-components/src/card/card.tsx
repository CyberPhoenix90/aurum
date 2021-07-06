import { css } from '@emotion/css';
import { AttributeValue, Aurum, ClassType, combineClass, Renderable } from 'aurumjs';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.themeColor2],
        (color2) => css`
            margin: 8px;
            padding: 8px;
            border-radius: 4px;
            background-color: ${color2};
            box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
            box-sizing: border-box;

            h1:first-child,
            h2:first-child,
            h3:first-child,
            h4:first-child,
            h5:first-child,
            h6:first-child {
                margin-top: 0;
            }
        `,
        lifecycleToken
    )
);

export function Card(props: { style?: AttributeValue; class?: ClassType }, children: Renderable): Renderable {
    return (
        <div class={combineClass(style, props.class)} style={props.style}>
            {children}
        </div>
    );
}
