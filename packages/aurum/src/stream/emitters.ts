import { DataSource, ArrayDataSource } from './data_source.js';
import { Stream } from './stream.js';
import { DuplexDataSource } from './duplex_data_source.js';
import { CancellationToken, registerAnimationLoop } from '../utilities/cancellation_token.js';
import { ObjectDataSource } from './object_data_source.js';
import { dsDebounce, dsTap } from './data_source_operators.js';
import { EventEmitter } from '../aurumjs.js';

/**
 * Convenience function to update a stream at fixed intervals
 */
export function intervalEmitter<T = void>(
    target: DataSource<T> | DuplexDataSource<T> | Stream<T, any> | ArrayDataSource<T>,
    interval: number,
    value: T,
    cancellationToken?: CancellationToken
): void {
    (cancellationToken ?? new CancellationToken()).setInterval(() => {
        updateSource<T>(target, value);
    }, interval);
}

function updateSource<T = void>(target: DataSource<T> | DuplexDataSource<T> | Stream<T, any> | ArrayDataSource<T> | ((param: T) => void), value: T) {
    if (target instanceof ArrayDataSource) {
        target.push(value);
    } else if (target instanceof DuplexDataSource) {
        target.updateDownstream(value);
    } else if (typeof target === 'function') {
        target(value);
    } else {
        target.update(value);
    }
}

export function urlPathEmitter(
    target: DataSource<string> | DuplexDataSource<string> | Stream<string, any> | ArrayDataSource<string> | ((path: string) => void),
    cancellationToken?: CancellationToken
): void {
    observeHistory();
    historyEvent.subscribe(() => {
        updateSource(target, location.pathname);
    }, cancellationToken);
}

let historyEvent: EventEmitter<void>;
function observeHistory() {
    if (historyEvent) {
        return;
    }
    historyEvent = new EventEmitter();
    const originalReplaceState = history.replaceState.bind(history);
    const originalPushState = history.pushState.bind(history);

    window.addEventListener('popstate', () => {
        historyEvent.fire();
    });

    history.replaceState = (...args: any[]) => {
        originalReplaceState.apply(history, args);
        historyEvent.fire();
    };

    history.pushState = (...args: any[]) => {
        originalPushState.apply(history, args);
        historyEvent.fire();
    };
}

export function urlHashEmitter(
    target: DataSource<string> | DuplexDataSource<string> | Stream<string, any> | ArrayDataSource<string> | ((path: string) => void),
    stripInHashParameters: boolean = false,
    cancellationToken?: CancellationToken
): void {
    updateSource(target, stripInHashParameters ? getUrlHash() : location.hash);
    (cancellationToken ?? new CancellationToken()).registerDomEvent(window, 'hashchange', () => {
        updateSource(target, stripInHashParameters ? getUrlHash() : location.hash);
    });
}

function getUrlHash(): string {
    const hash = location.hash.substring(1);
    if (hash.includes('?')) {
        return hash.substring(0, hash.indexOf('?'));
    } else if (hash.includes('#')) {
        return hash.substring(0, hash.indexOf('#'));
    } else {
        return hash;
    }
}

/**
 * Convenience function to stream the window size to a data source
 */
export function windowSizeEmitter(target: ObjectDataSource<{ width: number; height: number }>, debounce: number = 100, cancellationToken?: CancellationToken) {
    cancellationToken ??= new CancellationToken();
    const updateStream = new DataSource<void>();
    cancellationToken.registerDomEvent(window, 'resize', () => {
        updateStream.update();
    });
    target.assign({
        width: window.innerWidth,
        height: window.innerHeight
    });

    updateStream.transform(
        dsDebounce(debounce),
        dsTap(() =>
            target.assign({
                width: window.innerWidth,
                height: window.innerHeight
            })
        )
    );
}

/**
 * Calls the callback every animation frame with a number from 0 to 1 indicating how far along in the animation timeline it is.
 *
 */
export function animate(cb: (progress: number) => void, time: number, cancellationToken: CancellationToken): Promise<void> {
    return new Promise((resolve) => {
        const animationToken = new CancellationToken();
        if (cancellationToken) {
            cancellationToken.addCancellable(animationToken);
        }
        animationToken.addCancellable(resolve);
        let start = Date.now();
        registerAnimationLoop(() => {
            const progress = Math.min(1, (Date.now() - start) / time);
            cb(progress);
            if (progress === 1) {
                animationToken.cancel();
            }
        }, animationToken);
    });
}

/**
 * Convenience function to stream animate to a datasource
 */
export function tweenEmitter(
    target: DataSource<number> | DuplexDataSource<number> | Stream<number, any> | ArrayDataSource<number>,
    duration: number,
    startValue: number,
    endValue: number,
    interpolation?: (v: number) => number,
    cancellationToken?: CancellationToken
): Promise<void> {
    if (target instanceof DataSource || target instanceof DuplexDataSource || target instanceof Stream) {
        if (startValue === endValue) {
            return new Promise((res) => setTimeout(res, duration));
        }
    }
    return animate(
        (progress) => {
            if (interpolation) {
                progress = interpolation(progress);
            }
            const value = startValue + (endValue - startValue) * progress;
            if (target instanceof ArrayDataSource) {
                target.push(value);
            } else if (target instanceof DuplexDataSource) {
                target.updateDownstream(value);
            } else {
                target.update(value);
            }
        },
        duration,
        cancellationToken
    );
}
