import { ArrayDataSource, Aurum, AurumComponentAPI, createRenderSession, DataSource, EventEmitter, MapDataSource, Renderable, Webcomponent } from 'aurumjs';
import { entityDefaults } from '../entities/entity_defaults.js';
import { CameraGraphNode } from '../entities/types/camera/api.js';
import { containerDefaultModel } from '../entities/types/container/container_entity.js';
import { Clock } from '../game_features/time/clock.js';
import { ContainerGraphNode, SceneGraphNode } from '../models/scene_graph.js';
import { AbstractRenderPlugin } from '../rendering/abstract_render_plugin.js';
import { _ } from '../utilities/other/streamline.js';
import { activeCameras } from './active_cameras.js';
import { render } from './custom_aurum_renderer.js';
import { initializeLayoutEngine } from './layout_engine.js';

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
            const root = new ContainerGraphNode({
                name: 'root',
                children: new ArrayDataSource(nodes as any),
                components: new MapDataSource(),
                cancellationToken: api.cancellationToken,
                models: {
                    coreDefault: entityDefaults,
                    appliedStyleClasses: new ArrayDataSource(),
                    entityTypeDefault: containerDefaultModel,
                    userSpecified: {}
                }
            });

            initializeLayoutEngine(root, api.cancellationToken);

            root.attachToStage(renderPlugin, stageId);
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
