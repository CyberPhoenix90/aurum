import { Aurum, AurumComponentAPI, BindableSource, combineClass, css, DataSource, Renderable } from 'aurumjs';
import { TextField, TextFieldProps } from './text_field.js';
import { Button } from './button.js';

const pickerStyle = css`
            display: flex;
            .text-field {
                width: 176px;
            }

            button {
                height: 24px;
            }
        `;

export interface FilePickerProps<T extends object = Record<string, string>> extends Omit<TextFieldProps<T>, 'value'> {
    value: BindableSource<string>;
    filter?: string;
    file: DataSource<File>;
}

export function FilePicker<T extends object = Record<string, string>>(props: FilePickerProps<T>, children: Renderable[], api: AurumComponentAPI): Renderable {
    let { filter, file, value, ...textFieldProps } = props;

    return (
        <span class={combineClass(api.cancellationToken, pickerStyle, props.class)} style={props.style}>
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
                            props.value.write(file.name);
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
