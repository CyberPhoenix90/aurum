import { SpriteGraphNode } from "aurum-game-engine";
import { TilingSprite } from "pixi.js";
import { RenderSpriteEntity } from "./pixi_render_sprite_entity";

export class RenderTiledSpriteEntity extends RenderSpriteEntity {
    protected createDisplayObject(model: SpriteGraphNode) {
        const texture = this.createTexture(model);
        return new TilingSprite(texture);
    }
}
