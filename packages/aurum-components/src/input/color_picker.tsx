import { Aurum } from 'aurumjs';
import { TextField, TextFieldProps } from './text_field';

export interface ColorPickerProps extends Omit<TextFieldProps, 'type'> {}

export interface ColorPickerProps {}

export function ColorPicker(props: ColorPickerProps) {
	const { ...inputProps } = props;

	return <TextField {...inputProps} type="color"></TextField>;
}
