const { assert } = chai;
import {
	ArrayDataSourceSceneGraphNode,
	Canvas,
	CanvasGraphNode,
	Container,
	ContainerGraphNode,
	DataSourceSceneGraphNode,
	Label,
	LabelGraphNode
} from 'aurum-game-engine';
import { ArrayDataSource, Aurum, DataSource } from 'aurumjs';
import { renderRoot } from '../main';

describe('rendering', () => {
	afterEach(() => {
		renderRoot.update(undefined);
	});

	it('synchronous attach', () => {
		let attached = false;
		renderRoot.update(
			<Container
				onAttach={(c) => {
					attached = true;
				}}
			></Container>
		);

		assert(attached);
	});

	it('should correctly render static nodes', () => {
		renderRoot.update(
			<Container
				onAttach={(c) => {
					assert(c.children.length.value === 3);
					assert(c.processedChildren.length.value === 3);
					assert(c.processedChildren.get(0) instanceof ContainerGraphNode);
					assert(c.processedChildren.get(1) instanceof ContainerGraphNode);
					assert(c.processedChildren.get(2) instanceof CanvasGraphNode);
				}}
			>
				<Container />
				<Container />
				<Canvas paintOperations={[]} />
			</Container>
		);
	});

	it('should correctly render data sources', () => {
		const source = new DataSource(<Container></Container>);

		renderRoot.update(
			<Container
				onAttach={(c) => {
					assert(c.children.length.value === 1);
					assert(c.processedChildren.length.value === 1);
					assert(c.processedChildren.get(0).processedChildren.length.value === 1);
					assert(c.processedChildren.get(0) instanceof DataSourceSceneGraphNode);
					assert(c.processedChildren.get(0).processedChildren.get(0) instanceof ContainerGraphNode);
				}}
			>
				{source}
			</Container>
		);
	});

	it('should correctly respond to data source changes', () => {
		const source = new DataSource(<Container></Container>);

		renderRoot.update(
			<Container
				onAttach={(c) => {
					assert(c.children.length.value === 1);
					assert(c.processedChildren.length.value === 1);
					assert(c.processedChildren.get(0).processedChildren.length.value === 1);
					assert(c.processedChildren.get(0) instanceof DataSourceSceneGraphNode);
					assert(c.processedChildren.get(0).processedChildren.get(0) instanceof ContainerGraphNode);

					source.update(<Canvas></Canvas>);
					assert(c.processedChildren.get(0).processedChildren.length.value === 1);
					assert(c.processedChildren.get(0).processedChildren.get(0) instanceof CanvasGraphNode);

					source.update(null);
					assert(c.processedChildren.get(0).processedChildren.length.value === 0);

					source.update(<Canvas></Canvas>);
					assert(c.processedChildren.get(0).processedChildren.length.value === 1);
					assert(c.processedChildren.get(0).processedChildren.get(0) instanceof CanvasGraphNode);

					source.update([<Container />, <Canvas></Canvas>]);
					assert(c.processedChildren.get(0).processedChildren.length.value === 2);
					assert(c.processedChildren.get(0).processedChildren.get(0) instanceof ContainerGraphNode);
					assert(c.processedChildren.get(0).processedChildren.get(1) instanceof CanvasGraphNode);
				}}
			>
				{source}
			</Container>
		);
	});

	it('should correctly render array data sources', () => {
		const source = new ArrayDataSource([<Container></Container>]);

		renderRoot.update(
			<Container
				onAttach={(c) => {
					assert(c.children.length.value === 1);
					assert(c.processedChildren.length.value === 1);
					assert(c.processedChildren.get(0).processedChildren.length.value === 1);
					assert(c.processedChildren.get(0) instanceof ArrayDataSourceSceneGraphNode);
					assert(c.processedChildren.get(0).processedChildren.get(0) instanceof ContainerGraphNode);
				}}
			>
				{source}
			</Container>
		);
	});

	it('should correctly respond to array data source changes', () => {
		const source = new ArrayDataSource([<Container></Container>]);

		renderRoot.update(
			<Container
				onAttach={(c) => {
					assert(c.children.length.value === 1);
					assert(c.processedChildren.length.value === 1);
					assert(c.processedChildren.get(0).processedChildren.length.value === 1);
					assert(c.processedChildren.get(0) instanceof ArrayDataSourceSceneGraphNode);
					assert(c.processedChildren.get(0).processedChildren.get(0) instanceof ContainerGraphNode);

					source.push(<Canvas></Canvas>);
					assert(c.processedChildren.get(0).processedChildren.length.value === 2);
					assert(c.processedChildren.get(0).processedChildren.get(1) instanceof CanvasGraphNode);

					source.push(<Canvas></Canvas>, <Container />);
					assert(c.processedChildren.get(0).processedChildren.length.value === 4);
					assert(c.processedChildren.get(0).processedChildren.get(3) instanceof ContainerGraphNode);

					source.removeAt(1);
					assert(c.processedChildren.get(0).processedChildren.length.value === 3);
					assert(c.processedChildren.get(0).processedChildren.get(2) instanceof ContainerGraphNode);

					source.swap(0, 1);
					assert(c.processedChildren.get(0).processedChildren.length.value === 3);
					assert(c.processedChildren.get(0).processedChildren.get(0) instanceof CanvasGraphNode);

					source.insertAt(1, <Label></Label>);
					assert(c.processedChildren.get(0).processedChildren.length.value === 4);
					assert(c.processedChildren.get(0).processedChildren.get(1) instanceof LabelGraphNode);

					source.clear();
					assert(c.processedChildren.get(0).processedChildren.length.value === 0);
				}}
			>
				{source}
			</Container>
		);
	});
});
