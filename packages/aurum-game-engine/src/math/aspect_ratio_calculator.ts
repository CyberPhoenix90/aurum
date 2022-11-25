import { ObjectDataSource } from 'aurumjs';
import { Data } from '../models/input_data.js';
import { PointLike, pointUtils } from 'aurum-layout-engine';
import { toSource } from '../utilities/data/to_source.js';
import { _ } from '../utilities/other/streamline.js';

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

    public getBestSizeAsStream(availableSpace: ObjectDataSource<PointLike>, desiredAspectRatio: Data<number>): ObjectDataSource<PointLike> {
        const result = new ObjectDataSource({ x: 0, y: 0 });

        availableSpace.pick('x').aggregate([availableSpace.pick('y'), toSource(desiredAspectRatio)], (x, y) => {
            const size = this.getBestSize({ x, y }, _.derefData(desiredAspectRatio));
            result.assign(size);
        });

        return result;
    }
}

export const aspectRatioCalculator: AspectRatioCalculator = new AspectRatioCalculator();
