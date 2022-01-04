import { Aurum, DataSource, DuplexDataSource, GenericDataSource } from 'aurumjs';
import { TextField, TextFieldProps } from './text_field';

export interface NumberFieldProps extends Omit<TextFieldProps, 'type' | 'step' | 'value'> {
    numberType?: NumberType;
    value: GenericDataSource<number> | number;
}

export enum NumberType {
    INTEGER = 'INTEGER',
    FLOAT = 'FLOAT'
}

export function NumberField(props: NumberFieldProps) {
    const { numberType, ...inputProps } = props;
    const valueSource = new DataSource(props.value.toString());
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

    return <TextField {...inputProps} value={valueSource} type="number" step={numberType === NumberType.INTEGER ? '1' : 'any'}></TextField>;
}
