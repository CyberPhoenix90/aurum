import { AurumElement, AurumElementProps } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, StringSource, Callback } from '../utilities/common';
export interface TextAreaProps extends AurumElementProps {
    onAttach?: Callback<TextArea>;
    onDetach?: Callback<TextArea>;
    onCreate?: Callback<TextArea>;
    onDispose?: Callback<TextArea>;
    placeholder?: StringSource;
    readonly?: StringSource;
    disabled?: StringSource;
    onChange?: DataDrain<InputEvent>;
    onInput?: DataDrain<InputEvent>;
    inputValueSource?: DataSource<string>;
    initialValue?: string;
    rows?: StringSource;
    wrap?: StringSource;
    autocomplete?: StringSource;
    autofocus?: StringSource;
    max?: StringSource;
    maxLength?: StringSource;
    min?: StringSource;
    minLength?: StringSource;
    required?: StringSource;
    type?: StringSource;
}
export declare class TextArea extends AurumElement {
    node: HTMLTextAreaElement;
    onChange: DataSource<InputEvent>;
    onInput: DataSource<InputEvent>;
    constructor(props: TextAreaProps);
}
//# sourceMappingURL=textarea.d.ts.map