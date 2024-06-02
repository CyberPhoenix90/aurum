import { AurumCanvas, AurumRectangle } from 'aurum-canvas';
import {
    ArrayDataSource,
    Aurum,
    AurumComponentAPI,
    CancellationToken,
    ClassType,
    DataSource,
    dsDebounce,
    dsMap,
    dsTap,
    ReadOnlyDataSource,
    Renderable,
    StyleType
} from 'aurumjs';

export interface DataPoint {
    value: number;
    timestamp: number;
}

export interface Serie {
    label: string | ReadOnlyDataSource<string>;
    color: string | ReadOnlyDataSource<string>;
    data: DataPoint[] | ArrayDataSource<DataPoint>;
}

export interface BarChartProps {
    style?: StyleType;
    class?: ClassType;
    series: Serie[] | ArrayDataSource<Serie>;
    buckets: number | DataSource<number>;
    bucketAggregationMethod: 'avg' | 'max' | 'min';
    noDataRenderable?: Renderable;
}

export function BarChart(props: BarChartProps, children: Renderable[], api: AurumComponentAPI): Renderable {
    let width = new DataSource(0);
    let height = new DataSource(0);

    let seriesCount = props.series instanceof ArrayDataSource ? props.series.length : new DataSource(props.series.length);
    let { startTs, endTs, maxValue } = computeBounds(props.series, api.cancellationToken);

    return (
        <div
            onAttach={(div) => {
                const ro = new ResizeObserver(() => {
                    const bb = div.getBoundingClientRect();
                    width.update(bb.width);
                    height.update(bb.height);
                });
                ro.observe(div);
                api.cancellationToken.addCancellable(() => ro.disconnect());
                const bb = div.getBoundingClientRect();
                width.update(bb.width);
                height.update(bb.height);
            }}
            class={props.class}
            style={props.style}
        >
            <AurumCanvas width={width} height={height}>
                {props.series.map((s) => (
                    <BarChartSerie
                        startTs={startTs}
                        endTs={endTs}
                        maxValue={maxValue}
                        model={s}
                        totalCount={seriesCount}
                        bucketAggregationMethod={props.bucketAggregationMethod}
                        buckets={props.buckets}
                        width={width}
                        height={height}
                    ></BarChartSerie>
                ))}
            </AurumCanvas>
        </div>
    );
}

function BarChartSerie(
    props: {
        model: Serie;
        totalCount: DataSource<number>;
        maxValue: DataSource<number>;
        startTs: DataSource<number>;
        endTs: DataSource<number>;
        width: DataSource<number>;
        height: DataSource<number>;
        buckets: number | DataSource<number>;
        bucketAggregationMethod: 'avg' | 'max' | 'min';
    },
    children: Renderable[],
    api: AurumComponentAPI
) {
    const { endTs, maxValue, model, startTs, totalCount, bucketAggregationMethod, buckets, width, height } = props;

    const bucketsSource = bucketize(model, startTs, endTs, buckets, bucketAggregationMethod, api.cancellationToken);

    const barWidth = width.aggregate([bucketsSource.length, totalCount], (w, b, t) => w / t / b, api.cancellationToken);
    return bucketsSource.map((b) => {
        const cancellationToken = new CancellationToken();
        const barHeight = height.aggregate([maxValue], (h, maxValue) => h * (b.value / maxValue), cancellationToken);

        return (
            <AurumRectangle
                onDetach={() => {
                    cancellationToken.cancel();
                }}
                x={barWidth.transform(
                    dsMap((bw) => bucketsSource.indexOf(b) + bucketsSource.indexOf(b) * bw),
                    cancellationToken
                )}
                y={barHeight.aggregate([height], (bh, h) => h - bh, cancellationToken)}
                height={barHeight}
                width={barWidth.transform(
                    dsMap((w) => w - 2),
                    cancellationToken
                )}
                fillColor={model.color}
            ></AurumRectangle>
        );
    });
}
function bucketize(
    serie: Serie,
    startTs: DataSource<number>,
    endTs: DataSource<number>,
    buckets: number | DataSource<number>,
    bucketAggregationMethod: 'avg' | 'max' | 'min',
    cancellationToken: CancellationToken
): ArrayDataSource<DataPoint> {
    const result = new ArrayDataSource<DataPoint>();
    const debouncer = new DataSource<void>();
    debouncer.transform(
        dsDebounce(1),
        dsTap(() => recompute())
    );

    if (typeof buckets !== 'number') {
        buckets.pipe(debouncer as any, cancellationToken);
    }
    startTs.pipe(debouncer as any, cancellationToken);
    endTs.pipe(debouncer as any, cancellationToken);
    if (serie.data instanceof ArrayDataSource) {
        serie.data.listen(() => debouncer.update(), cancellationToken);
    }

    recompute();

    return result;

    function recompute() {
        const bucketCount = typeof buckets === 'number' ? buckets : buckets.value;
        const bucketArray: DataPoint[][] = [];
        for (let i = 0; i < bucketCount; i++) {
            bucketArray[i] = [];
        }
        const range = endTs.value - startTs.value;
        const bucketSpan = range / bucketCount;
        const data = serie.data instanceof ArrayDataSource ? serie.data.getData() : serie.data;
        for (const point of data) {
            if (startTs.value === endTs.value) {
                bucketArray[0].push(point);
            } else {
                const index = Math.floor((point.timestamp - startTs.value) / bucketSpan);
                if (index >= bucketArray.length) {
                    bucketArray[index - 1].push(point);
                } else {
                    bucketArray[index].push(point);
                }
            }
        }

        let i = 0;
        result.clear();
        for (const bucket of bucketArray) {
            result.push({
                timestamp: startTs.value + i * bucketSpan,
                value: aggregateBucketPoints(bucket, bucketAggregationMethod)
            });
            i++;
        }
    }
}

