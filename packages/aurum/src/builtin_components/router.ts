import { AurumComponentAPI, AurumElementModel, Renderable } from '../rendering/aurum_element.js';
import { DataSource, ReadOnlyArrayDataSource } from '../stream/data_source.js';
import { dsDiff, dsMap, dsTap, dsUnique } from '../stream/data_source_operators.js';
import { urlHashEmitter } from '../stream/emitters.js';
import { resolveChildren } from '../utilities/transclusion.js';

export function AurumRouter(props: {}, children: Renderable[], api: AurumComponentAPI) {
    const resolvedChildren = resolveChildren<AurumElementModel<RouteProps>>(children, api.cancellationToken, (c) => {
        if ((c as AurumElementModel<any>).factory !== Route && (c as AurumElementModel<any>).factory !== DefaultRoute) {
            throw new Error('Aurum Router only accepts Route and DefaultRoute instances as children');
        }
    }).filter(Boolean);
    resolvedChildren
        .reduce(
            (acc, c) => {
                if ((c as AurumElementModel<any>).factory === DefaultRoute) {
                    return acc + 1;
                } else {
                    return acc;
                }
            },
            0,
            api.cancellationToken
        )
        .listenAndRepeat((count) => {
            if (count > 1) {
                throw new Error(`Too many default routes only 0 or 1 allowed. Found ${count}`);
            }
        });

    const urlDataSource = new DataSource<string>();

    if (typeof window !== 'undefined') {
        urlHashEmitter(urlDataSource, true, api.cancellationToken);
    }

    const activeRoute = new DataSource<AurumElementModel<RouteProps>>();

    activeRoute.transform(
        dsUnique(),
        dsDiff(),
        dsTap(({ newValue, oldValue }) => {
            if (oldValue) {
                oldValue.props?.onNavigateFrom?.();
            }
            if (newValue) {
                newValue.props?.onNavigateTo?.();
            }
        })
    );

    return urlDataSource
        .transform(dsUnique(), api.cancellationToken)
        .withInitial(urlDataSource.value)
        .transform(dsMap((p) => selectRoute(p, resolvedChildren, activeRoute)));
}

function selectRoute(
    url: string,
    routes: ReadOnlyArrayDataSource<AurumElementModel<RouteProps>>,
    activeRoute: DataSource<AurumElementModel<RouteProps>>
): Renderable[] {
    let selected;
    if (url === undefined || url === null) {
        selected = routes.find((r) => r.factory === DefaultRoute);
    } else {
        if (routes.find((r) => r.props?.href === url)) {
            selected = routes.find((r) => r.props?.href === url);
        } else {
            const segments = url.split('/');
            segments.pop();
            while (segments.length) {
                const path = segments.join('/');
                if (routes.find((r) => r.props?.href === path)) {
                    selected = routes.find((r) => r.props?.href === path);
                    break;
                }
                segments.pop();
            }
            if (!selected) {
                selected = routes.find((r) => r.factory === DefaultRoute);
            }
        }
    }

    if (selected) {
        activeRoute.update(selected);
        return selected.children;
    } else {
        activeRoute.update(undefined);
        return undefined;
    }
}

export interface RouteProps {
    href: string;
    onNavigateTo?: () => void;
    onNavigateFrom?: () => void;
}

export function Route(props: RouteProps, children): undefined {
    return undefined;
}

export function DefaultRoute(props: Omit<RouteProps, 'href'>, children): undefined {
    return undefined;
}
