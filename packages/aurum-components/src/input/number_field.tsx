import { Aurum, AurumComponentAPI, BindableSource, DataSource, GenericDataSource, dsMap, getValueOf } from 'aurumjs';
import { FormFieldInput, FormFieldInputProps } from './form_field_input.js';
import { getFormFieldSource } from '../form/form.js';

export interface NumberFieldProps<T extends object = Record<string, number>>
    extends Omit<FormFieldInputProps<T, number>, 'type' | 'step' | 'value' | 'min' | 'max'> {
    numberType?: NumberType;
    value?: BindableSource<number> | number;
    min?: number | GenericDataSource<number>;
    max?: number | GenericDataSource<number>;
}

export enum NumberType {
    INTEGER = 'INTEGER',
    FLOAT = 'FLOAT'
}

export function NumberField<T extends object = Record<string, number>>(props: NumberFieldProps<T>, _children: unknown[], api: AurumComponentAPI) {
    const { numberType = NumberType.INTEGER, min, max, ...inputProps } = props;

    if (props.form && props.name && props.value === undefined) {
        const fieldName = getValueOf(props.name);
        props.value = getFormFieldSource<T, number>(props.form, fieldName);
    }

    const valueSource = new DataSource(getValueOf(props.value)?.toString() ?? '');
    const resolvedMin = props.min === undefined ? undefined : DataSource.toDataSource(props.min).transform(dsMap((v) => v.toString()));
    const resolvedMax = props.max === undefined ? undefined : DataSource.toDataSource(props.max).transform(dsMap((v) => v.toString()));
    const boundValue = typeof props.value === 'number' ? undefined : props.value;
    let synchronizingFromBoundValue = false;

    boundValue?.listen((newValue) => {
        const renderedValue = newValue?.toString() ?? '';
        if (valueSource.value !== renderedValue) {
            synchronizingFromBoundValue = true;
            try {
                valueSource.update(renderedValue);
            } finally {
                synchronizingFromBoundValue = false;
            }
        }
    }, api.cancellationToken);

    valueSource.listen((newValue) => {
        if (synchronizingFromBoundValue || !boundValue) {
            return;
        }
        if (numberType === NumberType.INTEGER) {
            boundValue.write(parseInt(newValue));
        } else {
            boundValue.write(parseFloat(newValue));
        }
    }, api.cancellationToken);

    return (
        <FormFieldInput
            {...inputProps}
            min={resolvedMin}
            max={resolvedMax}
            value={valueSource}
            type="number"
            step={numberType === NumberType.INTEGER ? '1' : 'any'}
        ></FormFieldInput>
    );
}
