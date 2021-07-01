import { PointLike } from 'aurum-layout-engine';

export class AStar {
    public findPath(gridSize: PointLike, position: PointLike, target: PointLike, isAccessible: (pos: PointLike) => boolean): PointLike[] {
        const startNode = new AStarNode(position, undefined);
        const endNode = new AStarNode(target, undefined);

        const open: AStarNode[] = [startNode];
        const result: PointLike[] = [];
        const searchSpace: boolean[] = new Array(gridSize.x * gridSize.y);

        while (open.length) {
            let max = gridSize.x * gridSize.y;
            let min = -1;

            for (let i = 0; i < open.length; i++) {
                if (open[i].totalEstimatedCost < max) {
                    max = open[i].totalEstimatedCost;
                    min = i;
                }
            }

            const currentNode: AStarNode = open.splice(min, 1)[0];
            if (currentNode.position.x === endNode.position.x && currentNode.position.y === endNode.position.y) {
                let ptr = currentNode;
                do {
                    result.push(ptr.position);
                } while ((ptr = ptr.parent));

                result.reverse();
            } else {
                const neighbours: PointLike[] = this.getNeighbours(currentNode.position, isAccessible);
                for (let i = 0; i < neighbours.length; i++) {
                    if (!searchSpace[neighbours[i].x + neighbours[i].y * gridSize.x]) {
                        const newNode = new AStarNode(neighbours[i], currentNode);

                        newNode.cost = currentNode.cost + 1;
                        newNode.totalEstimatedCost =
                            newNode.cost + Math.abs(endNode.position.x - newNode.position.x) + Math.abs(endNode.position.y - newNode.position.y);

                        searchSpace[newNode.position.x + gridSize.x * newNode.position.y] = true;
                        open.push(newNode);
                    }
                }
            }
        }

        return result;
    }

    private getNeighbours(position: PointLike, isAccessible: (pos: PointLike) => boolean): PointLike[] {
        const result = [];

        position.x--;
        if (isAccessible(position)) {
            result.push({ ...position });
        }
        position.x += 2;
        if (isAccessible(position)) {
            result.push({ ...position });
        }
        position.x--;
        position.y--;
        if (isAccessible(position)) {
            result.push({ ...position });
        }
        position.y += 2;
        if (isAccessible(position)) {
            result.push({ ...position });
        }
        position.y--;

        return result;
    }
}

class AStarNode {
    public parent: AStarNode;
    public position: PointLike;
    public cost: number;
    public totalEstimatedCost: number;

    constructor(position: PointLike, parent?: AStarNode) {
        this.position = position;
        this.parent = parent;
        this.cost = 0;
        this.totalEstimatedCost = 0;
    }
}
