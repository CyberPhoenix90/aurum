import { css } from '@emotion/css';
import { Aurum, Renderable, StyleType, ClassType, combineClass, AurumComponentAPI } from 'aurumjs';

interface AlertProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    icon?: Renderable;
    style?: StyleType;
    class?: ClassType;
}

const alertStyles = {
    success: css`
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    `,
    error: css`
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    `,
    warning: css`
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeeba;
    `,
    info: css`
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    `
};

const defaultIcons = {
    success: '✔️',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
};

export function Alert(props: AlertProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const { message, type = 'info', icon, style, class: className } = props;
    const alertStyle = alertStyles[type];
    const alertIcon = icon || defaultIcons[type];

    return (
        <div class={combineClass(api.cancellationToken, alertStyle, className)} style={style}>
            <span>{alertIcon}</span> {message}
        </div>
    );
}
