import { DataSource } from './stream/data_source';
import { EventEmitter } from './utilities/event_emitter';

export let debugMode: boolean = false;
export let diagnosticMode: boolean = false;

const customWindow: Window & {
	__debugUpdates: EventEmitter<{
		source: SerializedStreamData;
		newValue: any;
		stack: string;
	}>;
	__debugNewSource: EventEmitter<{
		source: SerializedStreamData;
	}>;
	__debugLinked: EventEmitter<{
		parent: SerializedStreamData;
		child: SerializedStreamData;
	}>;
	__debugUnlinked: EventEmitter<{
		parent: SerializedStreamData;
		child: SerializedStreamData;
	}>;
	__debugGetStreamData: () => SerializedStreamData[];
} = globalThis as any;

let debugStreamData;

export function enableDiagnosticMode(): void {
	diagnosticMode = true;
}

/**
 * Initializes the debug features of aurum. Required for the use of aurum devtools
 * Run this function before creating any streams or any aurum components for best results
 * Enabling this harms performance and breaks backwards compatibility with some browsers
 * Do not enable in production
 */
export function enableDebugMode(): void {
	debugStreamData = [];
	debugMode = true;
	setInterval(() => garbageCollect(), 60000);
	customWindow.__debugUpdates = new EventEmitter();
	customWindow.__debugNewSource = new EventEmitter();
	customWindow.__debugLinked = new EventEmitter();
	customWindow.__debugUnlinked = new EventEmitter();
	customWindow.__debugGetStreamData = () => debugStreamData.map(serializeStreamData);
}

function serializeStreamData(ref: StreamData): SerializedStreamData {
	let serializedValue: string;

	try {
		serializedValue = JSON.stringify(ref.value);
	} catch (e) {
		serializedValue = '[Unserializable]';
	}

	return {
		name: ref.name,
		value: serializedValue,
		children: ref.children,
		consumers: ref.consumers,
		id: ref.id,
		parents: ref.parents,
		stack: ref.stack,
		timestamp: ref.timestamp
	};
}

export function debugRegisterStream(stream: DataSource<any>, stack: string) {
	const ref: StreamData = {
		name: stream.name,
		value: stream.value,
		id: Math.random(),
		children: [],
		parents: [],
		stack,
		timestamp: Date.now(),
		reference: new WeakRef(stream),
		consumers: []
	};
	debugStreamData.push(ref);
	customWindow.__debugNewSource.fire({
		source: serializeStreamData(ref)
	});
}

export function debugRegisterLink(parent: DataSource<any>, child: DataSource<any>) {
	let pref = findDataByRef(parent);
	let cref = findDataByRef(child);

	if (!pref) {
		throw new Error('illegal state');
	}
	if (!cref) {
		throw new Error('illegal state');
	}

	pref.children.push(cref.id);
	cref.parents.push(pref.id);
	customWindow.__debugLinked.fire({
		child: serializeStreamData(cref),
		parent: serializeStreamData(pref)
	});
}

export function debugRegisterUnlink(parent: DataSource<any>, child: DataSource<any>) {
	let pref = findDataByRef(parent);
	let cref = findDataByRef(child);

	if (!pref) {
		throw new Error('illegal state');
	}
	if (!cref) {
		throw new Error('illegal state');
	}

	const cindex = pref.children.indexOf(cref.id);
	if (cindex === -1) {
		throw new Error('illegal state');
	}
	pref.children.splice(cindex, 1);

	const pindex = cref.parents.indexOf(pref.id);
	if (pindex === -1) {
		throw new Error('illegal state');
	}
	cref.parents.splice(cindex, 1);

	customWindow.__debugUnlinked.fire({
		child: serializeStreamData(cref),
		parent: serializeStreamData(pref)
	});
}

export function debugDeclareUpdate(source: DataSource<any>, value: any, stack: string): void {
	let ref = findDataByRef(source);
	if (!ref) {
		throw new Error('illegal state');
	}

	ref.value = source.value;
	customWindow.__debugUpdates.fire({
		newValue: value,
		source: serializeStreamData(ref),
		stack
	});
}

export function debugRegisterConsumer(stream: DataSource<any>, consumer: string, consumerStack: string) {
	let ref = findDataByRef(stream);

	if (!ref) {
		throw new Error('illegal state');
	}

	ref.consumers.push({
		code: consumer,
		stack: consumerStack
	});
}

function garbageCollect(): void {
	debugStreamData = debugStreamData.filter((dsd) => dsd.reference.deref() !== undefined);
}

function findDataByRef(target: DataSource<any>): StreamData {
	return debugStreamData.find((dsd) => dsd.reference.deref() === target);
}

export type SerializedStreamData = Omit<StreamData, 'reference'>;
export interface StreamData {
	name: string;
	id: number;
	value: any;
	reference: WeakRef<DataSource<any>>;
	parents: number[];
	stack: string;
	timestamp: number;
	children: number[];
	consumers: {
		code: string;
		stack: string;
	}[];
}

declare class WeakRef<T> {
	constructor(item: T);
	public deref(): T | undefined;
}
