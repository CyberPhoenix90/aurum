import { afterAll, bench, describe } from 'vitest';
import {
    ArrayDataSource,
    Aurum,
    configureAurumDevtools,
    DataSource,
    getAurumDevtoolsRegistry,
    Renderable
} from '../src/index.js';

const benchmarkOptions = { time: 250, warmupTime: 100 };
const registry = getAurumDevtoolsRegistry();
const cleanups: Array<() => void> = [];

interface DevtoolsScenario {
    name: string;
    mode: 'debug' | 'production';
    captureStacks: boolean;
    extensionListener: boolean;
}

const scenarios: DevtoolsScenario[] = [
    { name: 'production, extension closed', mode: 'production', captureStacks: false, extensionListener: false },
    { name: 'production, extension open', mode: 'production', captureStacks: false, extensionListener: true },
    { name: 'debug, stack capture disabled', mode: 'debug', captureStacks: false, extensionListener: false },
    { name: 'debug, stack capture enabled', mode: 'debug', captureStacks: true, extensionListener: false }
];

function scenarioOptions(scenario: DevtoolsScenario): typeof benchmarkOptions & { setup(): void; teardown(): void } {
    let unsubscribe: (() => void) | undefined;
    const extensionEventQueue: object[] = [];
    return {
        ...benchmarkOptions,
        setup(): void {
            configureAurumDevtools({
                mode: scenario.mode,
                captureStacks: scenario.captureStacks,
                historyLimit: scenario.mode === 'debug' ? 200 : 0
            });
            if (scenario.extensionListener) {
                unsubscribe = registry.subscribe((event) => {
                    // Production events contain topology/version information
                    // only. Cloning and bounding them models the page bridge's
                    // synchronous work while the panel is open.
                    extensionEventQueue.push({ ...event });
                    if (extensionEventQueue.length > 2_000) extensionEventQueue.splice(0, 500);
                });
            }
        },
        teardown(): void {
            unsubscribe?.();
            unsubscribe = undefined;
            extensionEventQueue.length = 0;
            registry.clearHistory();
        }
    };
}

function BenchmarkItem(props: { label: string }): Renderable {
    return <li>{props.label}</li>;
}

describe('developer-tools runtime overhead', () => {
    const scalar = new DataSource(0, 'benchmark scalar');
    const initialItems = Array.from({ length: 1_000 }, (_, index) => `item ${index}`);
    const rotatedItems = [...initialItems.slice(1), initialItems[0]];
    const collection = new ArrayDataSource<string>(initialItems, 'benchmark collection');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const mountToken = Aurum.attach(<ul>{collection}</ul>, host);
    cleanups.push(() => {
        mountToken.cancel();
        host.remove();
    });

    for (const scenario of scenarios) {
        let scalarRevision = 0;
        bench(
            `scalar updates — ${scenario.name}`,
            () => scalar.update(++scalarRevision),
            scenarioOptions(scenario)
        );

        let rotated = true;
        bench(
            `merge 1,000 rendered collection entries — ${scenario.name}`,
            () => {
                collection.merge(rotated ? rotatedItems : initialItems);
                rotated = !rotated;
            },
            scenarioOptions(scenario)
        );

        const componentTree = (
            <ul>
                {Array.from({ length: 100 }, (_, index) => (
                    <BenchmarkItem label={`component ${index}`} />
                ))}
            </ul>
        );
        bench(
            `mount and dispose 100 components — ${scenario.name}`,
            () => {
                const componentHost = document.createElement('div');
                const token = Aurum.attach(componentTree, componentHost);
                token.cancel();
            },
            scenarioOptions(scenario)
        );
    }

    const snapshotSources = Array.from({ length: 1_000 }, (_, index) => new DataSource(index, `snapshot source ${index}`));
    let snapshotChecksum = 0;
    bench(
        'extension topology snapshot with 1,000 sources',
        () => {
            const snapshot = registry.getSnapshot({ includeValues: false });
            // Consume both the result and a source so optimizing runtimes keep
            // the benchmark's graph strongly reachable for every iteration.
            snapshotChecksum ^= snapshot.nodes.length + snapshot.edges.length + snapshotSources[0].value;
        },
        scenarioOptions({ name: 'production, extension open', mode: 'production', captureStacks: false, extensionListener: true })
    );
    cleanups.push(() => void snapshotChecksum);
});

afterAll(() => {
    for (const cleanup of cleanups) cleanup();
    configureAurumDevtools({ mode: 'production', captureStacks: false, historyLimit: 0 });
});
