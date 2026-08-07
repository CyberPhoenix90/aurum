import type { ConfigEnv, Plugin, UserConfig } from 'vite';
import { build, type Rollup } from 'vite';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aurumDevtools, aurumDevtoolsVirtualModuleId } from '../src/index.js';

type ConfigHook = (config: UserConfig, environment: ConfigEnv) => UserConfig | Promise<UserConfig>;
type ResolveIdHook = (id: string) => string | undefined | Promise<string | undefined>;
type LoadHook = (id: string) => string | undefined | Promise<string | undefined>;

const developmentServer: ConfigEnv = {
    command: 'serve',
    mode: 'development',
    isSsrBuild: false,
    isPreview: false
};

const productionBuild: ConfigEnv = {
    command: 'build',
    mode: 'production',
    isSsrBuild: false,
    isPreview: false
};
const streamsSourceEntry = fileURLToPath(new URL('../../../aurum-streams/src/index.ts', import.meta.url));

async function configure(plugin: Plugin, environment: ConfigEnv): Promise<UserConfig> {
    expect(typeof plugin.config).toBe('function');
    return (plugin.config as ConfigHook)({}, environment);
}

async function resolveVirtualModule(plugin: Plugin): Promise<string> {
    expect(typeof plugin.resolveId).toBe('function');
    const id = await (plugin.resolveId as ResolveIdHook)(aurumDevtoolsVirtualModuleId);
    expect(id).toBeTypeOf('string');
    return id as string;
}

async function loadVirtualModule(plugin: Plugin, id: string): Promise<string> {
    expect(typeof plugin.load).toBe('function');
    const source = await (plugin.load as LoadHook)(id);
    expect(source).toBeTypeOf('string');
    return source as string;
}

