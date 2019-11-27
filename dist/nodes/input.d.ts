import { AurumElement, AurumElementProps } from './aurum_element';
import { DataSource } from '../stream/data_source';
import { DataDrain, StringSource } from '../utilities/common';
export interface InputProps extends AurumElementProps {
    onAttach?: (node: Input) => void;
    placeholder?: StringSource;
    readonly?: StringSource;
    disabled?: StringSource;
    onChange?: DataDrain<InputEvent>;
    onInput?: DataDrain<InputEvent>;
    inputValueSource?: DataSource<string>;
    initialValue?: string;
}
export declare class Input extends AurumElement {
    node: HTMLInputElement;
    onChange: DataSource<InputEvent>;
    onInput: DataSource<InputEvent>;
    constructor(props: InputProps);
}
//# sourceMappingURL=input.d.ts.map