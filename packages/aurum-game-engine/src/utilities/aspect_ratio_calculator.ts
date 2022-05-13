import { PointLike, pointUtils } from 'aurum-layout-engine';
import { CancellationToken } from 'aurumjs';
import { aggregate, Data, DataPointLike, readData, tx } from './data';
import { _ } from './streamline';

export class AspectRatioCalculator {
    public getBestSize(availableSpace: PointLike, desiredAspectRatio: number): PointLike {
        const currentRatio: number = pointUtils.ratio(availableSpace);
        if (currentRatio !== desiredAspectRatio) {
            const requiredWidth: number = desiredAspectRatio * availableSpace.y;
            if (requiredWidth < availableSpace.x) {
                return { x: requiredWidth, y: availableSpace.y };
            } else {
                const requiredHeight: number = 1 / (desiredAspectRatio / availableSpace.x);
                return { x: availableSpace.x, y: requiredHeight };
            }
        } else {
            return availableSpace;
        }
    }

    public getBestSizeAsSource(availableSpace: DataPointLike, desiredAspectRatio: Data<number>, lifeCycle: CancellationToken): Data<PointLike> {
        return tx(
            lifeCycle,
            [availableSpace.x, availableSpace.y],
            aggregate((x, y) => {
                return this.getBestSize({ x, y }, readData(desiredAspectRatio));
            })
        );
    }
}

export const aspectRatioCalculator: AspectRatioCalculator = new AspectRatioCalculator();
