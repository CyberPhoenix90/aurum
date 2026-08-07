import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const packageDirectory = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const distributionDirectory = join(packageDirectory, 'dist');
const contentTypes = new Map([
    ['.css', 'text/css'],
    ['.html', 'text/html'],
    ['.js', 'text/javascript'],
    ['.map', 'application/json']
]);
const server = createServer(async (request, response) => {
    try {
        const path = request.url === '/' ? '/panel.html' : request.url ?? '/panel.html';
        const file = join(distributionDirectory, path.replace(/^\//, ''));
        response.setHeader('content-type', contentTypes.get(extname(file)) ?? 'application/octet-stream');
        response.end(await readFile(file));
    } catch {
        response.statusCode = 404;
        response.end();
    }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
assert(address !== null && typeof address === 'object');

const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
    await page.addInitScript(() => {
        const nodes = Array.from({ length: 80 }, (_, index) => ({
            id: `node-${index}`,
            kind: 'data-source',
            name: `Node ${index}`,
            version: 0,
            subscriberCount: 1,
            subscriptions: { updates: 1 },
            upstream: index === 0 ? [] : [`node-${index - 1}`],
            downstream: index === 79 ? [] : [`node-${index + 1}`]
        }));
        nodes.push(
            {
                id: 'component-app', kind: 'component', name: 'Application', version: 0,
                subscriberCount: 0, subscriptions: {}, upstream: [], downstream: []
            },
            {
                id: 'dom-main', kind: 'dom-element', name: '<main>', value: { type: 'object', summary: 'main' }, version: 0,
                subscriberCount: 0, subscriptions: {}, upstream: [], downstream: []
            },
            {
                id: 'component-child', kind: 'component', name: 'ResultList', version: 0,
                subscriberCount: 0, subscriptions: {}, upstream: [], downstream: []
            },
            {
                id: 'dom-list', kind: 'dom-element', name: '<ul>', value: { type: 'object', summary: 'ul' }, version: 0,
                subscriberCount: 0, subscriptions: {}, upstream: [], downstream: []
            },
            {
                id: 'array-results', kind: 'array-data-source', name: 'Results', version: 0,
                subscriberCount: 1, subscriptions: { updates: 1 }, upstream: [], downstream: [],
                value: {
                    type: 'array', summary: 'Array(2)', size: 2,
                    entries: [
                        { key: '0', value: { type: 'string', summary: '"one"', value: 'one' } },
                        { key: '1', value: { type: 'string', summary: '"two"', value: 'two' } }
                    ]
                }
            }
        );
        const edges = Array.from({ length: 79 }, (_, index) => ({
            id: `edge-${index}`,
            source: `node-${index}`,
            target: `node-${index + 1}`,
            kind: 'transform'
        }));
        edges.push(
            { id: 'component-edge', source: 'component-app', target: 'component-child', kind: 'component-child' },
            { id: 'app-output', source: 'component-app', target: 'dom-main', kind: 'component-output' },
            { id: 'child-output', source: 'component-child', target: 'dom-list', kind: 'component-output' },
            { id: 'dom-edge', source: 'dom-main', target: 'dom-list', kind: 'dom-child' }
        );
        const initial = {
            available: true,
            runtimeId: 'runtime',
            protocolVersion: 1,
            mode: 'debug',
            capabilities: ['graph', 'events', 'subscriptions'],
            droppedEvents: 0,
            bridgeMode: 'shared',
            snapshot: {
                protocolVersion: 1,
                runtimeId: 'runtime',
                revision: 1,
                mode: 'debug',
                timestamp: 1,
                nodes,
                edges,
                events: []
            },
            events: [],
            unchanged: false
        };
        const state = window;
        state.__pollQueue = [initial];
        state.__initialPoll = initial;
        state.__lastPoll = { ...initial, snapshot: undefined, events: [], unchanged: true };
        state.__enqueuePoll = (revision, nodeIndex, version, events) => {
            const next = structuredClone(state.__initialPoll);
            next.snapshot.revision = revision;
            next.snapshot.timestamp = revision;
            next.snapshot.nodes[nodeIndex].version = version;
            next.events = events;
            state.__pollQueue.push(next);
        };
        window.chrome = {
            devtools: {
                inspectedWindow: {
                    eval(_expression, callback) {
                        callback(state.__pollQueue.shift() ?? state.__lastPoll);
                    }
                },
                network: { onNavigated: { addListener() {} } }
            }
        };
    });

    await page.goto(`http://127.0.0.1:${address.port}/panel.html`);
    await page.waitForFunction(() => document.querySelectorAll('.graph-node').length === 85);
    const graphScroll = await page.evaluate(() => {
        const scroll = document.querySelector('.graph-scroll');
        scroll.scrollLeft = 1_500;
        window.__graphScroll = scroll;
        window.__graphNode = document.querySelector('[data-node-id="node-40"]');
        return scroll.scrollLeft;
    });
    await page.evaluate(() =>
        window.__enqueuePoll(2, 40, 1, [
            { sequence: 1, timestamp: 2, type: 'node-updated', nodeId: 'node-40', updateKind: 'value' }
        ])
    );
    await page.waitForFunction(() =>
        document.querySelector('[data-node-id="node-40"] .graph-node-value')?.textContent?.includes('version 1')
    );
    assert.deepEqual(
        await page.evaluate(() => ({
            sameScroll: window.__graphScroll === document.querySelector('.graph-scroll'),
            sameNode: window.__graphNode === document.querySelector('[data-node-id="node-40"]'),
            scroll: document.querySelector('.graph-scroll').scrollLeft
        })),
        { sameScroll: true, sameNode: true, scroll: graphScroll }
    );
    await page.locator('[data-node-id="node-40"]').click();
    assert.deepEqual(
        await page.evaluate(() => ({
            selected: document.querySelector('[data-node-id="node-40"]')?.classList.contains('selected'),
            upstream: document.querySelector('[data-node-id="node-39"]')?.classList.contains('upstream'),
            downstream: document.querySelector('[data-node-id="node-41"]')?.classList.contains('downstream'),
            hasUpstreamEdges: document.querySelectorAll('.graph-edges path.upstream').length > 0,
            hasDownstreamEdges: document.querySelectorAll('.graph-edges path.downstream').length > 0
        })),
        { selected: true, upstream: true, downstream: true, hasUpstreamEdges: true, hasDownstreamEdges: true }
    );

    await page.getByRole('button', { name: 'Components' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.component-row').length === 4);
    assert.deepEqual(await page.locator('.component-row .component-label').allTextContents(), ['Application', '<main>', 'ResultList', '<ul>']);

    await page.getByRole('button', { name: 'Arrays' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.data-table tbody tr').length === 1);
    await page.locator('.data-table tbody tr').click();
    await page.waitForFunction(() => document.querySelectorAll('.array-item').length === 2);
    assert.deepEqual(await page.locator('.array-value').allTextContents(), ['"one"', '"two"']);

    await page.getByRole('button', { name: 'Nodes' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.data-table tbody tr').length === 85);
    const nodeScroll = await page.evaluate(() => {
        const scroll = document.querySelector('.table-scroll');
        scroll.scrollTop = 500;
        window.__tableScroll = scroll;
        window.__tableRow = Array.from(document.querySelectorAll('.data-table tbody tr')).find(
            (row) => row.firstElementChild?.textContent === 'Node 40'
        );
        return scroll.scrollTop;
    });
    await page.evaluate(() =>
        window.__enqueuePoll(3, 40, 2, [
            { sequence: 2, timestamp: 3, type: 'node-updated', nodeId: 'node-40', updateKind: 'value' }
        ])
    );
    await page.waitForFunction(
        () =>
            Array.from(document.querySelectorAll('.data-table tbody tr')).find(
                (row) => row.firstElementChild?.textContent === 'Node 40'
            )?.children[3]?.textContent === '2'
    );
    assert.deepEqual(
        await page.evaluate(() => ({
            sameScroll: window.__tableScroll === document.querySelector('.table-scroll'),
            sameRow:
                window.__tableRow ===
                Array.from(document.querySelectorAll('.data-table tbody tr')).find(
                    (row) => row.firstElementChild?.textContent === 'Node 40'
                ),
            scroll: document.querySelector('.table-scroll').scrollTop
        })),
        { sameScroll: true, sameRow: true, scroll: nodeScroll }
    );

    const eventBatch = Array.from({ length: 100 }, (_, index) => ({
        sequence: index + 3,
        timestamp: index + 4,
        type: 'node-updated',
        nodeId: `node-${index % 80}`,
        updateKind: 'value'
    }));
    await page.evaluate((events) => window.__enqueuePoll(4, 41, 1, events), eventBatch);
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.event-item').length >= 100);
    await page.evaluate(() => {
        const scroll = document.querySelector('.panel-view:not([hidden])');
        scroll.scrollTop = 600;
        window.__eventsScroll = scroll;
        window.__eventItem = document.querySelector('[data-event-id="sequence-50"]');
    });
    await page.evaluate(() =>
        window.__enqueuePoll(5, 42, 1, [
            { sequence: 103, timestamp: 105, type: 'node-updated', nodeId: 'node-42', updateKind: 'value' }
        ])
    );
    await page.waitForFunction(() => document.querySelector('[data-event-id="sequence-103"]'));
    const eventResult = await page.evaluate(() => ({
        sameScroll: window.__eventsScroll === document.querySelector('.panel-view:not([hidden])'),
        sameItem: window.__eventItem === document.querySelector('[data-event-id="sequence-50"]'),
        scroll: document.querySelector('.panel-view:not([hidden])').scrollTop
    }));
    assert.equal(eventResult.sameScroll, true);
    assert.equal(eventResult.sameItem, true);
    assert(eventResult.scroll > 0, 'new events must not reset the events view to the top');
} finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
