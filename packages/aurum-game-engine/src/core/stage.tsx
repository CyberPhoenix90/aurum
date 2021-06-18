import { ArrayDataSource, Aurum, AurumComponentAPI, createRenderSession, DataSource, EventEmitter, Renderable, Webcomponent } from 'aurumjs';
import { CameraGraphNode } from '../entities/types/camera/api';
import { Clock } from '../game_features/time/clock';
import { ArrayDataSourceSceneGraphNode, DataSourceSceneGraphNode, SceneGraphNode } from '../models/scene_graph';
import { AbstractRenderPlugin } from '../rendering/abstract_render_plugin';
import { _ } from '../utilities/other/streamline';
import { activeCameras } from './active_cameras';
import { render } from './custom_aurum_renderer';

export let engineRootTime: DataSource<number> = new DataSource(0);

requestAnimationFrame((time) => {
	engineRootTime.update(engineRootTime.value + time);
});

export interface StageProps {
	clock?: Clock;
	renderPlugin: AbstractRenderPlugin;
}

export let engineClock: Clock;

const StageComponent = Webcomponent(
	{
		name: 'aurum-stage'
	},
	(
		props: { renderPlugin: AbstractRenderPlugin; nodes: Array<SceneGraphNode<any> | DataSource<Renderable> | ArrayDataSource<Renderable>>; clock: Clock },
		api: AurumComponentAPI
	) => {
		const stageId = _.getUId();
		const cameras: CameraGraphNode[] = props.nodes.filter((n) => n instanceof CameraGraphNode) as CameraGraphNode[];
		const clock = (engineClock = props.clock);
		let running = true;
		clock.start = () => (running = true);
		clock.stop = () => (running = false);

		function attachNodes(renderPlugin: AbstractRenderPlugin, nodes: Array<SceneGraphNode<any> | DataSource<Renderable> | ArrayDataSource<Renderable>>) {
			for (let i = 0; i < nodes.length; i++) {
				let node = nodes[i];
				if (node instanceof Promise) {
					node = new DataSourceSceneGraphNode(new DataSource(node));
				} else if (node instanceof DataSource) {
					node = new DataSourceSceneGraphNode(node);
				} else if (node instanceof ArrayDataSource) {
					node = new ArrayDataSourceSceneGraphNode(node);
				} else if (!(node instanceof SceneGraphNode)) {
					throw new Error(`Unhandled node type`);
				}

				node.attachToStage(renderPlugin, stageId);
			}
		}

		return (
			<div
				onAttach={(stageNode) => {
					activeCameras.appendArray(cameras);
					props.renderPlugin.addStage(stageId, stageNode);
					attachNodes(props.renderPlugin, props.nodes);
					let lastBefore = clock.timestamp;
					let lastAfter = clock.timestamp;
					let lastTick = Date.now();
					api.cancellationToken.animationLoop(() => {
						let clockDelta = Date.now() - lastTick;
						if (running) {
							clock.update(clockDelta);
						}
						lastTick += clockDelta;
						let delta = clock.timestamp - lastBefore;
						lastBefore += delta;
						onBeforeRender.fire(delta);
						for (const camera of cameras) {
							props.renderPlugin.renderStage(stageId, camera.uid);
						}

						clockDelta = Date.now() - lastTick;
						if (running) {
							clock.update(clockDelta);
						}
						lastTick += clockDelta;
						delta = clock.timestamp - lastAfter;
						lastAfter += delta;
						onAfterRender.fire(delta);
					});
				}}
			></div>
		);
	}
);

export const onBeforeRender: EventEmitter<number> = new EventEmitter();
export const onAfterRender: EventEmitter<number> = new EventEmitter();

export function Stage(props: StageProps, children: Renderable[], api: AurumComponentAPI): Renderable {
	const rs = createRenderSession();
	const nodes = render(children, rs);
	api.onAttach(() => {
		rs.attachCalls.forEach((ac) => ac());
	});
	api.onDetach(() => {
		rs.sessionToken.cancel();
	});

	props.clock?.stop();
	return (
		<StageComponent
			clock={
				props.clock ??
				new Clock({
					autoStart: false,
					speed: 1,
					timestamp: 0
				})
			}
			renderPlugin={props.renderPlugin}
			nodes={nodes}
		></StageComponent>
	);
}
