declare module 'virtual:aurum-devtools/config' {
    import type { AurumDevtoolsBuildConfig, ResolvedAurumDevtoolsMode } from '@aurum/vite-plugin';

    export const mode: ResolvedAurumDevtoolsMode;
    export const captureStacks: boolean;
    export const instrumentation: boolean;

    const config: Readonly<AurumDevtoolsBuildConfig>;
    export default config;
}
