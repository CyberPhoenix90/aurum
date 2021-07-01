import { lerp } from '../../math/math_utils';
import { animate } from './animate';
import { CancellationToken } from 'aurumjs';
import { PointLike } from 'aurum-layout-engine';

export interface TweenModel<T> {
    target: T;
    property: keyof T;
    initialValue?: number;
    targetValue: number;
    duration: number;
    cancellationToken?: CancellationToken;
    setter?: (target: T, key: keyof T, value: number) => void;
}

export async function tween<T>(model: TweenModel<T>): Promise<void> {
    if ((model.target[model.property] as any) === model.targetValue) {
        return;
    }

    if (model.duration === 0) {
        if (model.setter) {
            model.setter(model.target, model.property, model.targetValue);
        } else {
            model.target[model.property] = model.targetValue as any;
        }
        return;
    }

    const startValue: number = model.initialValue !== undefined ? model.initialValue : (model.target[model.property] as any);

    return animate(
        function f(progress) {
            if (model.setter) {
                model.setter(model.target, model.property, lerp(startValue, model.targetValue, progress) as any);
            } else {
                model.target[model.property] = lerp(startValue, model.targetValue, progress) as any;
            }
        },
        {
            duration: model.duration,
            cancellationToken: model.cancellationToken
        }
    );
}

export async function tweenPoint(model: {
    target: PointLike;
    targetValue: PointLike;
    duration: number;
    cancellationToken?: CancellationToken;
}): Promise<void[]> {
    return Promise.all([
        tween({
            target: model.target,
            targetValue: model.targetValue.x,
            property: 'x',
            duration: model.duration,
            cancellationToken: model.cancellationToken
        }),
        tween({
            target: model.target,
            targetValue: model.targetValue.y,
            property: 'y',
            duration: model.duration,
            cancellationToken: model.cancellationToken
        })
    ]);
}
