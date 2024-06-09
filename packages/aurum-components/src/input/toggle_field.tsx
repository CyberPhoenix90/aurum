import { Aurum, DataSource, DuplexDataSource, GenericDataSource, getValueOf } from 'aurumjs';
import { TextField, TextFieldProps } from './text_field.js';

export interface ToggleFieldProps extends Omit<TextFieldProps, 'type' | 'step' | 'value' | 'min' | 'max'> {
    value?: GenericDataSource<boolean> | boolean;
}

export function ToggleField(props: ToggleFieldProps) {
    const { ...inputProps } = props;

    if (props.form && props.name && !props.value) {
        //@ts-ignore
        props.value = props.form.schema[getValueOf(props.name)].source;
    }

    const valueSource = new DataSource(getValueOf(props.value));

    valueSource.listen((newValue) => {
        if (props.value instanceof DataSource) {
            props.value.update(newValue);
        } else if (props.value instanceof DuplexDataSource) {
            props.value.updateUpstream(newValue);
        }
    });

    return <TextField {...inputProps} value={undefined} checked={valueSource} type="checkbox"></TextField>;
}
