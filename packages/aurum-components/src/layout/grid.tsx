import { css } from '@emotion/css';
import { Aurum, Renderable, StyleType, ClassType, combineClass, AurumComponentAPI } from 'aurumjs';

interface GridProps {
    columns?: number;
    rows?: number;
    gap?: string;
    direction?: 'row' | 'column';
    style?: StyleType;
    class?: ClassType;
}

export function Grid(props: GridProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const { columns, rows, gap = '10px', direction = 'row', style, class: className } = props;

    const gridStyle = css`
        display: grid;
        ${direction === 'row' ? `grid-template-columns: repeat(${columns ?? 'auto-fit'}, 1fr);` : ''}
        ${direction === 'column' ? `grid-template-rows: repeat(${rows ?? 'auto-fit'}, 1fr);` : ''}
        gap: ${gap};
    `;

    return (
        <div class={combineClass(api.cancellationToken, gridStyle, className)} style={style}>
            {children}
        </div>
    );
}
