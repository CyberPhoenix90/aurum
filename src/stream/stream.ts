import { CancellationToken } from '../utilities/cancellation_token';
import { Callback, ThenArg } from '../utilities/common';
import { DataSource, ReadOnlyDataSource } from './data_source';

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

	public await<R extends ThenArg<O>>(cancellationToken?: CancellationToken): Stream<I, R> {
		return new Stream(this.input, this.output.await(cancellationToken));
	}

	public awaitLatest<R extends ThenArg<O>>(cancellationToken?: CancellationToken): Stream<I, R> {
		return new Stream(this.input, this.output.awaitLatest(cancellationToken));
	}
	public awaitOrdered<R extends ThenArg<O>>(cancellationToken?: CancellationToken): Stream<I, R> {
		return new Stream(this.input, this.output.awaitOrdered(cancellationToken));
	}

	public cancelAll(): void {
		this.input.cancelAll();
		this.output.cancelAll();
	}
}
