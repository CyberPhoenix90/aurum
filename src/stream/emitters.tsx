import { DataSource, ArrayDataSource } from './data_source';
import { Stream } from './stream';
import { DuplexDataSource } from './duplex_data_source';
import { CancellationToken } from '../utilities/cancellation_token';
import { registerAnimationLoop } from '../utilities/animation_scheduler';

export function intervalEmitter<T = void>(
	target: DataSource<T> | DuplexDataSource<T> | Stream<T, any> | ArrayDataSource<T>,
	interval: number,
	value: T,
	cancellationToken?: CancellationToken
): void {
	(cancellationToken ?? new CancellationToken()).setInterval(() => {
		if (target instanceof ArrayDataSource) {
			target.push(value);
		} else if (target instanceof DuplexDataSource) {
			target.updateDownstream(value);
		} else {
			target.update(value);
		}
	}, interval);
}

export function animate(cb: (progress: number) => void, time: number, cancellationToken: CancellationToken): void {
	const animationToken = new CancellationToken();
	if (cancellationToken) {
		cancellationToken.chain(animationToken);
	}
	let start = Date.now();
	registerAnimationLoop(() => {
		const progress = Math.min(1, time / (Date.now() - start));
		cb(progress);
		if (progress === 1) {
			animationToken.cancel();
		}
	}, animationToken);
}

export function tweenEmitter(
	target: DataSource<number> | DuplexDataSource<number> | Stream<number, any> | ArrayDataSource<number>,
	duration: number,
	startValue: number,
	endValue: number,
	cancellationToken?: CancellationToken
): void {
	animate(
		(progress) => {
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
