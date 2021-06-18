// import { CancellationToken } from 'aurumjs';

import { CancellationToken, DataSource } from 'aurumjs';
import { PointLike } from '../../models/point';

class AurumTouch {
	public get touches(): TouchList {
		return this.touchesSource.value;
	}
	private cancellationToken: CancellationToken;
	private touchesSource: DataSource<TouchList>;

	constructor() {
		this.touchesSource = new DataSource();
		this.cancellationToken = new CancellationToken();

		this.cancellationToken.registerDomEvent(document, 'touchstart', (e: any) => {
			this.touchesSource.update(e.touches);
		});
		this.cancellationToken.registerDomEvent(document, 'touchend', (e: any) => {
			this.touchesSource.update(e.touches);
		});
		this.cancellationToken.registerDomEvent(document, 'touchmove', (e: any) => {
			this.touchesSource.update(e.touches);
		});
		this.cancellationToken.registerDomEvent(document, 'touchcancel', (e: any) => {
			this.touchesSource.update(e.touches);
		});
	}

	/**
	 * Index refers to the how manyeth touch you are listening for
	 */
	public listenTouch(index: number, cancellationToken?: CancellationToken): DataSource<Touch> {
		const result = new DataSource<Touch>();

		this.touchesSource.listen((ts) => {
			if (ts.length > index) {
				result.update(ts[index]);
			}
		}, cancellationToken);

		return result;
	}

	/**
	 * Index refers to the how manyeth touch you are listening for
	 */
	public listenTouched(index: number, cancellationToken?: CancellationToken): DataSource<boolean> {
		const result = new DataSource<boolean>();
		let tracking;

		this.touchesSource.listen((ts) => {
			if (tracking && ts[index]?.identifier !== tracking) {
				tracking = undefined;
				result.update(false);
			}
			if (ts.length > index && !result.value) {
				tracking = ts[index].identifier;
				result.update(true);
			}
		}, cancellationToken);

		return result;
	}

	public listenTouchMove(index: number, cancellationToken?: CancellationToken): DataSource<PointLike> {
		const result = new DataSource<PointLike>();
		let tracking;

		this.touchesSource.listen((ts) => {
			if (tracking && ts[index]?.identifier !== tracking) {
				tracking = undefined;
			}
			if (ts.length > index) {
				tracking = ts[index].identifier;
				if (result.value.x !== ts[index].clientX || result.value.y !== ts[index].clientY) {
					result.update({ x: ts[index].clientX, y: ts[index].clientY });
				}
			}
		}, cancellationToken);

		return result;
	}

	public dispose(): void {
		this.cancellationToken.cancel();
	}
}

export const aurumTouch = new AurumTouch();
