import type { ConfigEnv, Plugin, UserConfig } from 'vite';

export type AurumDevtoolsMode = 'auto' | 'debug' | 'production';
export type ResolvedAurumDevtoolsMode = Exclude<AurumDevtoolsMode, 'auto'>;

export interface AurumDevtoolsPluginOptions {
    /**
     * Controls the amount of diagnostic metadata retained by Aurum.
     *
     * `auto` uses debug mode for the development server and non-production
     * builds, and production mode for production builds.
     *
     * @default 'auto'
     */
    mode?: AurumDevtoolsMode;

    /**
     * Retain source allocation stacks for graph inspection in debug mode.
     * Production mode always disables stack capture.
     */
    captureStacks?: boolean;

    /**
     * Include stream and renderer graph instrumentation in the bundle.
     * Disable this for the smallest, lowest-overhead production runtime.
     *
     * @default true
     */
    instrumentation?: boolean;
}

export interface AurumDevtoolsBuildConfig {
    readonly mode: ResolvedAurumDevtoolsMode;
    readonly captureStacks: boolean;
    readonly instrumentation: boolean;
}

export const aurumDevtoolsVirtualModuleId = 'virtual:aurum-devtools/config';

const resolvedVirtualModuleId = `\0${aurumDevtoolsVirtualModuleId}`;

function resolveBuildConfig(options: Readonly<AurumDevtoolsPluginOptions>, environment: ConfigEnv): AurumDevtoolsBuildConfig {
    const mode = resolveMode(options.mode ?? 'auto', environment);

    return Object.freeze({
        mode,
        captureStacks: mode === 'debug' && (options.captureStacks ?? true),
        instrumentation: options.instrumentation ?? true
    });
}

function resolveMode(mode: AurumDevtoolsMode, environment: ConfigEnv): ResolvedAurumDevtoolsMode {
    if (mode !== 'auto') {
        return mode;
    }

    if (environment.command === 'serve') {
        return 'debug';
    }

    return environment.mode === 'production' ? 'production' : 'debug';
}

function virtualModuleSource(config: AurumDevtoolsBuildConfig): string {
    return [
        `export const mode = ${JSON.stringify(config.mode)};`,
        `export const captureStacks = ${JSON.stringify(config.captureStacks)};`,
        `export const instrumentation = ${JSON.stringify(config.instrumentation)};`,
        'const config = Object.freeze({ mode, captureStacks, instrumentation });',
        'export default config;'
    ].join('\n');
}

/**
 * Configures the diagnostic metadata emitted by Aurum when an application is
 * bundled by Vite. Instrumentation remains available in production; only the
 * expensive metadata policy changes.
 */
export function aurumDevtools(options: Readonly<AurumDevtoolsPluginOptions> = {}): Plugin {
    let buildConfig: AurumDevtoolsBuildConfig = Object.freeze({ mode: 'debug', captureStacks: true, instrumentation: true });

    return {
        name: 'aurum-devtools',
        enforce: 'pre',

        config(_config: UserConfig, environment: ConfigEnv): UserConfig {
            buildConfig = resolveBuildConfig(options, environment);

            return {
                define: {
                    __AURUM_DEVTOOLS_MODE__: JSON.stringify(buildConfig.mode),
                    __AURUM_DEVTOOLS_CAPTURE_STACKS__: JSON.stringify(buildConfig.captureStacks),
                    __AURUM_DEVTOOLS_INSTRUMENTATION__: JSON.stringify(buildConfig.instrumentation)
                }
            };
        },

        resolveId(id: string): string | undefined {
            return id === aurumDevtoolsVirtualModuleId ? resolvedVirtualModuleId : undefined;
        },

        load(id: string): string | undefined {
            return id === resolvedVirtualModuleId ? virtualModuleSource(buildConfig) : undefined;
        }
    };
}

export default aurumDevtools;
