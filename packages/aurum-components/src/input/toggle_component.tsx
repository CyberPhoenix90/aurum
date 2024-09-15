import { css } from '@emotion/css';
import { Aurum, Renderable, combineClass, AurumComponentAPI, DataSource } from 'aurumjs';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import { FormType } from '../form/form.js';

const toggleStyle = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [
            theme.fontFamily,
            theme.baseFontSize,
            theme.themeColor0,
            theme.themeColor1,
            theme.baseFontColor,
            theme.highContrastFontColor,
            theme.primary,
            theme.error
        ],
        (fontFamily, size, color0, color1, baseFontColor, highContrastFontColor, action, error) => css`
            font-family: ${fontFamily};
            font-size: ${size};
            outline: none;
            padding: 6px;
            user-select: none;
            border-radius: 4px;
            border: 2px solid ${color1};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            width: 50px;
            height: 25px;
            position: relative;

            &.on {
                background-color: ${action};
                color: white;
            }

            &.off {
                background-color: ${color0};
                color: ${baseFontColor};
            }

            .toggle-knob {
                position: absolute;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: white;
                transition: transform 0.2s;
            }

            &.on .toggle-knob {
                transform: translateX(25px);
            }

            &.off .toggle-knob {
                transform: translateX(0);
            }
        `,
        lifecycleToken
    )
);

export type ToggleState = 'on' | 'off';

export interface ToggleComponentProps {
    form?: FormType<any, any>;
    name?: string;
    toggleState?: DataSource<ToggleState>;
    onToggle?: (state: ToggleState) => void;
}

export function Toggle(props: ToggleComponentProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    let state = props.toggleState;
    if (!state && props.form && props.name) {
        //@ts-ignore
        state = props.form.schema.fields[props.name].source;
    } else {
        state = new DataSource('off');
    }

    const toggle = () => {
        const newState = state.value === 'on' ? 'off' : 'on';
        state.update(newState);
        if (props.onToggle) {
            props.onToggle(newState);
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
        }
    };

    return (
        <div class={combineClass(api.cancellationToken, toggleStyle, state)} tabIndex={0} onClick={toggle} onKeyDown={handleKeyDown}>
            <div class="toggle-knob"></div>
        </div>
    );
}
