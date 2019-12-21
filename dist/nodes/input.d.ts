import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, StringSource, Callback } from '../utilities/common';
export interface InputProps extends AurumElementProps {
    onAttach?: Callback<HTMLInputElement>;
    onDetach?: Callback<HTMLInputElement>;
    onCreate?: Callback<HTMLInputElement>;
    placeholder?: StringSource;
    readonly?: StringSource;
    disabled?: StringSource;
    onChange?: DataDrain<InputEvent>;
    onInput?: DataDrain<InputEvent>;
    inputValueSource?: DataSource<string>;
    initialValue?: string;
    accept?: StringSource;
    alt?: StringSource;
    autocomplete?: StringSource;
    autofocus?: StringSource;
    checked?: StringSource;
    defaultChecked?: StringSource;
    formAction?: StringSource;
    formEnctype?: StringSource;
    formMethod?: StringSource;
    formNoValidate?: StringSource;
    formTarget?: StringSource;
    max?: StringSource;
    maxLength?: StringSource;
    min?: StringSource;
    minLength?: StringSource;
    pattern?: StringSource;
    multiple?: StringSource;
    required?: StringSource;
    type?: StringSource;
}
export declare class Input extends AurumElement {
    node: HTMLInputElement;
    constructor(props: InputProps, children: ChildNode[]);
}
//# sourceMappingURL=input.d.ts.map