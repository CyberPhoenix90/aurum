import { AbstractRenderPlugin, CommonEntity, SceneGraphNode } from 'aurum-game-engine';
import { NoRenderEntity } from './render/pixi_no_render_entity.js';
import { RenderStage } from './render/pixi_render_stage.js';

export { enableTilemap } from './render/pixi_render_map_entity.js';

export class PixiJsRenderAdapter extends AbstractRenderPlugin {
    private stages: { [id: number]: RenderStage };
    private entityDatabase: { [id: string]: NoRenderEntity } = {};

    constructor() {
        super();
        this.stages = {};
    }

    public createRootNode(): HTMLElement {
        return document.createElement('canvas');
    }

    public dispose(): void | Promise<void> {
        throw new Error('Method not implemented.');
    }

    public renderStage(stageId: number, cameraId: number): void | Promise<void> {
        this.stages[stageId].render(cameraId);
    }

    public removeStage(stageId: number): void | Promise<void> {
        throw new Error('Method not implemented.');
    }

    public addStage(stageId: number, stageNode: HTMLElement): void | Promise<void> {
        this.stages[stageId] = new RenderStage(stageId, this.entityDatabase, stageNode);
    }

    public addNode(model: SceneGraphNode<CommonEntity>, stageId: number, index?: number): void | Promise<void> {
        this.stages[stageId].addNode(model, index);
    }

    public removeNode(id: number, stageId: number): void | Promise<void> {
        this.stages[stageId].removeNode(id);
    }

    public swapNodes(nodeIdA, nodeIdB) {
        const nodeA = this.entityDatabase[nodeIdA] as NoRenderEntity;
        const nodeB = this.entityDatabase[nodeIdB] as NoRenderEntity;
        if (nodeA && nodeB && nodeA.parent === nodeB.parent) {
            const indexA = nodeA.parent.children.indexOf(nodeA);
            const indexB = nodeA.parent.children.indexOf(nodeB);
            nodeA.parent.children[indexA] = nodeB;
            nodeA.parent.children[indexB] = nodeA;
            nodeA.parent.displayObject.swapChildren(nodeA.displayObject, nodeB.displayObject);
        } else {
            throw new Error(`illegal state: trying to swap 2 nodes that don't have the same parent`);
        }
    }
}
