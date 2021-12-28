import { Aurum, CancellationToken, DataSource, dsDebounce, dsMap, dsUnique } from 'aurumjs';
declare const Babel: any;
declare const r: any;

export interface ExampleModel {
	title: string;
	description: string;
	code: DataSource<string>;
}

export const exampleData: ExampleModel[] = [
	{
		title: 'Hello world',
		description: `Basic Hello world example`,
		code: new DataSource(`return function() {
	return <div>Hello world</div>
}`)
	},
	{
		title: 'Rendering lists',
		description: `List of items synchronized to the data`,
		code: new DataSource(`import { ArrayDataSource } from 'aurumjs'
const items = new ArrayDataSource(['item one', 'item two'])

return function() {
	return <div>{items.map(i => <p>{i}</p>)}
	<button onClick={() => items.push('More')}>Add more</button>
	</div>
}`)
	},
	{
		title: 'Simple timer',
		description: `Updates every second to show how many seconds passed since the execution began`,
		code: new DataSource(`import { DataSource } from 'aurumjs'

return function() {
const seconds = new DataSource(0);

	setInterval(() => {
		seconds.update(seconds.value+1);
	},1000)

	return <div>{seconds}</div>
}`)
	},
	{
		title: 'Conditional rendering',
		description: 'Using data sources to render different branches conditionally',
		code: new DataSource(`import { DataSource } from 'aurumjs'

return function() {
const tabContent = new DataSource(<span>hello Tab 1</span>);

	return (<div>
		<button onClick={() => tabContent.update(<span>hello Tab 1</span>)}>Tab 1</button>
		<button onClick={() => tabContent.update(<span>hello Tab 2</span>)}>Tab 2</button>
		<button onClick={() => tabContent.update(<span>hello Tab 3</span>)}>Tab 3</button>
		{tabContent}
		</div>)
}`)
	},
	{
		title: 'Asynchronous Components',
		description: 'Aurum supports rendering async content. It will simply wait for the promise to resolve and render the resolved value. You can use the Suspense component to render temporary content while waiting for a promise.',
		code: new DataSource(`import { DataSource, Suspense } from 'aurumjs'

function sleep(time) {
	return new Promise((resolve) => {
		setTimeout(resolve,time);
	})
}

async function AsyncComponent({delay}){
	await sleep(delay);
	return <div>I'm ready</div>
}

return function() {
	const content = new DataSource([
		<AsyncComponent delay={1000}></AsyncComponent>,
		<AsyncComponent delay={2000}></AsyncComponent>,
		<AsyncComponent delay={3000}></AsyncComponent>,
		<AsyncComponent delay={4000}></AsyncComponent>,
		<AsyncComponent delay={5000}></AsyncComponent>,
		<Suspense fallback={<div>Waiting...</div>}> <AsyncComponent delay={6000}></AsyncComponent> </Suspense>
	]);

	return (<div>
		{content}
		<button onClick={() => content.update([
			<AsyncComponent delay={1000}></AsyncComponent>,
			<AsyncComponent delay={2000}></AsyncComponent>,
			<AsyncComponent delay={3000}></AsyncComponent>,
			<AsyncComponent delay={4000}></AsyncComponent>,
			<AsyncComponent delay={5000}></AsyncComponent>,
			<Suspense fallback={<div>Waiting...</div>}> <AsyncComponent delay={6000}></AsyncComponent> </Suspense>
		])}>Replay</button>
		</div>)
}`)
	},
	{
		title: 'TODO App',
		description: `Features:
		Double click to edit.
		Drag and drop of items with mouse.
		Enter to add a new item.
		Delete items.
		Filter by done.
		Mark as done.`,
		code: new DataSource(`import { DataSource, ArrayDataSource, Switch, SwitchCase, DefaultSwitchCase, dsMap } from 'aurumjs'

return function Todo() {
	const todoSource = new ArrayDataSource();
	const filteredView = todoSource.filter(() => true);
	const editing = new DataSource();
	let id = 0;
	let draggedNode;

	return (
		<div>
			<input onKeyDown={(e) => {
					if (e.keyCode === 13 && e.target.value) {
						todoSource.push({id: (id++).toString(), done: new DataSource(false), text: new DataSource(e.target.value)});
						e.target.value = '';
					}
				}}
				placeholder="What needs to be done?">
			</input>
			<ul>
				{filteredView.map((model) => {
						let item;
						return (
							<li
								onAttach={(i) => {
									item = i;
									item.model = model;
								}}
								draggable="true"
								onDragStart={() => (draggedNode = item)}
								onDragEnter={(e) => {
									if (draggedNode.parentElement === item.parentElement) {
										todoSource.swapItems(item.model, draggedNode.model);
									}
								}}
								style={model.done.transform(dsMap((done) => (done ? 'color: red;text-decoration: line-through;display: flex;justify-content: space-between;' : 'display: flex;justify-content: space-between;')))}
							>
								<Switch state={editing}>
									<SwitchCase
										when={model.id}>
										<input
										onBlur={() => editing.update(undefined)}
										onAttach={(input) => input.focus()}
										initialValue={model.text.value}
										onKeyDown={(e) => {
											if (e.keyCode === 13) {
												model.text.update(e.target.value);
												editing.update(undefined);
											} else if (e.keyCode === 27) {
												editing.update(undefined);
											}
										}}
										/>
									</SwitchCase>
									<DefaultSwitchCase>
										<div onDblClick={(e) => editing.update(model.id)}>{model.text}</div>
									</DefaultSwitchCase>
								</Switch>
								<span>
									<button onClick={() => model.done.update(!model.done.value)}>
										{model.done.transform(dsMap((done) => (done ? 'Mark as not done' : 'Mark as done')))}
									</button>
									<button onClick={() => {
											if (editing.value === model.id) {
												editing.update(undefined);
											}
											todoSource.remove(model);
										}}>X</button>
								</span>
							</li>
						);
					})}
			</ul>
			<button onClick={() => filteredView.updateFilter(() => true)}>All</button>
			<button onClick={() => filteredView.updateFilter((todo) => todo.done.value)}>Done only</button>
			<button onClick={() => filteredView.updateFilter((todo) => !todo.done.value)}>Not done only</button>
		</div>
	);
}`)
	}
];