function aggregateBucketPoints(bucketPoints: DataPoint[], bucketAggregationMethod: 'avg' | 'max' | 'min'): number {
    switch (bucketAggregationMethod) {
        case 'avg':
            return bucketPoints.reduce((t, c) => t + c.value, 0) / bucketPoints.length;
        case 'max':
            return Math.max(...bucketPoints.map((s) => s.value));
        case 'min':
            return Math.min(...bucketPoints.map((s) => s.value));
        default:
            throw new Error('unknown bucket aggregation method');
    }
}

function computeBounds(
    series: Serie[] | ArrayDataSource<Serie>,
    cancellationToken: CancellationToken
): { startTs: DataSource<number>; endTs: DataSource<number>; maxValue: DataSource<number> } {
    let token: CancellationToken = new CancellationToken();
    const startTs = new DataSource(Number.MAX_SAFE_INTEGER);
    const endTs = new DataSource(Number.MIN_SAFE_INTEGER);
    const maxValue = new DataSource(Number.MIN_SAFE_INTEGER);

    cancellationToken.addCancellable(token);

    function rebuild() {
        token.cancel();
        if (!cancellationToken.isCancelled) {
            token = new CancellationToken();
            cancellationToken.addCancellable(token);
            performBoundComputation(startTs, endTs, maxValue, rebuild, series, cancellationToken);
        }
    }

    performBoundComputation(startTs, endTs, maxValue, rebuild, series, cancellationToken);

    return { startTs, endTs, maxValue };
}

function performBoundComputation(
    startTs: DataSource<number>,
    endTs: DataSource<number>,
    maxValue: DataSource<number>,
    rebuild: () => void,
    series: Serie[] | ArrayDataSource<Serie>,
    cancellationToken: CancellationToken
): void {
    if (Array.isArray(series)) {
        for (const serie of series) {
            computeSerieBounds(serie, startTs, endTs, maxValue, rebuild, cancellationToken);
        }
    } else {
        const tokenMap = new WeakMap();
        series.onItemsRemoved.subscribe((removed) => {
            for (const item of removed) {
                const token = tokenMap.get(item);
                if (!token) {
                    throw new Error('illegal state');
                }
                token.cancel();
            }
        });
        series.onItemsAdded.subscribe((added) => {
            for (const item of added) {
                tokenMap.set(item, new CancellationToken());
                computeSerieBounds(item, startTs, endTs, maxValue, rebuild, tokenMap.get(item));
            }
        });
        for (const item of series.getData()) {
            tokenMap.set(item, new CancellationToken());
            computeSerieBounds(item, startTs, endTs, maxValue, rebuild, tokenMap.get(item));
        }
    }
}

function computeSerieBounds(
    serie: Serie,
    startTs: DataSource<number>,
    endTs: DataSource<number>,
    maxValue: DataSource<number>,
    rebuild: () => void,
    cancellationToken: CancellationToken
): void {
    if (Array.isArray(serie.data)) {
        evaluatePointBounds(serie.data, startTs, endTs, maxValue);
    } else {
        serie.data.onItemsAdded.subscribe((points) => {
            evaluatePointBounds(points, startTs, endTs, maxValue);
        }, cancellationToken);
        evaluatePointBounds(serie.data.getData(), startTs, endTs, maxValue);

        serie.data.onItemsRemoved.subscribe((points) => {
            for (const point of points) {
                if (point.timestamp === startTs.value) {
                    rebuild();
                    return;
                }
                if (point.timestamp === endTs.value) {
                    rebuild();
                    return;
                }
                if (point.value === maxValue.value) {
                    rebuild();
                    return;
                }
            }
        }, cancellationToken);
    }
}
function evaluatePointBounds(points: readonly DataPoint[], startTs: DataSource<number>, endTs: DataSource<number>, maxValue: DataSource<number>): void {
    for (const point of points) {
        if (point.timestamp < startTs.value) {
            startTs.update(point.timestamp);
        }
        if (point.timestamp > endTs.value) {
            endTs.update(point.timestamp);
        }
        if (point.value > maxValue.value) {
            maxValue.update(point.value);
        }
    }
}
