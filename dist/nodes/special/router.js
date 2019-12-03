import { Switch } from './switch';
import { DataSource } from '../../stream/data_source';
export class AurumRouter extends Switch {
    constructor(props) {
        const urlDataSource = new DataSource(location.hash.substring(1));
        super(Object.assign(Object.assign({}, props), { state: urlDataSource }));
        window.addEventListener('hashchange', () => {
            urlDataSource.update(location.hash.substring(1));
        });
    }
}
//# sourceMappingURL=router.js.map