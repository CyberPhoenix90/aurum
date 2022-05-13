import { EntityModel } from '../../core/entity';

export abstract class AbstractRenderPlugin {
    public abstract createRootNode(): HTMLElement;

    public abstract dispose(): void | Promise<void>;

    public abstract addStage(stageId: number, stageNode: HTMLElement): void | Promise<void>;
    public abstract removeStage(stageId: number): void | Promise<void>;
    public abstract renderStage(stageId: number, cameraId: number): void | Promise<void>;

    public abstract addNode(payload: EntityModel, stageId: number, index?: number): void | Promise<void>;
    public abstract removeNode(uid: number, stageId: number): void | Promise<void>;
    public abstract swapNodes(nodeIdA: number, nodeIdB: number): void | Promise<void>;
}
