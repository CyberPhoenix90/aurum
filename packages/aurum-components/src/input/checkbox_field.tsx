import { Aurum, BindableSource, getValueOf } from 'aurumjs';
import { getFormFieldSource } from '../form/form.js';
import { FormFieldInput, FormFieldInputProps } from './form_field_input.js';

export interface CheckboxFieldProps<T extends object = Record<string, boolean>>
    extends Omit<FormFieldInputProps<T, boolean>, 'type' | 'step' | 'value' | 'min' | 'max'> {
    value?: BindableSource<boolean> | boolean;
}

export function CheckboxField<T extends object = Record<string, boolean>>(props: CheckboxFieldProps<T>) {
    const { ...inputProps } = props;

    if (props.form && props.name && props.value === undefined) {
        const fieldName = getValueOf(props.name);
        props.value = getFormFieldSource<T, boolean>(props.form, fieldName);
    }

    return <FormFieldInput {...inputProps} value={undefined} checked={props.value} type="checkbox"></FormFieldInput>;
}
