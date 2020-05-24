import { Renderable, AurumElement, aurumElementModelIdentitiy, AurumElementModel, AurumComponentAPI } from './aurum_element';
import { DataSource, ArrayDataSource } from '../stream/data_source';
import { DuplexDataSource } from '../stream/duplex_data_source';
import { CancellationToken } from '../utilities/cancellation_token';

/**
 * @internal
 */
export interface RenderSession {
	attachCalls: Array<() => void>;
	tokens: CancellationToken[];
	sessionToken: CancellationToken;
}

/**
 * @internal
 */
export function render<T extends Renderable>(element: T, session: RenderSession): T extends Array<any> ? any[] : any {
	if (element == undefined) {
		return undefined;
	}

	if (Array.isArray(element)) {
		// Flatten the rendered content into a single array to avoid having to iterate over nested arrays later
		return Array.prototype.concat.apply(
			[],
			element.map((e) => render(e, session))
		);
	}

	if (element instanceof DataSource || element instanceof DuplexDataSource || element instanceof ArrayDataSource) {
		const result = new AurumElement(element as any, createAPI(session));

		return result as any;
	}

	const type = typeof element;
	if (type === 'string' || type === 'number' || type === 'bigint') {
		return document.createTextNode(element.toString()) as any;
	}

	if (element[aurumElementModelIdentitiy]) {
		const model: AurumElementModel<any> = (element as any) as AurumElementModel<any>;
		return render(model.factory(model.props || {}, model.children, createAPI(session)), session);
	}
	// Unsupported types are returned as is in hope that a transclusion component will transform it into something compatible
	return element as any;
}

/**
 * @internal
 */
export function createAPI(session: RenderSession): AurumComponentAPI {
	let token: CancellationToken = undefined;
	return {
		onAttach: (cb) => {
			session.attachCalls.push(cb);
		},
		onDetach: (cb) => {
			if (!token) {
				token = new CancellationToken();
				session.tokens.push(token);
			}
			token.addCancelable(cb);
		},
		onError: (cb) => {
			throw new Error('not implemented');
		},
		get cancellationToken() {
			if (!token) {
				token = new CancellationToken();
				session.tokens.push(token);
			}
			return token;
		},
		prerender(target: Renderable | Renderable[]) {
			return render(target, session);
		}
	};
}
