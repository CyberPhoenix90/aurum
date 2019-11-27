import { AurumElement, AurumElementProps } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, StringSource } from '../utilities/common';
export interface TextAreaProps extends AurumElementProps {
    onAttach?: (node: TextArea) => void;
    placeholder?: StringSource;
    readonly?: StringSource;
    disabled?: StringSource;
    onChange?: DataDrain<InputEvent>;
    onInput?: DataDrain<InputEvent>;
    inputValueSource?: DataSource<string>;
    initialValue?: string;
}
export declare class TextArea extends AurumElement {
    node: HTMLTextAreaElement;
    onChange: DataSource<InputEvent>;
    onInput: DataSource<InputEvent>;
    constructor(props: TextAreaProps);
}
//# sourceMappingURL=textarea.d.ts.map