import { AurumComponentAPI, AurumElementModel, Renderable } from '../rendering/aurum_element.js';
import { Aurum, AurumDecorator } from '../jsx.js';

export function attachNotifier<T>(onAttach?: () => void, onDetach?: () => void): AurumDecorator {
    return function (model: AurumElementModel<any>): Renderable {
        function Wrapper(props: {}, children: Renderable[], api: AurumComponentAPI) {
            api.onAttach(() => {
                onAttach?.();
            });
            api.onDetach(() => {
                onDetach?.();
            });

            return children;
        }

        return <Wrapper>{model}</Wrapper>;
    };
}
