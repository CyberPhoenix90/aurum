import { Aurum, BindableSource, Renderable, combineClass, AurumComponentAPI, css, DataSource } from 'aurumjs';
import { theme } from '../theme/theme.js';
import { FormFieldName, FormType, getFormFieldSource } from '../form/form.js';

const { fontFamily, baseFontSize: size, themeColor0: color0, themeColor1: color1, baseFontColor, primary: action } = theme;
const toggleStyle = css`
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
        `;

export type ToggleState = 'on' | 'off';

export interface ToggleComponentProps<T extends object = Record<string, ToggleState>> {
    form?: FormType<T, unknown>;
    name?: FormFieldName<T, ToggleState>;
    toggleState?: BindableSource<ToggleState>;
    onToggle?: (state: ToggleState) => void;
}

export function Toggle<T extends object = Record<string, ToggleState>>(
    props: ToggleComponentProps<T>,
    children: Renderable[],
    api: AurumComponentAPI
): Renderable {
    let state: BindableSource<ToggleState>;
    if (props.toggleState) {
        state = props.toggleState;
    } else if (props.form && props.name) {
        state = getFormFieldSource<T, ToggleState>(props.form, props.name);
    } else {
        state = new DataSource<ToggleState>('off');
    }

    const toggle = () => {
        const newState = state.value === 'on' ? 'off' : 'on';
        state.write(newState);
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
