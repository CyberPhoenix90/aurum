import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InspectedPageBridge } from '../src/inspected_page_bridge.js';

type EvalExceptionInfo = chrome.devtools.inspectedWindow.EvalExceptionInfo;
type EvalCallback = (result: unknown, exceptionInfo?: EvalExceptionInfo) => void;
type EvalHandler = (expression: string, callback: EvalCallback) => void;

const chromeScope = globalThis as typeof globalThis & { chrome?: typeof chrome };
const originalChrome = chromeScope.chrome;
let evaluations: string[];
let handler: EvalHandler;

beforeEach(() => {
    evaluations = [];
    handler = (_expression, callback) => callback(undefined);
    chromeScope.chrome = {
        devtools: {
            inspectedWindow: {
                eval(expression: string, callback: EvalCallback): void {
                    evaluations.push(expression);
                    handler(expression, callback);
                }
            }
        }
    } as typeof chrome;
});

afterEach(() => {
    if (originalChrome === undefined) delete chromeScope.chrome;
    else chromeScope.chrome = originalChrome;
});

describe('InspectedPageBridge', () => {
    it('normalizes polls and forwards inspection, highlighting, and breakpoint operations', async () => {
        const responses: unknown[] = [
            {
                available: true,
                runtimeId: 'runtime',
                protocolVersion: 1,
                mode: 'prod',
                capabilities: ['graph', 1],
                bridgeMode: 'shared',
                droppedEvents: 2,
                snapshot: { nodes: [] },
                events: [{ sequence: 1 }],
                unchanged: false
            },
            { value: 42 },
            true,
            undefined,
            true,
            'not-a-boolean'
        ];
        handler = (_expression, callback) => callback(responses.shift());
        const bridge = new InspectedPageBridge();

        await expect(bridge.poll()).resolves.toEqual({
            available: true,
            runtimeId: 'runtime',
            protocolVersion: 1,
            mode: 'production',
            capabilities: ['graph'],
            bridgeMode: 'shared',
            droppedEvents: 2,
            snapshot: { nodes: [] },
            events: [{ sequence: 1 }],
            unchanged: false
        });
        await expect(bridge.inspect('node-"quoted"')).resolves.toEqual({ value: 42 });
        await expect(bridge.highlightDomNode('dom-node', 15_000)).resolves.toBe(true);
        await expect(bridge.clearDomNodeHighlight()).resolves.toBeUndefined();
        await expect(bridge.setUpdateBreakpoint('source', true)).resolves.toBe(true);
        await expect(bridge.setUpdateBreakpoint('source', false)).resolves.toBeUndefined();

        expect(evaluations).toHaveLength(6);
        expect(evaluations[1]).toContain('node-\\"quoted\\"');
        expect(evaluations[2]).toContain('10000');
        expect(evaluations[4]).toContain('setUpdateBreakpoint("source", true)');
    });

    it('surfaces inspected-page exceptions with the best available message', async () => {
        const bridge = new InspectedPageBridge();
        handler = (_expression, callback) => callback(undefined, { isException: true, description: 'described failure' });
        await expect(bridge.poll()).rejects.toThrow('described failure');

        handler = (_expression, callback) => callback(undefined, { isException: true, value: 'fallback failure' });
        await expect(bridge.inspect('node')).rejects.toThrow('fallback failure');

        handler = (_expression, callback) => callback(undefined, { isException: true });
        await expect(bridge.highlightDomNode('node')).rejects.toThrow('Inspected-page evaluation failed');
    });

    it('best-effort disposal clears highlighting and unregisters the panel even if both evaluations fail', async () => {
        const bridge = new InspectedPageBridge();
        handler = (_expression, callback) => callback(undefined, { isException: true, description: 'page unavailable' });

        await expect(bridge.dispose()).resolves.toBeUndefined();
        expect(evaluations).toHaveLength(2);
        expect(evaluations[0]).toContain('clearDomNodeHighlight');
        expect(evaluations[1]).toContain("@aurumjs/devtools-extension-bridge");
    });

    it('uses conservative defaults for invalid poll results', async () => {
        const bridge = new InspectedPageBridge();
        handler = (_expression, callback) => callback('not-an-object');

        await expect(bridge.poll()).resolves.toEqual({
            available: false,
            mode: 'unknown',
            capabilities: [],
            droppedEvents: 0
        });
    });
});
