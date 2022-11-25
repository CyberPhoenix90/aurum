import { TiledMapTileModel, TiledMapTilesetModel } from './tiled_map_format.js';

export enum TilesetTypes {
    TILES,
    OBJECTS
}

export class Tileset {
    public readonly startGid: number;
    public readonly tileCount: number;
    public readonly tileWidth: number;
    public readonly tileHeight: number;
    public readonly basePath: string;
    private readonly tileMetadataMap: { [gid: string]: TiledMapTileModel };

    public readonly imagePath: string;

    public texture: HTMLImageElement;

    constructor(tileset: TiledMapTilesetModel, basePath: string = '') {
        this.tileCount = tileset.tilecount;
        this.startGid = tileset.firstgid;
        this.tileWidth = tileset.tilewidth;
        this.tileHeight = tileset.tileheight;
        this.tileMetadataMap = {};

        if (tileset.tiles) {
            Object.keys(tileset.tiles).forEach((index: string) => {
                if (this.tileMetadataMap[index] === undefined) {
                    this.tileMetadataMap[index] = {};
                }
                this.tileMetadataMap[index].type = (tileset.tiles as any)[index].type;
            });
        }

        if (tileset.tileproperties) {
            Object.keys(tileset.tileproperties).forEach((index: string) => {
                if (this.tileMetadataMap[index] === undefined) {
                    this.tileMetadataMap[index] = {};
                }
                this.tileMetadataMap[index].tileproperties = tileset.tileproperties[index];
            });
        }

        this.basePath = basePath;

        if (tileset.image) {
            this.imagePath = tileset.image;
        }
    }

    public hasGid(gid: number): boolean {
        return gid >= this.startGid && gid < this.startGid + this.tileCount;
    }

    public getType(): TilesetTypes {
        if (this.imagePath) {
            return TilesetTypes.TILES;
        } else {
            return TilesetTypes.OBJECTS;
        }
    }

    public async load(): Promise<HTMLImageElement> {
        const HTMLImageElement: HTMLImageElement = await this.initializeImageTileset();
        this.texture = HTMLImageElement;
        return HTMLImageElement;
    }

    public getTileMetadata(tileGid: number): TiledMapTileModel {
        return this.tileMetadataMap[tileGid - this.startGid];
    }

    private async initializeImageTileset(): Promise<HTMLImageElement> {
        if (this.imagePath === undefined) {
            throw new Error('Only supported by tiles set');
        }

        const src = join(this.basePath, this.imagePath);
        const img = document.createElement('img');
        img.src = src;

        return new Promise((resolve, reject) => {
            img.addEventListener('load', () => {
                resolve(img);
            });
            img.addEventListener('error', (e) => {
                reject(e);
            });
        });
    }

    public getTilePosition(tileGid: number): { tileX: number; tileY: number } {
        if (!this.texture) {
            throw new Error('cannot get tile position before HTMLImageElement is loaded');
        }

        let index = tileGid - this.startGid;
        return {
            tileX: (index % (this.texture.naturalWidth / this.tileWidth)) * this.tileWidth,
            tileY: Math.floor(index / (this.texture.naturalWidth / this.tileWidth)) * this.tileHeight
        };
    }
}

function join(a: string, b: string): string {
    if (a.endsWith('/') && b.startsWith('/')) {
        return a + b.substring(1);
    }

    if (!a.endsWith('/') && !b.startsWith('/')) {
        return a + '/' + b;
    }

    return a + b;
}
