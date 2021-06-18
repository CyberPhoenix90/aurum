import {
	CameraGraphNode,
	CanvasGraphNode,
	CommonEntity,
	LabelGraphNode,
	RenderableType,
	SceneGraphNode,
	SpriteGraphNode,
	TiledMapGraphNode
} from 'aurum-game-engine';
import { Container } from 'pixi.js';
import { NoRenderEntity } from './pixi_no_render_entity';
import { RenderCameraEntity } from './pixi_render_camera';
import { RenderCanvasEntity } from './pixi_render_canvas_entity';
import { RenderLabelEntity } from './pixi_render_label_entity';
import { RenderMapEntity } from './pixi_render_map_entity';
import { RenderSpriteEntity } from './pixi_render_sprite_entity';
import { RenderTiledSpriteEntity } from './pixi_render_tiled_sprite_entity';

export class RenderStage {
	public readonly id: number;
	public readonly stageNode: HTMLElement;
	private entityDatabase: { [id: string]: NoRenderEntity };
	private rootNode: Container;

	constructor(id: number, entityDatabase: { [id: string]: NoRenderEntity }, stageNode: HTMLElement) {
		this.id = id;

		this.stageNode = stageNode;
		this.rootNode = new Container();

		this.entityDatabase = entityDatabase;
	}

	public addNode(payload: SceneGraphNode<CommonEntity>, index?: number): void {
		const node = this.createRenderNode(payload);
		this.entityDatabase[node.id] = node;
		node.token.addCancelable(() => delete this.entityDatabase[node.id]);

		if (payload.parent.value?.uid !== undefined) {
			const parent: NoRenderEntity = this.entityDatabase[payload.parent.value?.uid] as NoRenderEntity;
			if (index !== undefined) {
				parent.displayObject.addChildAt(node.displayObject, index);
				parent.children.splice(index, 0, node);
			} else {
				parent.displayObject.addChild(node.displayObject);
				parent.children.push(node);
			}
			node.parent = parent;
		} else {
			this.rootNode.addChildAt(node.displayObject, index);
		}
	}

	public removeNode(id: number) {
		const node = this.entityDatabase[id] as NoRenderEntity;
		if (!node) {
			return;
		}

		if (!node.parent) {
			node.parent.children.splice(
				node.parent.children.findIndex((c) => c.id === id),
				1
			);
		}
		node.dispose();
		node.token.cancel();
	}

	private createRenderNode(model: SceneGraphNode<CommonEntity>): NoRenderEntity {
		switch (model.renderState.renderableType) {
			case RenderableType.NO_RENDER:
				return new NoRenderEntity(model);
			case RenderableType.LABEL:
				return new RenderLabelEntity(model as LabelGraphNode);
			case RenderableType.SPRITE:
				return new RenderSpriteEntity(model as SpriteGraphNode);
			case RenderableType.CANVAS:
				return new RenderCanvasEntity(model as CanvasGraphNode);
			case RenderableType.TILED_SPRITE:
				return new RenderTiledSpriteEntity(model as SpriteGraphNode);
			case RenderableType.BOX_SPRITE:
				return new RenderSpriteEntity(model as SpriteGraphNode);
			case RenderableType.CAMERA:
				const camera = new RenderCameraEntity(model as CameraGraphNode, this.stageNode);
				camera.displayObject.visible = false;
				return camera;
			case RenderableType.TILE_MAP:
				return new RenderMapEntity(model as TiledMapGraphNode);
		}
	}

	public render(cameraId: number): void {
		const camera: RenderCameraEntity = this.entityDatabase[cameraId] as RenderCameraEntity;
		camera.displayObject.position.x = Math.floor(camera.displayObject.position.x);
		camera.displayObject.position.y = Math.floor(camera.displayObject.position.y);
		if (this.rootNode) {
			this.rootNode.x -= camera.displayObject.x;
			this.rootNode.y -= camera.displayObject.y;
			camera.displayObject.visible = true;
			camera.renderView(this.rootNode);
			camera.displayObject.visible = false;
			this.rootNode.x += camera.displayObject.x;
			this.rootNode.y += camera.displayObject.y;
		}
	}
}
