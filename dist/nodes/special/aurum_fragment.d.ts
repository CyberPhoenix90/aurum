import { AurumElement, ChildNode } from './aurum_element';
import { EventEmitter } from '../../utilities/event_emitter';
import { ArrayDataSource } from '../../stream/data_source';
import { AurumTextElement } from './aurum_text';
export interface AurumFragmentProps {
    repeatModel?: ArrayDataSource<AurumElement>;
}
export declare class AurumFragment {
    children: Array<AurumElement | AurumTextElement>;
    onChange: EventEmitter<void>;
    private cancellationToken;
    constructor(props: AurumFragmentProps, children?: ChildNode[]);
    private addChildren;
    private handleRepeat;
    dispose(): void;
}
//# sourceMappingURL=aurum_fragment.d.ts.map