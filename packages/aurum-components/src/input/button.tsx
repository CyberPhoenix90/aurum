import { ButtonProps, Aurum, Renderable, combineClass, AurumComponentAPI, css } from 'aurumjs';
import { theme } from '../theme/theme.js';

const style = css`
    font-family: ${theme.fontFamily};
    font-size: ${theme.baseFontSize};
    outline: none;
    padding: 6px;
    user-select: none;
    border-radius: 4px;
    border-color: ${theme.themeColor1};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &[disabled] {
        pointer-events: none;
        opacity: 0.5;
        cursor: not-allowed;
    }

    &.action {
        font-weight: 500;
        background-color: ${theme.primary};
        color: white;
    }

    &.neutral {
        background-color: ${theme.themeColor0};
        color: ${theme.baseFontColor};
    }

    &.destructive {
        background-color: ${theme.error};
        color: white;
    }
`;

export type ButtonType = 'neutral' | 'action' | 'destructive';

export interface ButtonComponentProps extends Omit<ButtonProps, 'form'> {
    buttonType: ButtonType;
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
