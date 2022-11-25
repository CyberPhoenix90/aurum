import { SquaredArray } from '../../utilities/data_structures/squared_array.js';
import { PointLike } from 'aurum-layout-engine';
import { Projector } from '../../models/common.js';
import { ArrayDataSource } from 'aurumjs';

export interface BuildingModel<T> {
    item: T;
    gridPosition: PointLike;
    readonly size: PointLike;
}

export class ConstructionGrid<T> {
    public readonly buildings: ArrayDataSource<BuildingModel<T>>;
    private data: SquaredArray<BuildingModel<T>>;
    private projector: Projector;
    private validPlacementDelegate: (point: PointLike) => boolean;
    private maxHeight: number;

    constructor(width: number, validPlacementDelegate?: (point: PointLike) => boolean, coordinatesProjector?: Projector, maxHeight?: number) {
        this.buildings = new ArrayDataSource([]);
        this.data = new SquaredArray(width);
        this.projector = coordinatesProjector ?? ((p: PointLike) => p);
        this.validPlacementDelegate = validPlacementDelegate ?? (() => true);
        this.maxHeight = maxHeight;
    }

    public hasBuildingAt(point: PointLike): boolean {
        const p = this.projector(point);
        if (p) {
            return this.data.get(p.x, p.y) !== undefined;
        } else {
            return false;
        }
    }

    public getBuildingAt(point: PointLike): BuildingModel<T> {
        const p = this.projector(point);
        if (p) {
            return this.data.get(p.x, p.y);
        } else {
            return undefined;
        }
    }

    public getBuildingByGridPoint(point: PointLike): BuildingModel<T> {
        return this.data.get(point.x, point.y);
    }

    public isInBounds(point: PointLike): boolean {
        return point.x >= 0 && point.x < this.data.width && point.y >= 0 && (this.maxHeight === undefined || point.y < this.maxHeight);
    }

    public isRectangleInBounds(point: PointLike, size: PointLike): boolean {
        this.validateSize(size);

        return (
            this.isInBounds(point) &&
            this.isInBounds({ x: point.x + size.x - 1, y: point.y }) &&
            this.isInBounds({ x: point.x, y: point.y + size.y - 1 }) &&
            this.isInBounds({ x: point.x + size.x - 1, y: point.y + size.y - 1 })
        );
    }

    public canPlace(point: PointLike, size: PointLike): boolean {
        this.validateSize(size);

        if (!this.validPlacementDelegate(point)) {
            return false;
        }

        const p = this.projector(point);
        for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
                if (!this.isInBounds({ x: p.x + x, y: p.y + y })) {
                    return false;
                }
                if (this.data.get(p.x + x, p.y + y) !== undefined) {
                    return false;
                }
            }
        }

        return true;
    }

    private validateSize(size: PointLike) {
        if (!size || size.x <= 0 || size.y <= 0) {
            throw new Error('Invalid size');
        }
    }

    public removeBuilding(building: T): void {
        const p = this.buildings.getData().findIndex((i) => i.item === building);
        if (p !== -1) {
            const building = this.buildings.get(p);
            this.buildings.removeAt(p);
            for (let x = 0; x < building.size.x; x++) {
                for (let y = 0; y < building.size.y; y++) {
                    this.data.set(building.gridPosition.x + x, building.gridPosition.y + y, undefined);
                }
            }
        }
    }

    public removeBuildingAt(point: PointLike): void {
        const building = this.getBuildingAt(point);
        if (building) {
            this.removeBuilding(building.item);
        }
    }

    public placeBuilding(point: PointLike, building: T, size: PointLike = { x: 1, y: 1 }): T {
        if (!this.canPlace(point, size)) {
            throw new Error('Cannot place building here');
        } else {
            const p = this.projector(point);
            const entry = {
                gridPosition: p,
                item: building,
                size
            };
            this.buildings.push(entry);
            for (let x = 0; x < size.x; x++) {
                for (let y = 0; y < size.y; y++) {
                    this.data.set(p.x + x, p.y + y, entry);
                }
            }
        }
        return building;
    }
}
