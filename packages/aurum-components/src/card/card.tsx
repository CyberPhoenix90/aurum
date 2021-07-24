import { css } from '@emotion/css';
import { AttributeValue, Aurum, ClassType, combineClass, DataSource, dsMap, Renderable } from 'aurumjs';
import { currentTheme } from '../theme/theme';
import { aurumify } from '../utils';

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
}

export function Card(props: CardProps, children: Renderable): Renderable {
    const closable = props.closable instanceof DataSource ? props.closable : new DataSource(props.closable ?? false);

    return (
        <div class={combineClass(style, props.class)} style={props.style}>
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
