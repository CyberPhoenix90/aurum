import {
    ArrayDataSource,
    AurumComponentAPI,
    AurumElementModel,
    aurumElementModelIdentitiy,
    createAPI,
    DataSource,
    dsMap,
    DuplexDataSource,
    Renderable,
    RenderSession
} from 'aurumjs';
import { _ } from '../utilities/streamline';
import { currentEntityPtr } from './entity';

export function render<T extends Renderable | Renderable[]>(element: T, session: RenderSession, prerendering: boolean = false): any {
    if (element == undefined) {
        return undefined;
    }

    if (Array.isArray(element)) {
        const result = [];
        for (const item of element) {
            const rendered = render(item, session, prerendering);
            // Flatten the rendered content into a single array to avoid having to iterate over nested arrays later
            if (rendered !== undefined && rendered !== null) {
                if (Array.isArray(rendered)) {
                    result.push(...rendered);
                } else {
                    result.push(rendered);
                }
            }
        }
        return result;
    }

    if (!prerendering) {
        const type = typeof element;
        if (type === 'string') {
            throw new Error('String Nodes are not supported in Aurum Game Engine');
        }

        if (element instanceof Promise) {
            const ds = new DataSource<Renderable>();
            element.then((val) => {
                ds.update(render(val, session, prerendering));
            });
            return ds;
        } else if (element instanceof DataSource || element instanceof DuplexDataSource) {
            const result = element.transform(
                dsMap((v) => render(v, session, prerendering)),
                session.sessionToken
            );
            return result;
        } else if (element instanceof ArrayDataSource) {
            const result = element.map((v) => render(v, session, prerendering), [], session.sessionToken);
            return result;
        }
    }

    if (element[aurumElementModelIdentitiy]) {
        const model: AurumElementModel<any> = element as any as AurumElementModel<any>;
        let api: AurumComponentAPI;
        //Optimization: skip creating API for no props basic html nodes because they are by far the most frequent and this can yield a noticable performance increase
        if (!model.isIntrinsic || model.props) {
            api = createAPI(session);
        } else {
            api = {
                renderSession: session
            } as any;
        }
        let componentResult;
        currentEntityPtr.entity = {
            children: undefined,
            parent: undefined,
            addChild: undefined,
            prependChild: undefined,
            removeChild: undefined,
            traits: new Map(),
            uid: _.getUId()
        };
        componentResult = model.factory(model.props ?? {}, model.children, api);
        currentEntityPtr.entity = undefined;
        return render(componentResult, session, prerendering);
    }
    // Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
    return element as any;
}