describe('aurumDevtools', () => {
    it('uses rich metadata for the development server', async () => {
        const result = await configure(aurumDevtools(), developmentServer);

        expect(result.define).toMatchObject({
            __AURUM_DEVTOOLS_MODE__: '"debug"',
            __AURUM_DEVTOOLS_CAPTURE_STACKS__: 'true',
            __AURUM_DEVTOOLS_INSTRUMENTATION__: 'true'
        });
    });

    it('uses lean metadata for production builds', async () => {
        const result = await configure(aurumDevtools(), productionBuild);

        expect(result.define).toMatchObject({
            __AURUM_DEVTOOLS_MODE__: '"production"',
            __AURUM_DEVTOOLS_CAPTURE_STACKS__: 'false',
            __AURUM_DEVTOOLS_INSTRUMENTATION__: 'true'
        });
    });

    it('keeps non-production builds in debug mode', async () => {
        const result = await configure(aurumDevtools(), {
            ...productionBuild,
            mode: 'staging'
        });

        expect(result.define).toMatchObject({
            __AURUM_DEVTOOLS_MODE__: '"debug"',
            __AURUM_DEVTOOLS_CAPTURE_STACKS__: 'true',
            __AURUM_DEVTOOLS_INSTRUMENTATION__: 'true'
        });
    });

    it('honors debug overrides but never enables stacks in production mode', async () => {
        const forcedProduction = await configure(aurumDevtools({ mode: 'production', captureStacks: true }), developmentServer);
        const forcedDebug = await configure(aurumDevtools({ mode: 'debug', captureStacks: false }), productionBuild);

        expect(forcedProduction.define).toMatchObject({
            __AURUM_DEVTOOLS_MODE__: '"production"',
            __AURUM_DEVTOOLS_CAPTURE_STACKS__: 'false'
        });
        expect(forcedDebug.define).toMatchObject({
            __AURUM_DEVTOOLS_MODE__: '"debug"',
            __AURUM_DEVTOOLS_CAPTURE_STACKS__: 'false'
        });
    });

    it('can compile graph instrumentation out independently of production mode', async () => {
        const result = await configure(aurumDevtools({ mode: 'production', instrumentation: false }), productionBuild);

        expect(result.define).toMatchObject({
            __AURUM_DEVTOOLS_MODE__: '"production"',
            __AURUM_DEVTOOLS_CAPTURE_STACKS__: 'false',
            __AURUM_DEVTOOLS_INSTRUMENTATION__: 'false'
        });
    });

    it('exposes the resolved policy through a virtual module', async () => {
        const plugin = aurumDevtools();
        await configure(plugin, productionBuild);
        const resolvedId = await resolveVirtualModule(plugin);
        const source = await loadVirtualModule(plugin, resolvedId);

        expect(source).toContain('export const mode = "production";');
        expect(source).toContain('export const captureStacks = false;');
        expect(source).toContain('export const instrumentation = true;');
        expect(source).toContain('Object.freeze({ mode, captureStacks, instrumentation })');
    });

    it('does not claim unrelated module ids', async () => {
        const plugin = aurumDevtools();
        const resolveId = plugin.resolveId as ResolveIdHook;
        const load = plugin.load as LoadHook;

        expect(await resolveId('virtual:someone-else/config')).toBeUndefined();
        expect(await load('\0virtual:someone-else/config')).toBeUndefined();
    });

    it('integrates with a real Vite production build that includes @aurum/streams', async () => {
        const result = await build({
            root: fileURLToPath(new URL('../../test/fixtures/basic', import.meta.url)),
            configFile: false,
            logLevel: 'silent',
            mode: 'production',
            plugins: [aurumDevtools()],
            resolve: { alias: { '@aurum/streams': streamsSourceEntry } },
            build: {
                minify: false,
                write: false
            }
        });
        const output = (result as Rollup.RollupOutput).output;
        const code = output
            .filter((entry): entry is Rollup.OutputChunk => entry.type === 'chunk')
            .map((entry) => entry.code)
            .join('\n');

        expect(code).toContain('mode = "production"');
        expect(code).toContain('captureStacks: false');
        expect(code).toContain('compileTimeMode = "production"');
        expect(code).toContain('compileTimeStacks = false');
        expect(code).toContain('vite fixture source');
        expect(code).toContain('runtimeMode');
    });

    it('can produce a metadata-rich diagnostic build that includes @aurum/streams', async () => {
        const result = await build({
            root: fileURLToPath(new URL('../../test/fixtures/basic', import.meta.url)),
            configFile: false,
            logLevel: 'silent',
            mode: 'production',
            plugins: [aurumDevtools({ mode: 'debug', captureStacks: true })],
            resolve: { alias: { '@aurum/streams': streamsSourceEntry } },
            build: {
                minify: false,
                write: false
            }
        });
        const output = (result as Rollup.RollupOutput).output;
        const code = output
            .filter((entry): entry is Rollup.OutputChunk => entry.type === 'chunk')
            .map((entry) => entry.code)
            .join('\n');

        expect(code).toContain('mode = "debug"');
        expect(code).toContain('captureStacks: true');
        expect(code).toContain('compileTimeMode = "debug"');
        expect(code).toContain('compileTimeStacks = true');
        expect(code).toContain('vite fixture source');
    });

    it('produces a runtime with stream instrumentation disabled', async () => {
        const instrumentationEntry = fileURLToPath(new URL('../../test/fixtures/basic/instrumentation-policy.js', import.meta.url));
        const result = await build({
            configFile: false,
            logLevel: 'silent',
            mode: 'production',
            plugins: [aurumDevtools({ mode: 'production', instrumentation: false })],
            resolve: { alias: { '@aurum/streams': streamsSourceEntry } },
            build: {
                minify: false,
                write: false,
                ssr: instrumentationEntry
            }
        });
        const output = (result as Rollup.RollupOutput).output;
        const code = output
            .filter((entry): entry is Rollup.OutputChunk => entry.type === 'chunk')
            .map((entry) => entry.code)
            .join('\n');
        const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
        const bundled = (await import(moduleUrl)) as {
            instrumentationPolicy: { enabled: boolean; nodeCount: number; sourceValue: string };
        };

        expect(bundled.instrumentationPolicy).toEqual({ enabled: false, nodeCount: 0, sourceValue: 'not registered' });
    });

    it('locks a real production runtime against promotion to debug metadata', async () => {
        const runtimePolicyEntry = fileURLToPath(new URL('../../test/fixtures/basic/runtime-policy.js', import.meta.url));
        const result = await build({
            configFile: false,
            logLevel: 'silent',
            mode: 'production',
            plugins: [aurumDevtools()],
            resolve: { alias: { '@aurum/streams': streamsSourceEntry } },
            build: {
                minify: false,
                write: false,
                ssr: runtimePolicyEntry
            }
        });
        const output = (result as Rollup.RollupOutput).output;
        const code = output
            .filter((entry): entry is Rollup.OutputChunk => entry.type === 'chunk')
            .map((entry) => entry.code)
            .join('\n');
        const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
        const bundled = (await import(moduleUrl)) as { runtimePolicy: { mode: string; captureStacks: boolean; historyLimit: number } };

        expect(bundled.runtimePolicy).toEqual({ mode: 'production', captureStacks: false, historyLimit: 0 });
    });
});
