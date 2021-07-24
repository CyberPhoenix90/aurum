import { ArrayDataSource, Aurum, AurumComponentAPI, Renderable } from 'aurumjs';

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
