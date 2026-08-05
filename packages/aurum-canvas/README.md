Aurum-style scene graph management for Canvas 2D.

Import the HTML-hosted component from `@aurum/canvas`. Renderer integrations that do not need an HTML intrinsic element can import the scene model, draw functions, drawable components, and `AurumOffscreenCanvas` from `@aurum/canvas/core`. The core entry point depends on `@aurum/rendering`; the HTML host is isolated in the main entry point.

Allows creating canvas drawings using familar concepts from Aurum.js
Supports data sources for all attributes and dynamic scene graphs with array data sources

```
<AurumCanvas width="200" height="200">
	<AurumRectangle x={a} y={20} fillColor="red" width={20} height={20}>
		<AurumRectangle x={20} y={a} fillColor="blue" width={20} height={20}></AurumRectangle>
	</AurumRectangle>
	<AurumRectangle x={50} y={50} fillColor="green" width={20} height={20}></AurumRectangle>
	<AurumText x={10} y={10} fillColor="black">
		{name}
	</AurumText>
</AurumCanvas>

```

## Verification and performance

`npm test -w @aurum/canvas` runs the browser-backed Canvas 2D behavior suite. `npm run benchmark -w @aurum/canvas` runs a repeatable CPU baseline for resolving and drawing 1,000 and 10,000 rectangle scene nodes. Benchmark numbers are machine-dependent; compare results on the same machine and runtime when evaluating renderer changes.

Create canvas components just the way you create any aurum component:

```
function Triangle(props: { x: number; y: number }) {
	const { x, y } = props;

	return (
		<AurumGroup x={x} y={y}>
			<AurumLine lineWidth={3} strokeColor="red" x={0} y={0} tx={30} ty={30}></AurumLine>
			<AurumLine lineWidth={3} strokeColor="red" x={30} y={30} tx={-30} ty={30}></AurumLine>
			<AurumLine lineWidth={3} strokeColor="red" x={-30} y={30} tx={0} ty={0}></AurumLine>
		</AurumGroup>
	);
}

```


Reuse components that weren't even intended for use in the canvas:
```
<AurumCanvas width="200" height="200">
	<Switch state={triangular}>
		<SwitchCase when={true}>
			<Triangle x={50} y={50}></Triangle>
		</SwitchCase>
		<SwitchCase when={false}>
			<AurumRectangle x={50} y={50} fillColor="green" width={20} height={20}></AurumRectangle>
		</SwitchCase>
	</Switch>
</AurumCanvas>
```

Declarative animation and interaction support
```
<AurumCanvas width="400" height="200">
	<AurumRectangle
		onMouseDown={(e, target) => {
			state.update('highlight');
		}}
		state={state}
		strokeColor="red"
		x={0}
		y={0}
		width={30}
		height={30}
	>
		<State opacity={1} id="highlight" width={300} transitionTime={2000}></State>
	</AurumRectangle>
</AurumCanvas>

```
