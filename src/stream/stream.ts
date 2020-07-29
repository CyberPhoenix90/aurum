import { DataSourceOperator } from './data_source_operators';
import { CancellationToken } from '../utilities/cancellation_token';
import { Callback } from '../utilities/common';
import { DataSource, processTransform, ReadOnlyDataSource } from './data_source';

/**
 * Lets you logically combine 2 data sources so that update calls go through the input source and listen goes to the output source
 */
export class Stream<I, O = I> implements ReadOnlyDataSource<O> {
	private input: DataSource<I>;
	private output: DataSource<O>;
	/**
	 * The current value of this data source, can be changed through update
	 */
	public get value(): O {
		return this.output.value;
	}

	constructor(inputSource?: DataSource<I>, outputSource?: DataSource<O>) {
		this.input = inputSource ?? new DataSource();
		this.output = outputSource ?? (this.input as any);
	}

	public update(data: I): void {
		this.input.update(data);
	}

	public transform<A, B = A, C = B, D = C, E = D, F = E, G = F, H = G, Z = H, J = Z, K = J>(
		operationA: DataSourceOperator<O, A>,
		operationB?: DataSourceOperator<A, B> | CancellationToken,
		operationC?: DataSourceOperator<B, C> | CancellationToken,
		operationD?: DataSourceOperator<C, D> | CancellationToken,
		operationE?: DataSourceOperator<D, E> | CancellationToken,
		operationF?: DataSourceOperator<E, F> | CancellationToken,
		operationG?: DataSourceOperator<F, G> | CancellationToken,
		operationH?: DataSourceOperator<G, H> | CancellationToken,
		operationI?: DataSourceOperator<H, Z> | CancellationToken,
		operationJ?: DataSourceOperator<Z, J> | CancellationToken,
		operationK?: DataSourceOperator<J, K> | CancellationToken,
		cancellationToken?: CancellationToken
	): Stream<I, K> {
		let token;
		const operations = [
			operationA,
			operationB,
			operationC,
			operationD,
			operationE,
			operationF,
			operationG,
			operationH,
			operationI,
			operationJ,
			operationK
		].filter((e) => e && (e instanceof CancellationToken ? ((token = e), false) : true));
		if (cancellationToken) {
			token = cancellationToken;
		}
		const result = new DataSource<K>();
		this.listen(processTransform<O, K>(operations as any, result), token);

		return new Stream(this.input, result);
	}

	public listen(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void> {
		return this.output.listen(callback, cancellationToken);
	}

	public listenAndRepeat(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void> {
		return this.output.listenAndRepeat(callback, cancellationToken);
	}

	public listenOnce(callback: Callback<O>, cancellationToken?: CancellationToken): Callback<void> {
		return this.output.listenOnce(callback, cancellationToken);
	}

	public filter(callback: (newValue: O, oldValue: O) => boolean, cancellationToken?: CancellationToken): Stream<I, O> {
		return new Stream(this.input, this.output.filter(callback, cancellationToken));
	}

	public unique(cancellationToken?: CancellationToken): Stream<I, O> {
		return new Stream(this.input, this.output.unique(cancellationToken));
	}

	public map<D>(callback: (value: O) => D, cancellationToken?: CancellationToken): Stream<I, D> {
		return new Stream(this.input, this.output.map(callback, cancellationToken));
	}

	public reduce(reducer: (p: O, c: O) => O, initialValue: O, cancellationToken?: CancellationToken): Stream<I, O> {
		return new Stream(this.input, this.output.reduce(reducer, initialValue, cancellationToken));
	}

	public awaitNextUpdate(cancellationToken?: CancellationToken): Promise<O> {
		return this.output.awaitNextUpdate(cancellationToken);
	}

	public cancelAll(): void {
		this.input.cancelAll();
		this.output.cancelAll();
	}
}
