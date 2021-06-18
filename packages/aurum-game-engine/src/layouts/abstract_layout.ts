import { CommonEntity } from '../models/entities';
import { SceneGraphNode } from '../models/scene_graph';

export abstract class AbstractLayout {
	public positionChildren(children: ReadonlyArray<SceneGraphNode<CommonEntity>>, parent: SceneGraphNode<CommonEntity>): void {
		children.forEach((e, i) => this.positionEntityByIndex(e, i, children, parent));
	}

	public abstract isSizeSensitive(): boolean;

	public abstract positionEntityByIndex(
		entity: SceneGraphNode<CommonEntity>,
		index: number,
		siblings: ReadonlyArray<SceneGraphNode<CommonEntity>>,
		parent: SceneGraphNode<CommonEntity>
	): void;
}