function Evaluate(props: { dataSource: DataSource<string>; cancellationToken: CancellationToken }) {
	const { dataSource, cancellationToken } = props;
	return (
		<div>
			{dataSource.transform(
				dsUnique(),
				dsDebounce(1000),
				dsMap((newCode) => <div>{renderCode(newCode)}</div>),
				cancellationToken
			)}
		</div>
	);

	async function renderCode(newCode: string) {
		try {
			const aurumAll = await import('aurumjs');
			const aurumCanvasAll = await import('aurum-canvas');
			const code: string = Babel.transform('(() => {/** @jsx aurum.Aurum.factory */	\n' + replaceImport(newCode) + '})()', {
				presets: ['es2015', 'react']
			}).code;
			return new Function('aurum', 'aurumCanvas', 'return ' + code.substring(code.indexOf('(')))(aurumAll, aurumCanvasAll)();
		} catch (e) {
			return <pre>{(e?.stack ?? e).toString()}</pre>;
		}
	}
}

function replaceImport(code: string): string {
	return code
		.replace(/import\s*{(.*?)}\s*from\s'aurumjs'/g, (substring: string, ...args: any[]) => {
			return `const {${args[0]}} = aurum;`;
		})
		.replace(/import\s*{(.*?)}\s*from\s'aurum-canvas'/g, (substring: string, ...args: any[]) => {
			return `const {${args[0]}} = aurumCanvas;`;
		});
}

export function Examples(props: { examples: ExampleModel[] }) {
	const token = new CancellationToken();
	return (
		<div class="section">
			<div class="row">
				<ul>
					{props.examples.map((data: ExampleModel) => (
						<li class="row">
							<div class="col s12 m3">
								<h5>{data.title}</h5>
								<div>{data.description}</div>
							</div>
							<div class="col s8 m6">
								<div
									style="height:300px;border:1px solid #ccc"
									onAttach={(d: HTMLDivElement) => {
										r(['vs/editor/editor.main'], async function() {
											const aurumdTs = await (await fetch('data/aurum.d.ts')).text();
											const aurumCanvasdTs = await (await fetch('data/aurum-canvas.d.ts')).text();

											//@ts-ignore
											monaco.languages.typescript.javascriptDefaults.addExtraLib([aurumdTs].join('\n'), 'aurum.d.ts');
											//@ts-ignore
											monaco.languages.typescript.javascriptDefaults.addExtraLib([aurumCanvasdTs].join('\n'), 'aurum-canvas.d.ts');

											//@ts-ignore
											const editor = monaco.editor.create(d as HTMLDivElement, {
												value: data.code.value,
												minimap: {
													enabled: false
												},
												theme: 'vs-dark',
												language: 'javascript'
											});

											editor.onKeyUp(() => data.code.update(editor.getValue()));
										});
									}}
								></div>
							</div>
							<div onDetach={() => token.cancel()} class="col s4 m3">
								<div>Result</div>
								<Evaluate dataSource={data.code} cancellationToken={token}></Evaluate>
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
