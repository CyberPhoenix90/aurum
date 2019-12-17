import { DataSource } from '../../stream/data_source';
export function Suspense(props, children) {
    const data = new DataSource(props.fallback);
    Promise.all(children).then(() => {
        data.update(children);
    });
    return data;
}
//# sourceMappingURL=suspense.js.map