import { DataSource } from 'aurumjs';
import { ExampleModel } from '../aurum/examples';

export const acExampleData: ExampleModel[] = [
	{
		title: 'Hello world',
		description: `Basic Hello world example`,
		code: new DataSource(`import {AurumCanvas, AurumText} from 'aurum-canvas'

return function() {
	return <div>Hello from aurum.js
		<AurumCanvas width="300px" height="200px" backgroundColor="black">
			<AurumText fontSize={16} x={10} y={50} fillColor="white">Hello Aurum canvas</AurumText>
		</AurumCanvas>
	</div>
}`)
	},
	{
		title: 'Basic animations',
		description: `Use datasources for animations`,
		code: new DataSource(`import {AurumCanvas, AurumText} from 'aurum-canvas'
import {tweenEmitter, DataSource, dsMap} from 'aurumjs'

return function() {
	const y = new DataSource(20);
	const colorAngle = new DataSource(0)
	y.listen(() => colorAngle.update(colorAngle.value+2))
	goDown(y);

	return <div>Position Y: {y.transform(dsMap(v => Math.floor(v)))}
		<AurumCanvas width="300px" height="200px" backgroundColor="black">
			<AurumText fontSize={16} x={15} y={y} fillColor={colorAngle.transform(dsMap(angle => \`hsl(\${angle},100%,50%)\`))}>Hello Aurum canvas</AurumText>
		</AurumCanvas>
	</div>
}

function goDown(x) {
	tweenEmitter(x, 1500, 20, 200, i => i**2).then(() => goUp(x))
}

function goUp(x) {
	tweenEmitter(x, 3000, 200, 20, i => Math.sin(i*Math.PI/2)).then(() => goDown(x))
}`)
	},
	{
		title: 'Interaction',
		description: `Hover on shapes, click and drag to move `,
		code: new DataSource(`import {AurumCanvas, AurumText, AurumRectangle, AurumRegularPolygon, AurumPath, AurumElipse} from 'aurum-canvas'
import {DataSource} from 'aurumjs'

return function() {
	const translation = new DataSource({x:0,y:0})
	const hover=new DataSource('Nothing');

	return <div>
	<button onClick={() =>translation.update({x:0,y:0})}>Reset Viewport</button>
			Hovering on: {hover}
			<AurumCanvas
			translate={translation}
			onAttach={canvas => canvas.addEventListener('wheel', (e) => e.preventDefault())} features={{
			panning: {
				mouse: true
			}
		}} width="300px" height="300px" backgroundColor="black">
			<AurumText onMouseLeave={() => hover.update('Nothing')} onMouseEnter={() => hover.update('Text')} fontSize={16} x={45} y={50} fillColor="white">Explore!</AurumText>
			<AurumText onMouseLeave={() => hover.update('Nothing')} onMouseEnter={() => hover.update('Text')} fontSize={16} x={75} y={165} fillColor="white">Click and drag to move camera</AurumText>
			<AurumRectangle onMouseLeave={() => hover.update('Nothing')} onMouseEnter={() => hover.update('Rectangle')}  x={150} y={170} width={30} height={45} fillColor="red"></AurumRectangle>
			<AurumPath onMouseLeave={() => hover.update('Nothing')} onMouseEnter={() => hover.update('Path')} path="M150 0 L75 200 L225 200 Z" x={50} y={170} fillColor="blue"></AurumPath>
			<AurumRegularPolygon onMouseLeave={() => hover.update('Nothing')} onMouseEnter={() => hover.update('Heptagon')}  sides={7} radius={70} fillColor="green" x={-50} y={50}></AurumRegularPolygon>
			<AurumElipse onMouseLeave={() => hover.update('Nothing')} onMouseEnter={() => hover.update('Elipse')}  rx={30} ry={60} fillColor="yellow" x={200} y={50}></AurumElipse>
		</AurumCanvas>
	</div>
}
`)
	}
];
