import {
    BlendModes,
    CommonEntity,
    EntityRenderModel,
    SceneGraphNode,
    SceneGraphNodeModel,
    Shader,
} from "aurum-game-engine";
import { CancellationToken, dsUnique } from "aurumjs";
import {
    BLEND_MODES,
    Container,
    Filter,
    filters,
    Graphics,
    Sprite,
} from "pixi.js";

export class NoRenderEntity {
    public token: CancellationToken;
    public readonly id: number;
    public readonly children: NoRenderEntity[];

    public parent: NoRenderEntity;
    public displayObject: Container;
    public model: SceneGraphNode<CommonEntity>;

    constructor(model: SceneGraphNode<CommonEntity>) {
        this.id = model.uid;
        this.model = model;
        this.token = new CancellationToken();

        model.cancellationToken.chain(this.token);
        this.displayObject = this.createDisplayObject(model);
        //@ts-ignore
        this.displayObject.entity = model;
        //@ts-ignore
        this.displayObject.renderNode = this;
        model.name.listenAndRepeat((v) => {
            this.displayObject.name = v;
        }, this.token);
        this.children = [];

        this.bind(model);
    }

    public dispose(): void {
        if (this.token.isCanceled) {
            return;
        }

        this.token.cancel();
        this.children.forEach((c) => c.dispose());
        this.displayObject.parent.removeChild(this.displayObject);
    }

    public bind(model: SceneGraphNode<CommonEntity>): void {
        model.renderState.visible.listenAndRepeat((v) => {
            this.displayObject.visible = v;
        }, this.token);

        model.renderState.shader.listenAndRepeat((change) => {
            this.displayObject.filters = [];
            switch (change.operation) {
                case "add":
                    this.displayObject.filters.push(
                        ...change.items.map((s) => this.createShader(s))
                    );
                    break;
                case "remove":
                    throw new Error("not implemented");
            }
        });

        model.renderState.rotation.listenAndRepeat((v) => {
            this.displayObject.rotation = v;
            if (v) {
                this.displayObject.pivot.x = this.displayObject.height / 2;
                this.displayObject.pivot.y = this.displayObject.height / 2;
            }
        }, this.token);

        model.renderState.x.listenAndRepeat((v) => {
            if (v !== undefined) {
                if (this.displayObject.rotation !== 0) {
                    this.displayObject.pivot.x = this.displayObject.width / 2;
                }
                this.displayObject.x = v;
            }
        }, this.token);

        model.renderState.y.listenAndRepeat((v) => {
            if (v !== undefined) {
                if (this.displayObject.rotation !== 0) {
                    this.displayObject.pivot.y = this.displayObject.height / 2;
                }
                this.displayObject.y = v;
            }
        }, this.token);

        if (
            Object.getPrototypeOf(this.displayObject).constructor !==
                Container &&
            Object.getPrototypeOf(this.displayObject).constructor !== Sprite
        ) {
            model.renderState.width.listenAndRepeat((v) => {
                if (
                    v !== undefined &&
                    model.resolvedModel.width.value !== "auto"
                ) {
                    this.displayObject.width =
                        v * model.renderState.scaleX.value;
                }
            }, this.token);

            model.renderState.height.listenAndRepeat((v) => {
                if (
                    v !== undefined &&
                    model.resolvedModel.height.value !== "auto"
                ) {
                    this.displayObject.height =
                        v * model.renderState.scaleY.value;
                }
            }, this.token);

            model.renderState.scaleX.listenAndRepeat((v) => {
                if (
                    model.renderState.width.value !== undefined &&
                    model.resolvedModel.width.value !== "auto"
                ) {
                    this.displayObject.width =
                        model.renderState.width.value * v;
                } else {
                    this.displayObject.scale.x = v;
                }
            }, this.token);

            model.renderState.scaleY.listenAndRepeat((v) => {
                if (
                    model.renderState.height.value !== undefined &&
                    model.resolvedModel.height.value !== "auto"
                ) {
                    this.displayObject.height =
                        model.renderState.height.value * v;
                } else {
                    this.displayObject.scale.y = v;
                }
            }, this.token);
        }

        model.renderState.clip.transform(dsUnique()).listenAndRepeat((v) => {
            if (v) {
                const mask = new Graphics();
                mask.lineStyle(5, 0xff0000);
                mask.beginFill(0x880000);
                mask.drawRect(
                    0,
                    0,
                    model.renderState.width.value,
                    model.renderState.height.value
                );
                mask.endFill();

                this.displayObject.mask = mask;
                this.displayObject.addChild(mask);
            } else {
                this.displayObject.removeChild(this.displayObject.mask as any);
            }
        }, this.token);

        model.renderState.alpha.listenAndRepeat((v) => {
            this.displayObject.alpha = v;
        }, this.token);

        model.renderState.blendMode.listenAndRepeat((v) => {
            this.setBlendMode(model.renderState, v);
        }, this.token);

        model.renderState.zIndex.listenAndRepeat((v) => {
            if (this.parent) {
                this.parent.displayObject.children.sort(
                    (a, b) =>
                        ((a as any).entity.zIndex.value || 0) -
                            (b as any).entity.zIndex.value || 0
                );
            }
        }, this.token);
    }

    private setBlendMode(
        model: EntityRenderModel,
        blendMode: BlendModes = BlendModes.NORMAL
    ) {
        let blendModeTarget = this.displayObject;
        if (
            this.displayObject.constructor.name === "Container" &&
            blendMode !== BlendModes.NORMAL
        ) {
            const alphaFilter = new filters.AlphaFilter();
            this.displayObject.filters = [alphaFilter];
        }
        if (
            this.displayObject.filters &&
            this.displayObject.filters.length > 0
        ) {
            //@ts-ignore
            blendModeTarget = this.displayObject.filters[
                this.displayObject.filters.length - 1
            ];
        }
        switch (blendMode) {
            case BlendModes.NORMAL:
                //@ts-ignore
                blendModeTarget.blendMode = BLEND_MODES.NORMAL;
                break;
            case BlendModes.ADD:
                //@ts-ignore
                blendModeTarget.blendMode = BLEND_MODES.ADD;
                break;
            case BlendModes.MULTIPLY:
                //@ts-ignore
                blendModeTarget.blendMode = PIXI.BLEND_MODES.MULTIPLY;
                break;
            case BlendModes.SUB:
                //@ts-ignore
                blendModeTarget.blendMode = PIXI.BLEND_MODES.DARKEN;
                break;
        }
    }

    protected createShader(shaderSource: Shader): Filter {
        const shader = new Filter(shaderSource.vertex, shaderSource.fragment);
        if (shaderSource.uniforms)
            for (const key in shaderSource.uniforms) {
                shader.uniforms[key] = shaderSource.uniforms[key];
            }

        return shader;
    }

    protected createDisplayObject(
        model: SceneGraphNodeModel<CommonEntity>
    ): Container {
        return new Container();
    }
}
