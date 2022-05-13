import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    createRenderSession,
    DataSource,
    EventEmitter,
    MapDataSource,
    ReadOnlyArrayDataSource,
    ReadOnlyDataSource,
    Renderable,
    Webcomponent
} from 'aurumjs';
import { Camera2DData } from '../builtins/traits/camera2D_data';
import { Clock } from '../game_features/time/clock';
import { AbstractRenderPlugin } from '../graphics/rendering/abstract_render_plugin';
import { _ } from '../utilities/streamline';
import { render } from './custom_aurum_renderer';
import { EntityModel } from './entity';
import { getAllWithLive } from './query';

export interface StageProps {
    clock?: Clock;
    renderPlugin: AbstractRenderPlugin;
}

export let engineClock: Clock;

const StageComponent = Webcomponent(
    {
        name: 'aurum-stage'
    },
    (props: { renderPlugin: AbstractRenderPlugin; nodes: ReadOnlyArrayDataSource<EntityModel>; clock: Clock }, api: AurumComponentAPI) => {
        const stageId = _.getUId();
        const cameras = getAllWithLive(api.cancellationToken, Camera2DData);
        const clock = (engineClock = props.clock);
        let running = true;
        clock.start = () => (running = true);
        clock.stop = () => (running = false);

        function attachNodes(renderPlugin: AbstractRenderPlugin, nodes: ReadOnlyDataSource<EntityModel>) {
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

            // initializeLayoutEngine(root, api.cancellationToken);

            root.attachToStage(renderPlugin, stageId);
        }

        return (
            <div
                onAttach={(stageNode) => {
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
    const nodes: ReadOnlyArrayDataSource<EntityModel> = ArrayDataSource.fromMultipleSources<EntityModel>(render(children, rs));
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
