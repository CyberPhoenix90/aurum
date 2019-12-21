import { DataSource } from '../../stream/data_source';
import { buildRenderableFromModel } from './aurum_element';
const routeIdentity = Symbol('route');
export function AurumRouter(props, children) {
    children = children.map(buildRenderableFromModel);
    if (children.some((c) => !c[routeIdentity])) {
        throw new Error('Aurum Router only accepts Route and DefaultRoute instances as children');
    }
    if (children.filter((c) => c.default).length > 1) {
        throw new Error('Too many default routes only 0 or 1 allowed');
    }
    const urlDataSource = new DataSource(location.hash.substring(1));
    window.addEventListener('hashchange', () => {
        const hash = location.hash.substring(1);
        if (hash.includes('?')) {
            urlDataSource.update(hash.substring(0, hash.indexOf('?')));
        }
        else {
            urlDataSource.update(hash);
        }
    });
    return urlDataSource.unique().map((p) => selectRoute(p, children));
}
function selectRoute(url, routes) {
    var _a, _b;
    if (url === undefined || url === null) {
        return (_a = routes.find((r) => r.default)) === null || _a === void 0 ? void 0 : _a.content;
    }
    else {
        if (routes.find((r) => r.href === url)) {
            return routes.find((r) => r.href === url).content;
        }
        else {
            const segments = url.split('/');
            segments.pop();
            while (segments.length) {
                const path = segments.join('/');
                if (routes.find((r) => r.href === path)) {
                    return routes.find((r) => r.href === path).content;
                }
                segments.pop();
            }
            return (_b = routes.find((r) => r.default)) === null || _b === void 0 ? void 0 : _b.content;
        }
    }
}
export function Route(props, children) {
    return {
        [routeIdentity]: true,
        content: children,
        default: false,
        href: props.href
    };
}
export function DefaultRoute(props, children) {
    return {
        [routeIdentity]: true,
        content: children,
        default: true,
        href: undefined
    };
}
//# sourceMappingURL=router.js.map