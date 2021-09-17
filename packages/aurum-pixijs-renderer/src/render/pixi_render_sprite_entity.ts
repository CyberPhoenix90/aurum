import { Color, ResourceWrapper, SpriteGraphNode } from 'aurum-game-engine';
import { ScreenHelper } from 'aurum-layout-engine';
import { BaseTexture, Sprite, Texture as PixiTexture } from 'pixi.js';
import { NoRenderEntity } from './pixi_no_render_entity';

export const textureMap: Map<string | HTMLCanvasElement | HTMLImageElement | ResourceWrapper<HTMLImageElement, string>, BaseTexture> = new Map();
export const pendingTextureMap: Map<string | ResourceWrapper<HTMLImageElement, string>, Promise<HTMLImageElement>> = new Map();
const c = document.createElement('canvas');
c.width = 1;
c.height = 1;
export class RenderSpriteEntity extends NoRenderEntity {
    public declare displayObject: Sprite;
    public static voidTexture: PixiTexture = new PixiTexture(new BaseTexture(c));

    constructor(config: SpriteGraphNode) {
        super(config);
    }

    protected createDisplayObject(model: SpriteGraphNode) {
        const texture = this.createTexture(model);
        return new Sprite(texture);
    }

    protected createTexture(model: SpriteGraphNode): PixiTexture {
        if (!model.resolvedModel.texture.value) {
            return RenderSpriteEntity.voidTexture;
        }

        const value = model.resolvedModel.texture.value;

        if (typeof value === 'string') {
            if (!textureMap.has(value)) {
                if (pendingTextureMap.has(value)) {
                    pendingTextureMap.get(value).then((img) => {
                        this.handleTextureReady(value, img, model);
                    });
                } else {
                    const img = document.createElement('img');
                    pendingTextureMap.set(
                        value,
                        new Promise((resolve, reject) => {
                            img.addEventListener('load', () => {
                                resolve(img);
                                this.handleTextureReady(value, img, model);
                            });
                            img.addEventListener('error', (e) => {
                                reject(e);
                            });
                        })
                    );
                    img.src = value;
                }
                return RenderSpriteEntity.voidTexture;
            }
        } else if (value instanceof HTMLCanvasElement || value instanceof HTMLImageElement) {
            if (!textureMap.has(value)) {
                textureMap.set(value, new BaseTexture(value));
            }
        } else {
            if (!textureMap.has(value)) {
                if (pendingTextureMap.has(value)) {
                    pendingTextureMap.get(value).then((img) => {
                        this.handleTextureReady(value, img, model);
                    });
                    return RenderSpriteEntity.voidTexture;
                } else {
                    if (value.isLoaded) {
                        textureMap.set(value, new BaseTexture(value.resource));
                    } else {
                        pendingTextureMap.set(
                            value,
                            value.load().then((img) => {
                                this.handleTextureReady(value, img, model);
                                return img;
                            })
                        );
                        return RenderSpriteEntity.voidTexture;
                    }
                }
            }
        }

        return this.wrapTexture(textureMap.get(model.resolvedModel.texture.value), model);
    }

    private handleTextureReady(texture: string | ResourceWrapper<HTMLImageElement, string>, img: HTMLImageElement, model: SpriteGraphNode) {
        pendingTextureMap.delete(texture);
        const bt = new BaseTexture(img);
        if (!this.token.isCanceled) {
            this.displayObject.texture = this.wrapTexture(bt, model);
            model.renderState.width.repeatLast();
        }
        textureMap.set(texture, bt);
    }

    private wrapTexture(baseTexture: BaseTexture, model: SpriteGraphNode): PixiTexture {
        const result = new PixiTexture(baseTexture);

        model.resolvedModel.width.listenAndRepeat((v) => {
            if (v === 'auto') {
                model.renderState.width.update(baseTexture.realWidth);
            }
        });

        model.resolvedModel.height.listenAndRepeat((v) => {
            if (v === 'auto') {
                model.renderState.height.update(baseTexture.realHeight);
            }
        });

        return result;
    }

    public bind(model: SpriteGraphNode) {
        const { width, height, drawOffsetX, drawOffsetY, drawDistanceX, drawDistanceY, scaleX, scaleY } = model.renderState;

        model.resolvedModel.texture.listen(() => {
            this.displayObject.texture = this.createTexture(model);
        });

        model.resolvedModel.width.listenAndRepeat((v) => {
            if (v === 'auto') {
                this.displayObject.width = this.displayObject.texture.baseTexture.realWidth;
                model.renderState.width.update(this.displayObject.texture.baseTexture.realWidth);
            }
        });

        model.resolvedModel.height.listenAndRepeat((v) => {
            if (v === 'auto') {
                this.displayObject.height = this.displayObject.texture.baseTexture.realHeight;
                model.renderState.height.update(this.displayObject.texture.baseTexture.realHeight);
            }
        });

        width.aggregate(
            [height, drawDistanceX, drawDistanceY, drawOffsetX, drawOffsetY, scaleX, scaleY],
            (w, h, ddx, ddy, dox, doy, sx, sy) => {
                if (!w || !h) {
                    return;
                }

                if (dox === undefined) {
                    this.displayObject.texture.frame.x = 0;
                } else {
                    this.displayObject.texture.frame.x = dox;
                }

                if (doy === undefined) {
                    this.displayObject.texture.frame.y = 0;
                } else {
                    this.displayObject.texture.frame.y = doy;
                }

                if (ddx === undefined) {
                    this.displayObject.texture.frame.width = this.displayObject.texture.baseTexture.realWidth;
                } else {
                    if (typeof ddx === 'number') {
                        this.displayObject.texture.frame.width = ddx;
                    } else {
                        this.displayObject.texture.frame.width = ddx.toPixels(ScreenHelper.PPI, this.displayObject.texture.baseTexture.realWidth);
                    }
                }

                if (ddy === undefined) {
                    this.displayObject.texture.frame.height = this.displayObject.texture.baseTexture.realHeight;
                } else {
                    if (typeof ddy === 'number') {
                        this.displayObject.texture.frame.height = ddy;
                    } else {
                        this.displayObject.texture.frame.height = ddy.toPixels(ScreenHelper.PPI, this.displayObject.texture.baseTexture.realHeight);
                    }
                }
                this.displayObject.width = w * (sx ?? 1);
                this.displayObject.height = h * (sy ?? 1);
                this.displayObject.texture.updateUvs();
            },
            this.token
        );

        model.renderState.tint.listenAndRepeat((v) => {
            if (v) {
                this.displayObject.tint = Color.fromString(v).toRGBNumber();
            } else {
                this.displayObject.tint = 0xffffffff;
            }
        }, this.token);

        super.bind(model);
    }
}
