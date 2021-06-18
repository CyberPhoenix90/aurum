const { assert } = chai;
import { Container } from 'aurum-game-engine';
import { Aurum, DataSource } from 'aurumjs';
import { renderRoot } from '../main';

describe('position', () => {
	afterEach(() => {
		renderRoot.update(undefined);
	});

	it('default position', () => {
		renderRoot.update(
			<Container
				onAttach={(c) => {
					assert.deepEqual(c.getAbsolutePosition(), { x: 0, y: 0 });
				}}
			></Container>
		);
	});

	it('position', () => {
		renderRoot.update(
			<Container
				x={6}
				y={10}
				onAttach={(c) => {
					assert.deepEqual(c.getAbsolutePosition(), { x: 6, y: 10 });
				}}
			></Container>
		);
	});

	it('relative position', () => {
		renderRoot.update(
			<Container x={6} y={10}>
				<Container
					x={9}
					y={7}
					onAttach={(c) => {
						assert.deepEqual(c.getAbsolutePosition(), { x: 15, y: 17 });
						assert.deepEqual(c.resolvedModel.x.value, 9);
						assert.deepEqual(c.resolvedModel.y.value, 7);
					}}
				></Container>
			</Container>
		);
	});

	it('position with origin', () => {
		renderRoot.update(
			<Container
				x={6}
				y={10}
				width={50}
				height={20}
				originX={0.5}
				originY={0.5}
				onAttach={(c) => {
					assert.deepEqual(c.getAbsolutePosition(), { x: -19, y: 0 });
				}}
			></Container>
		);
	});

	it('relative position with origin', () => {
		renderRoot.update(
			<Container x={6} y={10} width={50} height={20} originX={0.5} originY={0.5}>
				<Container
					x={9}
					y={7}
					onAttach={(c) => {
						assert.deepEqual(c.getAbsolutePosition(), { x: -10, y: 7 });
						assert.deepEqual(c.resolvedModel.x.value, 9);
						assert.deepEqual(c.resolvedModel.y.value, 7);
					}}
				></Container>
			</Container>
		);
	});

	it('relative position with percentage', () => {
		renderRoot.update(
			<Container x={6} y={10} width={50} height={20}>
				<Container
					x="50%"
					y="50%"
					onAttach={(c) => {
						assert.deepEqual(c.getAbsolutePosition(), { x: 31, y: 20 });
						assert.deepEqual(c.renderState.x.value, 25);
						assert.deepEqual(c.renderState.y.value, 10);
					}}
				></Container>
			</Container>
		);
	});

	it('relative position with calc', () => {
		renderRoot.update(
			<Container x={6} y={10} width={50} height={20}>
				<Container
					x="(50% - 10px)"
					y="(50% - 20px)"
					onAttach={(c) => {
						assert.deepEqual(c.getAbsolutePosition(), { x: 21, y: 0 });
						assert.deepEqual(c.renderState.x.value, 15);
						assert.deepEqual(c.renderState.y.value, -10);
					}}
				></Container>
			</Container>
		);
	});

	it('relative position with percent and change', () => {
		const w = new DataSource(20);
		const h = new DataSource(10);
		renderRoot.update(
			<Container x={6} y={10} width={w} height={h}>
				<Container
					x="50%"
					y="50%"
					onAttach={(c) => {
						assert.deepEqual(c.getAbsolutePosition(), { x: 16, y: 15 });
						assert.deepEqual(c.renderState.x.value, 10);
						assert.deepEqual(c.renderState.y.value, 5);

						w.update(50);
						h.update(20);

						assert.deepEqual(c.getAbsolutePosition(), { x: 31, y: 20 });
						assert.deepEqual(c.renderState.x.value, 25);
						assert.deepEqual(c.renderState.y.value, 10);
					}}
				></Container>
			</Container>
		);
	});

	it('relative position with percent and origin', () => {
		renderRoot.update(
			<Container x={6} y={10} width={50} height={20} originX={0.5} originY={0.5}>
				<Container
					x="50%"
					y="50%"
					onAttach={(c) => {
						assert.deepEqual(c.getAbsolutePosition(), { x: 6, y: 10 });
						assert.deepEqual(c.renderState.x.value, 25);
						assert.deepEqual(c.renderState.y.value, 10);
					}}
				></Container>
			</Container>
		);
	});
});
