import { Aurum } from 'aurumjs';
import { TextField, TextFieldProps } from './text_field';

export interface NumberFieldProps extends Omit<TextFieldProps, 'type' | 'step'> {
	numberType?: NumberType;
}

export enum NumberType {
	INTEGER = 'INTEGER',
	FLOAT = 'FLOAT'
}

export function NumberField(props: NumberFieldProps) {
	const { numberType, ...inputProps } = props;

	return <TextField {...inputProps} type="number" step={numberType === NumberType.INTEGER ? '1' : 'any'}></TextField>;
}
