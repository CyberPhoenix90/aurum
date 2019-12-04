import { Switch } from './switch';
import { DataSource } from '../../stream/data_source';
export class AurumRouter extends Switch {
    constructor(props) {
        const urlDataSource = new DataSource(location.hash.substring(1));
        super(Object.assign(Object.assign({}, props), { state: urlDataSource }));
        window.addEventListener('hashchange', () => {
            const hash = location.hash.substring(1);
            if (hash.includes('?')) {
                urlDataSource.update(hash.substring(0, hash.indexOf('?')));
            }
            else {
                urlDataSource.update(hash);
            }
        });
    }
}
//# sourceMappingURL=router.js.map