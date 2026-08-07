import { afterAll, bench, describe } from 'vitest';
import { Aurum, CancellationToken, DataSource, Renderable } from '../src/index.js';

const benchmarkOptions = { time: 500, warmupTime: 200 };
const cleanups: Array<() => void> = [];

function mountPersistent(content: Renderable): CancellationToken {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const token = Aurum.attach(content, host);
    cleanups.push(() => {
        token.cancel();
        host.remove();
    });
    return token;
}

function Panel(props: { revision: number }): Renderable {
    return (
        <section data-revision={props.revision}>
            <h2>Panel {props.revision}</h2>
            {Array.from({ length: 20 }, (_, index) => <span>{props.revision}:{index}</span>)}
        </section>
    );
}

describe('render batching performance', () => {
    const scalar = new DataSource(0, 'render batch single scalar');
    mountPersistent(<span>{scalar}</span>);
    let scalarRevision = 0;
    bench('one unbatched rendered text update', () => {
        scalar.update(++scalarRevision);
    }, benchmarkOptions);
    bench('one rendered text update inside a batch', () => {
        Aurum.batchRender(() => scalar.update(++scalarRevision));
    }, benchmarkOptions);

    const burst = new DataSource(0, 'render batch scalar burst');
    mountPersistent(<span>{burst}</span>);
    let burstRevision = 0;
    bench('100 unbatched updates to one rendered text binding', () => {
        for (let index = 0; index < 100; index++) burst.update(++burstRevision);
    }, benchmarkOptions);
    bench('100 batched updates to one rendered text binding', () => {
        Aurum.batchRender(() => {
            for (let index = 0; index < 100; index++) burst.update(++burstRevision);
        });
    }, benchmarkOptions);

    const panels = Array.from({ length: 20 }, (_, revision) => <Panel revision={revision} />);
    const panel = new DataSource<Renderable>(panels[0], 'render batch component replacement');
    mountPersistent(<main>{panel}</main>);
    let panelRevision = 0;
    bench('20 unbatched component replacements', () => {
        for (let index = 0; index < panels.length; index++) {
            panelRevision = (panelRevision + 1) % panels.length;
            panel.update(panels[panelRevision]);
        }
    }, benchmarkOptions);
    bench('20 batched component replacements', () => {
        Aurum.batchRender(() => {
            for (let index = 0; index < panels.length; index++) {
                panelRevision = (panelRevision + 1) % panels.length;
                panel.update(panels[panelRevision]);
            }
        });
    }, benchmarkOptions);
    bench('19 unbatched component replacements with a changed final value', () => {
        for (let index = 0; index < panels.length - 1; index++) {
            panelRevision = (panelRevision + 1) % panels.length;
            panel.update(panels[panelRevision]);
        }
    }, benchmarkOptions);
    bench('19 batched component replacements with a changed final value', () => {
        Aurum.batchRender(() => {
            for (let index = 0; index < panels.length - 1; index++) {
                panelRevision = (panelRevision + 1) % panels.length;
                panel.update(panels[panelRevision]);
            }
        });
    }, benchmarkOptions);

    const independent = Array.from({ length: 100 }, (_, index) => new DataSource(index, `render batch independent ${index}`));
    mountPersistent(<div>{independent.map((source) => <span>{source}</span>)}</div>);
    let independentRevision = 0;
    bench('update 100 independent rendered text bindings without a batch', () => {
        independentRevision++;
        for (const source of independent) source.update(independentRevision);
    }, benchmarkOptions);
    bench('update 100 independent rendered text bindings inside a batch', () => {
        independentRevision++;
        Aurum.batchRender(() => {
            for (const source of independent) source.update(independentRevision);
        });
    }, benchmarkOptions);
});

afterAll(() => {
    for (const cleanup of cleanups) cleanup();
});
