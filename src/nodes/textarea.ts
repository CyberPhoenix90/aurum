import { GenericDataSource, DataSource } from '../stream/data_source';
import { AttributeValue, DataDrain } from '../utilities/common';
import { DomNodeCreator, HTMLNodeProps } from './dom_adapter';
import { CancellationToken } from '../utilities/cancellation_token';
import { DuplexDataSource } from '../stream/duplex_data_source';

export interface TextAreaProps extends HTMLNodeProps<HTMLTextAreaElement> {
	placeholder?: AttributeValue;
	readonly?: AttributeValue;
	disabled?: AttributeValue;
	onChange?: DataDrain<InputEvent>;
	onInput?: DataDrain<InputEvent>;
	value?: GenericDataSource<string> | string;
	rows?: AttributeValue;
	wrap?: AttributeValue;
	autocomplete?: AttributeValue;
	autofocus?: AttributeValue;
	max?: AttributeValue;
	maxLength?: AttributeValue;
	min?: AttributeValue;
	minLength?: AttributeValue;
	required?: AttributeValue;
	type?: AttributeValue;
}

/**
 * @internal
 */
const textAreaEvents = { input: 'onInput', change: 'onChange' };

/**
 * @internal
 */
const textAreaProps = [
	'placeholder',
	'readonly',
	'disabled',
	'rows',
	'wrap',
	'autocomplete',
	'autofocus',
	'max',
	'maxLength',
	'min',
	'minLength',
	'required',
	'type'
];

/**
 * @internal
 */
export const TextArea = DomNodeCreator<TextAreaProps>(
	'textArea',
	textAreaProps,
	textAreaEvents,
	(node: HTMLElement, props: TextAreaProps, cleanUp: CancellationToken) => {
		const textArea = node as HTMLTextAreaElement;
		if (props.value) {
			if (props.value instanceof DataSource) {
				props.value.listenAndRepeat((v) => {
					textArea.value = v;
				}, cleanUp);
				textArea.addEventListener('input', () => {
					(props.value as DataSource<string>).update(textArea.value);
				});
			} else if (props.value instanceof DuplexDataSource) {
				props.value.listenAndRepeat((v) => {
					textArea.value = v;
				}, cleanUp);
				textArea.addEventListener('input', () => {
					(props.value as DuplexDataSource<string>).updateUpstream(textArea.value);
				});
			} else {
				textArea.value = props.value as string;
			}
		}
	}
);
