import { ArrayDataSource, Aurum, AurumComponentAPI, Renderable } from 'aurumjs';

/**
 * WindowManager is a component that manages the z-index of its children based on their order in the array data source and allows the user to change the z-index by clicking on the window
 */
export function WindowManager(props: { windowSource?: ArrayDataSource<any> }, children: Renderable[], api: AurumComponentAPI): Renderable {
    if (children.length !== 1 || !(children[0] instanceof ArrayDataSource)) {
        throw new Error(`Window manager only supports exactly one child of type array data source`);
    }

    return children[0].map((win) => (
        <div
            onMouseDown={(e) => {
                e.stopPropagation();
                const c = children[0] as ArrayDataSource<any>;
                const i = c.indexOf(win);
                for (let x = i; x < c.length.value - 1; x++) {
                    (props.windowSource ?? c).swap(x, x + 1);
                }
            }}
        >
            {win}
        </div>
    ));
}
