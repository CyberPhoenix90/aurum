import { Switch } from './switch';
import { DataSource } from '../../stream/data_source';
export class AurumRouter extends Switch {
    constructor(props, children) {
        const urlDataSource = new DataSource(location.hash.substring(1));
        super(Object.assign(Object.assign({}, props), { state: urlDataSource }), children);
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
    selectTemplate(ref) {
        if (this.templateMap === undefined) {
            return this.template;
        }
        if (ref === undefined || ref === null) {
            return this.template;
        }
        else {
            if (this.templateMap[ref]) {
                return this.templateMap[ref];
            }
            else {
                const segments = ref.split('/');
                segments.pop();
                while (segments.length) {
                    const path = segments.join('/');
                    if (this.templateMap[path]) {
                        return this.templateMap[path];
                    }
                    segments.pop();
                }
                return this.template;
            }
        }
    }
}
//# sourceMappingURL=router.js.map