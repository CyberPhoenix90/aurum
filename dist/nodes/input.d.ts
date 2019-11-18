import { AurumElement, AurumElementProps, StringSource } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain } from '../utilities/common';
export interface InputProps extends AurumElementProps {
    onAttach?: (node: Input) => void;
    placeholder?: StringSource;
    onChange?: DataDrain<InputEvent>;
    onInput?: DataDrain<InputEvent>;
    inputValueSource?: DataSource<string>;
}
export declare class Input extends AurumElement {
    node: HTMLInputElement;
    onChange: DataSource<InputEvent>;
    onInput: DataSource<InputEvent>;
    onFocus: DataSource<FocusEvent>;
    onBlur: DataSource<FocusEvent>;
    constructor(props: InputProps);
}
//# sourceMappingURL=input.d.ts.map