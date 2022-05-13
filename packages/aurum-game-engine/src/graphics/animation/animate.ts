import { CancellationToken } from 'aurumjs';
import { Clock } from '../../game_features/time/clock';
import { clamp } from '../../utilities/math_utils';

export interface AnimateOptions {
    duration: number;
    cancellationToken?: CancellationToken;
    clock?: Clock;
}

export function animate(cb: (progress: number) => void, options: AnimateOptions): Promise<void> {
    const startTime: number = options.clock?.timestamp ?? performance.now();
    return new Promise<void>((resolve) => {
        requestAnimationFrame(function f() {
            if (!options.cancellationToken || !options.cancellationToken.isCanceled) {
                const timeSinceStart: number = (options.clock?.timestamp ?? performance.now()) - startTime;
                const progress: number = timeSinceStart / options.duration;
                cb(clamp(progress, 0, 1));

                if (progress >= 1) {
                    resolve();
                } else {
                    requestAnimationFrame(f);
                }
            }
        });
    });
}
