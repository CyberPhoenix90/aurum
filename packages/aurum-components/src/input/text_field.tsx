import { AurumComponentAPI, Renderable } from 'aurumjs';
import { FormFieldInput, FormFieldInputProps } from './form_field_input.js';

export interface TextFieldProps<T extends object = Record<string, string>> extends FormFieldInputProps<T, string> {}

export function TextField<T extends object = Record<string, string>>(
    props: TextFieldProps<T>,
    children: Renderable[],
    api: AurumComponentAPI
): Renderable {
    return FormFieldInput(props, children, api);
}
