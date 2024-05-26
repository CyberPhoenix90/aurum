import { css } from '@emotion/css';
import { ButtonProps, Aurum, Renderable, combineClass, AurumComponentAPI } from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [
            theme.fontFamily,
            theme.baseFontSize,
            theme.themeColor0,
            theme.themeColor1,
            theme.themeColor4,
            theme.highContrastFontColor,
            theme.primary,
            theme.error
        ],
        (fontFamily, size, color0, color1, color4, highContrastFontColor, action, error) => css`
            font-family: ${fontFamily};
            font-size: ${size};
            outline: none;
            padding: 6px;
            user-select: none;
            border-radius: 4px;
            border-color: ${color1};
            display: flex;
            align-items: center;

            cursor: pointer;

            &.action {
                font-weight: 500;
                background-color: ${action};
                color: ${color0};
            }

            &.neutral {
                background-color: ${color0};
                color: ${highContrastFontColor};
            }

            &.destructive {
                background-color: ${error};
                color: ${highContrastFontColor};
            }
        `,
        lifecycleToken
    )
);

export interface ButtonComponentProps extends ButtonProps {
    buttonType: 'neutral' | 'action' | 'destructive';
    icon?: Renderable;
}

export function Button(props: ButtonComponentProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const { buttonType, icon, ...rest } = props;

    return (
        <button
            class={combineClass(api.cancellationToken, props.class, style, {
                action: props.buttonType === 'action',
                neutral: props.buttonType === 'neutral',
                destructive: props.buttonType === 'destructive'
            })}
            {...rest}
        >
            {props.icon}
            {children}
        </button>
    );
}
