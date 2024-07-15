import { css } from '@emotion/css';
import { Aurum, AurumComponentAPI, combineClass, DataSource, DuplexDataSource, Renderable } from 'aurumjs';
import { FormType } from '../form/form.js';
import { currentTheme } from '../theme/theme.js';
import { aurumify } from '../utils.js';
import { TextField, TextFieldProps } from './text_field.js';
import { Button } from './button.js';

const theme = aurumify([currentTheme], (theme, lifecycleToken) =>
    aurumify(
        [
            theme.fontFamily,
            theme.baseFontSize,
            theme.highlightFontColor,
            theme.themeColor0,
            theme.themeColor1,
            theme.themeColor3,
            theme.themeColor2,
            theme.primary
        ],
        (fontFamily, size, highlightFont, color0, color1, color3, color2, primary) => css`
            display: flex;
            .text-field {
                width: 176px;
            }

            button {
                height: 24px;
            }
        `,
        lifecycleToken
    )
);

export interface FilePickerProps extends Omit<TextFieldProps, 'value'> {
    value: DataSource<string> | DuplexDataSource<string>;
    filter?: string;
    form?: FormType<any, any>;
    file: DataSource<File>;
}

export function FilePicker(props: FilePickerProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    let { filter, file, value, ...textFieldProps } = props;

    return (
        <span class={combineClass(api.cancellationToken, theme, props.class)} style={props.style}>
            <TextField value={value} readonly {...textFieldProps}></TextField>
            <Button
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = props.filter;
                    input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files[0];
                        if (file) {
                            props.file.update(file);
                            if (props.value instanceof DuplexDataSource) {
                                props.value.updateUpstream(file.name);
                            } else {
                                props.value.update(file.name);
                            }
                        }
                    };
                    input.click();
                }}
                buttonType="neutral"
            >
                ...
            </Button>
        </span>
    );
}
