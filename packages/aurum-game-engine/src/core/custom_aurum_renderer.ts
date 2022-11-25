import {
    Renderable,
    RenderSession,
    DataSource,
    DuplexDataSource,
    ArrayDataSource,
    aurumElementModelIdentitiy,
    AurumElementModel,
    AurumComponentAPI,
    createAPI
} from 'aurumjs';
import { ArrayDataSourceSceneGraphNode, DataSourceSceneGraphNode } from '../models/scene_graph.js';

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
            return document.createTextNode(element as string) as any;
        } else if (type === 'number' || type === 'bigint' || type === 'boolean') {
            return document.createTextNode(element.toString()) as any;
        }

        if (element instanceof Promise) {
            const ds = new DataSource<Renderable>();
            element.then((val) => {
                ds.update(val);
            });
            const result = new DataSourceSceneGraphNode(ds);
            return result as any;
        } else if (element instanceof DataSource || element instanceof DuplexDataSource) {
            const result = new DataSourceSceneGraphNode(element as any);
            return result as any;
        } else if (element instanceof ArrayDataSource) {
            const result = new ArrayDataSourceSceneGraphNode(element as any);
            return result as any;
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
        if (model.isIntrinsic) {
            componentResult = model.factory(model.props, model.children, api);
        } else {
            componentResult = model.factory(model.props ?? {}, model.children, api);
        }
        return render(componentResult, session, prerendering);
    }
    // Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
    return element as any;
}
