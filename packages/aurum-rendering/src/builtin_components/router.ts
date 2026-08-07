import { DataSource, DataWriter, ReadOnlyDataSource } from '@aurum/streams';
import { AurumComponentAPI, AurumElementModel, aurumElementModelIdentitiy, Renderable } from '../rendering/aurum_element.js';
import { urlHashEmitter, urlPathEmitter } from '@aurum/streams';
import { resolveChildren } from '../utilities/transclusion.js';

export interface RouteMatch {
    /** Original URL received by the router. */
    url: string;
    /** Normalized pathname without a query string or hash. */
    pathname: string;
    /** Parameters decoded from `:name`, optional `:name?`, and `*name` segments. */
    params: Readonly<Record<string, string>>;
    route: AurumElementModel<RouteProps>;
}

export interface AurumRouterProps {
    hashRouting?: boolean;
    urlPreprocessing?: (url: string) => string;
    validateNavigation?: (url: string, route: AurumElementModel<RouteProps> | undefined, match?: RouteMatch) => boolean;
    /** Receives the active match without requiring renderer-specific context. */
    routeData?: DataWriter<RouteMatch | undefined>;
    onRouteChange?: (match: RouteMatch | undefined) => void;
    // For server rendering and tests where the browser URL is unavailable.
    urlProvider?: ReadOnlyDataSource<string>;
}

interface RouteRecord {
    route: AurumElementModel<RouteProps>;
    parent?: RouteRecord;
    fullPath: string;
    content: Renderable[];
    isDefault: boolean;
}

interface RouteSelection {
    records: RouteRecord[];
    match: RouteMatch;
}

export function AurumRouter(props: AurumRouterProps, children: Renderable[], api: AurumComponentAPI): ReadOnlyDataSource<Renderable> {
    const resolvedChildren = resolveChildren<AurumElementModel<RouteProps>>(children, api.cancellationToken, validateRouteElement);
    const urlSource = new DataSource<string>(undefined, 'Url Data Source');
    const renderedRoute = new DataSource<Renderable>(undefined, 'Rendered Route');
    let currentUrl: string | undefined;
    let activeSelection: RouteSelection | undefined;

    if (props.urlProvider) {
        props.urlProvider.listenAndRepeat((url) => urlSource.update(url), api.cancellationToken);
    } else if (typeof window !== 'undefined') {
        if (props.hashRouting) {
            urlHashEmitter(urlSource, true, api.cancellationToken);
        } else {
            urlSource.update(window.location.pathname);
            urlPathEmitter(urlSource, api.cancellationToken);
        }
    }

    const recompute = (): void => {
        if (currentUrl === undefined) return;
        const url = props.urlPreprocessing ? props.urlPreprocessing(currentUrl) : currentUrl;
        const records = buildRouteRecords(resolvedChildren.getData());
        const selection = selectRoute(url, records);
        if (props.validateNavigation && !props.validateNavigation(url, selection?.match.route, selection?.match)) return;

        notifyNavigation(activeSelection, selection);
        activeSelection = selection;
        props.routeData?.write(selection?.match);
        props.onRouteChange?.(selection?.match);
        renderedRoute.update(selection ? composeRouteContent(selection) : undefined);
    };

    urlSource.listenAndRepeat((url) => {
        currentUrl = url;
        recompute();
    }, api.cancellationToken);
    resolvedChildren.listen(recompute, api.cancellationToken);

    return renderedRoute;
}

function validateRouteElement(child: Renderable): void {
    const model = child as AurumElementModel<RouteProps>;
    if (!model?.[aurumElementModelIdentitiy] || (model.factory !== Route && model.factory !== DefaultRoute)) {
        throw new Error('Aurum Router only accepts Route and DefaultRoute instances as direct children');
    }
}

function buildRouteRecords(routes: readonly AurumElementModel<RouteProps>[], parent?: RouteRecord): RouteRecord[] {
    const records: RouteRecord[] = [];
    for (const route of routes) {
        validateRouteElement(route);
        const directChildren = flattenStaticChildren(route.children);
        const nestedRoutes = directChildren.filter(isRouteElement);
        const content = directChildren.filter((child) => !isRouteElement(child));
        const isDefault = route.factory === DefaultRoute;
        const fullPath = isDefault ? parent?.fullPath ?? '/' : joinRoutePaths(parent?.fullPath, route.props.href);
        const record: RouteRecord = { route, parent, fullPath, content, isDefault };
        records.push(record, ...buildRouteRecords(nestedRoutes, record));
    }
    return records;
}

function flattenStaticChildren(children: Renderable[]): Renderable[] {
    const result: Renderable[] = [];
    for (const child of children) {
        if (Array.isArray(child)) result.push(...flattenStaticChildren(child));
        else result.push(child);
    }
    return result;
}

function isRouteElement(value: Renderable): value is AurumElementModel<RouteProps> {
    const model = value as AurumElementModel<RouteProps>;
    return Boolean(model?.[aurumElementModelIdentitiy] && (model.factory === Route || model.factory === DefaultRoute));
}

function joinRoutePaths(parentPath: string | undefined, childPath: string): string {
    if (childPath.startsWith('/')) return normalizeRoutePattern(childPath);
    const parent = parentPath && parentPath !== '/' ? parentPath : '';
    return normalizeRoutePattern(`${parent}/${childPath}`);
}

