import { AurumElement, AurumElementProps, ChildNode } from './special/aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, Callback, AttributeValue } from '../utilities/common';
export interface TextAreaProps extends AurumElementProps {
    onAttach?: Callback<HTMLTextAreaElement>;
    onDetach?: Callback<HTMLTextAreaElement>;
    onCreate?: Callback<HTMLTextAreaElement>;
    placeholder?: AttributeValue;
    readonly?: AttributeValue;
    disabled?: AttributeValue;
    onChange?: DataDrain<InputEvent>;
    onInput?: DataDrain<InputEvent>;
    inputValueSource?: DataSource<string>;
    initialValue?: string;
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
export declare class TextArea extends AurumElement {
    node: HTMLTextAreaElement;
    constructor(props: TextAreaProps, children: ChildNode[]);
}
//# sourceMappingURL=textarea.d.ts.map