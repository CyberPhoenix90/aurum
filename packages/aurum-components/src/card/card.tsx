import { css } from '@emotion/css';
import { AttributeValue, Aurum, AurumComponentAPI, ClassType, combineClass, DataSource, dsMap, Renderable } from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [theme.themeColor2, theme.boxShadow, theme.highContrastFontColor],
        (color2, boxShadow, highContrastFontColor) => css`
            margin: 8px;
            padding: 8px;
            border-radius: 4px;
            background-color: ${color2};
            box-shadow: ${boxShadow};
            box-sizing: border-box;
            position: relative;

            .card-content {
                h1:first-child,
                h2:first-child,
                h3:first-child,
                h4:first-child,
                h5:first-child,
                h6:first-child {
                    margin-top: 0;
                }
            }

            .close-button {
                position: absolute;
                right: 8px;
                cursor: pointer;
                font-size: 24px;
                &:hover {
                    color: ${highContrastFontColor};
                }
            }
        `,
        lifecycleToken
    )
);

interface CardProps {
    onClose?: (e: MouseEvent) => void;
    closable?: AttributeValue;
    style?: AttributeValue;
    class?: ClassType;
    onClick?: (e: MouseEvent) => void;
    onMouseDown?: (e: MouseEvent) => void;
    onMouseUp?: (e: MouseEvent) => void;
    onMouseEnter?: (e: MouseEvent) => void;
    onMouseLeave?: (e: MouseEvent) => void;
    onAttach?: (div: HTMLDivElement) => void;
    onDetach?: () => void;
}

export function Card(props: CardProps, children: Renderable, api: AurumComponentAPI): Renderable {
    const closable = props.closable instanceof DataSource ? props.closable : new DataSource(props.closable ?? false);

    return (
        <div
            class={combineClass(api.cancellationToken, style, props.class)}
            style={props.style}
            onClick={props.onClick}
            onMouseDown={props.onMouseDown}
            onMouseUp={props.onMouseUp}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
            onAttach={props.onAttach}
            onDetach={props.onDetach}
        >
            {closable.transform(
                dsMap((v) =>
                    v ? (
                        <div class="close-button" onClick={(e) => props.onClose?.(e)}>
                            ⨯
                        </div>
                    ) : undefined
                )
            )}
            <div class="card-content">{children}</div>
        </div>
    );
}
