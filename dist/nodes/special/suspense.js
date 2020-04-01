import { DataSource } from '../../stream/data_source';
import { prerender } from './aurum_element';
export function Suspense(props, children) {
    const data = new DataSource(props.fallback);
    Promise.all(children.map(prerender)).then((res) => {
        data.update(res);
    });
    return data;
}
//# sourceMappingURL=suspense.js.map