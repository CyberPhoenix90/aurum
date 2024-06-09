import { Aurum, DataSource, DuplexDataSource, GenericDataSource, dsMap, getValueOf } from 'aurumjs';
import { TextField, TextFieldProps } from './text_field.js';

export interface NumberFieldProps extends Omit<TextFieldProps, 'type' | 'step' | 'value' | 'min' | 'max'> {
    numberType?: NumberType;
    value?: GenericDataSource<number> | number;
    min?: number | GenericDataSource<number>;
    max?: number | GenericDataSource<number>;
}

export enum NumberType {
    INTEGER = 'INTEGER',
    FLOAT = 'FLOAT'
}

export function NumberField(props: NumberFieldProps) {
    const { numberType = NumberType.INTEGER, min, max, ...inputProps } = props;

    if (props.form && props.name && !props.value) {
        //@ts-ignore
        props.value = props.form.schema[getValueOf(props.name)].source;
    }

    const valueSource = new DataSource(getValueOf(props.value));
    const resolvedMin = DataSource.toDataSource(props.min).transform(dsMap((v) => v.toString()));
    const resolvedMax = DataSource.toDataSource(props.max).transform(dsMap((v) => v.toString()));

    valueSource.listen((newValue) => {
        if (numberType === NumberType.INTEGER) {
            if (props.value instanceof DataSource) {
                props.value.update(parseInt(newValue));
            } else if (props.value instanceof DuplexDataSource) {
                props.value.updateUpstream(parseInt(newValue));
            }
        } else {
            if (props.value instanceof DataSource) {
                props.value.update(parseFloat(newValue));
            } else if (props.value instanceof DuplexDataSource) {
                props.value.updateUpstream(parseFloat(newValue));
            }
        }
    });

    return (
        <TextField
            {...inputProps}
            min={resolvedMin}
            max={resolvedMax}
            value={valueSource}
            type="number"
            step={numberType === NumberType.INTEGER ? '1' : 'any'}
        ></TextField>
    );
}
