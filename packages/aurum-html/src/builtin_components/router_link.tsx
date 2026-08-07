import { AurumComponentAPI, Renderable, createRouterHref, isRouteActive, navigate } from '@aurum/rendering';
import {
    ClassType,
    DataDrain,
    DataSource,
    DataWriter,
    ReadOnlyDataSource,
    combineClass,
    urlHashEmitter,
    urlPathEmitter,
    writeTo
} from '@aurum/streams';
import { AProps } from '../nodes/simple_dom_nodes.js';
import { Aurum } from '../utilities/aurum.js';

export interface RouterLinkProps extends Omit<AProps, 'href'> {
    to: string;
    replace?: boolean;
    state?: unknown;
    hashRouting?: boolean;
}

/** An anchor that uses the History API for same-document navigation. */
export function RouterLink(props: RouterLinkProps, children: Renderable[]): Renderable {
    const { to, replace, state, hashRouting, onClick, ...anchorProps } = props;
    const href = createRouterHref(to, hashRouting);
    return (
        <a
            {...anchorProps}
            href={href}
            onClick={(event) => {
                if (onClick) writeTo(onClick as DataDrain<MouseEvent>, event);
                if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    (typeof props.target === 'string' && props.target !== '_self')
                ) {
                    return;
                }
                event.preventDefault();
                navigate(to, { replace, state, hashRouting });
            }}
        >
            {children}
        </a>
    );
}

export interface RouterNavLinkProps extends RouterLinkProps {
    activeClass?: string;
    exact?: boolean;
    /** Optional route source for server rendering, tests, or routers using a custom URL source. */
    urlProvider?: ReadOnlyDataSource<string>;
    active?: DataWriter<boolean>;
}

/** RouterLink variant with reactive active class and aria-current state. */
export function RouterNavLink(props: RouterNavLinkProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    const { activeClass = 'active', exact, urlProvider, active: activeWriter, class: baseClass, ...linkProps } = props;
    const path = new DataSource(currentPath(props.hashRouting), 'RouterNavLink path');
    const activeClassSource = new DataSource('', 'RouterNavLink active class');
    const ariaCurrent = new DataSource<string | boolean>(false, 'RouterNavLink aria-current');

    const updateActive = (value: string): void => {
        const next = isRouteActive(value, props.to, exact);
        activeClassSource.updateIfChanged(next ? activeClass : '');
        ariaCurrent.updateIfChanged(next ? 'page' : false);
        activeWriter?.write(next);
    };

    if (urlProvider) urlProvider.listenAndRepeat((value) => path.update(value), api.cancellationToken);
    else if (typeof window !== 'undefined') {
        if (props.hashRouting) urlHashEmitter(path, true, api.cancellationToken);
        else urlPathEmitter(path, api.cancellationToken);
    }
    path.listenAndRepeat(updateActive, api.cancellationToken);

    return (
        <RouterLink
            {...linkProps}
            class={combineClass(api.cancellationToken, baseClass as ClassType, activeClassSource)}
            aria-current={ariaCurrent}
        >
            {children}
        </RouterLink>
    );
}

function currentPath(hashRouting: boolean | undefined): string {
    if (typeof window === 'undefined') return '/';
    if (!hashRouting) return window.location.pathname;
    return window.location.hash.slice(1).split(/[?#]/, 1)[0] || '/';
}
