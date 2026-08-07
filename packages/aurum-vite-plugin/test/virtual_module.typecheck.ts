/// <reference path="../client.d.ts" />

import config, { captureStacks, instrumentation, mode } from 'virtual:aurum-devtools/config';

const typedMode: 'debug' | 'production' = mode;
const typedStackPolicy: boolean = captureStacks;
const typedInstrumentationPolicy: boolean = instrumentation;
const typedConfig: Readonly<{ mode: 'debug' | 'production'; captureStacks: boolean; instrumentation: boolean }> = config;

void typedMode;
void typedStackPolicy;
void typedInstrumentationPolicy;
void typedConfig;