function selectRoute(url: string, records: RouteRecord[]): RouteSelection | undefined {
    const pathname = normalizePathname(url);
    let best: { record: RouteRecord; params: Record<string, string>; score: number } | undefined;

    for (const record of records) {
        if (record.isDefault) continue;
        const matched = matchRoutePattern(record.fullPath, pathname);
        if (matched && (!best || matched.score > best.score)) best = { record, ...matched };
    }

    if (!best) {
        const fallback = records.find((record) => record.isDefault);
        if (!fallback) return undefined;
        best = { record: fallback, params: {}, score: -1 };
    }

    const route = best.record.route;
    const match: RouteMatch = { url, pathname, params: best.params, route };
    const chain: RouteRecord[] = [];
    for (let record: RouteRecord | undefined = best.record; record; record = record.parent) chain.unshift(record);
    return { records: chain, match };
}

function matchRoutePattern(pattern: string, pathname: string): { params: Record<string, string>; score: number } | undefined {
    const patternSegments = splitRoutePattern(pattern);
    const pathSegments = splitPath(pathname);
    const params: Record<string, string> = {};
    let score = 0;
    let pathIndex = 0;

    for (let patternIndex = 0; patternIndex < patternSegments.length; patternIndex++) {
        const segment = patternSegments[patternIndex];
        if (segment.startsWith('*')) {
            params[segment.slice(1) || 'wildcard'] = decodePathPart(pathSegments.slice(pathIndex).join('/'));
            score += 1;
            pathIndex = pathSegments.length;
            break;
        }
        if (segment.startsWith(':')) {
            const optional = segment.endsWith('?');
            const name = segment.slice(1, optional ? -1 : undefined);
            const value = pathSegments[pathIndex];
            if (value === undefined) {
                if (optional) continue;
                return undefined;
            }
            params[name] = decodePathPart(value);
            pathIndex++;
            score += optional ? 3 : 5;
            continue;
        }
        if (pathSegments[pathIndex] !== segment) return undefined;
        pathIndex++;
        score += 10;
    }

    if (pathIndex !== pathSegments.length) return undefined;
    return { params, score: score + patternSegments.length };
}

function splitPath(path: string): string[] {
    return normalizePathname(path).split('/').filter(Boolean);
}

function splitRoutePattern(path: string): string[] {
    return normalizeRoutePattern(path).split('/').filter(Boolean);
}

function normalizeRoutePattern(path: string): string {
    const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
    return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
}

function normalizePathname(url: string): string {
    const withoutQuery = (url || '/').split(/[?#]/, 1)[0] || '/';
    const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
    return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
}

function decodePathPart(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function composeRouteContent(selection: RouteSelection): Renderable {
    let outlet: Renderable = undefined;
    for (let index = selection.records.length - 1; index >= 0; index--) {
        const record = selection.records[index];
        const ownContent = record.route.props?.render?.(selection.match) ?? record.content;
        const replaced = replaceOutlets(ownContent, outlet);
        outlet = outlet !== undefined && !replaced.replaced ? [replaced.content, outlet] : replaced.content;
    }
    return outlet;
}

function replaceOutlets(content: Renderable, outlet: Renderable): { content: Renderable; replaced: boolean } {
    if (Array.isArray(content)) {
        let replaced = false;
        const items = content.map((child) => {
            const result = replaceOutlets(child, outlet);
            replaced ||= result.replaced;
            return result.content;
        });
        return { content: items, replaced };
    }
    const model = content as AurumElementModel<unknown>;
    if (!model?.[aurumElementModelIdentitiy]) return { content, replaced: false };
    if (model.factory === Outlet) return { content: outlet, replaced: true };

    let replaced = false;
    const children = model.children.map((child) => {
        const result = replaceOutlets(child, outlet);
        replaced ||= result.replaced;
        return result.content;
    });
    return { content: replaced ? { ...model, children } : model, replaced };
}

function notifyNavigation(previous: RouteSelection | undefined, next: RouteSelection | undefined): void {
    const previousRecords = previous?.records ?? [];
    const nextRecords = next?.records ?? [];
    let shared = 0;
    while (
        shared < previousRecords.length &&
        shared < nextRecords.length &&
        previousRecords[shared].route === nextRecords[shared].route
    ) {
        shared++;
    }

    for (let index = previousRecords.length - 1; index >= shared; index--) {
        previousRecords[index].route.props?.onNavigateFrom?.(previous!.match);
    }
    for (let index = shared; index < nextRecords.length; index++) {
        nextRecords[index].route.props?.onNavigateTo?.(next!.match);
    }
}

export interface RouteProps {
    href: string;
    render?: (match: RouteMatch) => Renderable;
    onNavigateTo?: (match?: RouteMatch) => void;
    onNavigateFrom?: (match?: RouteMatch) => void;
}

export function Route(_props: RouteProps, _children: Renderable[]): undefined {
    return undefined;
}

export function DefaultRoute(_props: Omit<RouteProps, 'href'>, _children: Renderable[]): undefined {
    return undefined;
}

/** Marker replaced by the active child route when routes are nested. */
export function Outlet(): undefined {
    return undefined;
}

export interface NavigateOptions {
    replace?: boolean;
    state?: unknown;
    hashRouting?: boolean;
}

export function navigate(to: string, options: NavigateOptions = {}): void {
    if (typeof window === 'undefined') return;
    const href = createRouterHref(to, options.hashRouting);
    window.history[options.replace ? 'replaceState' : 'pushState'](options.state, '', href);
    if (options.hashRouting) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function createRouterHref(to: string, hashRouting: boolean = false): string {
    if (!hashRouting) return to;
    return `#${to.startsWith('/') ? to : `/${to}`}`;
}

export function isRouteActive(currentPath: string, targetPath: string, exact: boolean = false): boolean {
    const current = normalizePathname(currentPath);
    const target = normalizePathname(targetPath);
    return current === target || (!exact && target !== '/' && current.startsWith(`${target}/`));
}
