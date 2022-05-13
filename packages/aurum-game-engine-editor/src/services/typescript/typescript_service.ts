import { readFileSync } from 'fs';
import { join } from 'path';
import { ModuleKind, ScriptTarget, transpile } from 'typescript';
import { rootFolder } from '../../root';
import { fileUrl } from '../../utils/url';

declare const monaco: typeof import('monaco-editor');

class TypescriptService {
    constructor() {
        const amdLoader = require(join(rootFolder, '../node_modules/monaco-editor/min/vs/loader.js'));
        const amdRequire = amdLoader.require;

        amdRequire.config({
            baseUrl: fileUrl(join(rootFolder, '../node_modules/monaco-editor/min'))
        });

        // workaround monaco-css not understanding the environment
        self.module = undefined;

        amdRequire(['vs/editor/editor.main'], function () {
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                readFileSync(join(rootFolder, '../node_modules/aurumjs/prebuilt/amd/aurumjs.d.ts'), 'utf8'),
                'node_modules/aurumjs/index.d.ts'
            );
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                readFileSync(join(rootFolder, '../node_modules/aurum-game-editor-shared/prebuilt/amd/aurum-game-editor-shared.d.ts'), 'utf8'),
                '../node_modules/aurum-game-editor-shared/prebuilt/amd/aurum-game-editor-shared.d.ts'
            );
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                readFileSync(join(rootFolder, '../node_modules/aurum-game-editor-api/prebuilt/amd/aurum-game-editor-api.d.ts'), 'utf8'),
                '../node_modules/aurum-game-editor-api/prebuilt/amd/aurum-game-editor-api.d.ts'
            );
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
                readFileSync(join(rootFolder, '../node_modules/aurum-game-engine/prebuilt/amd/aurum-game-engine.d.ts'), 'utf8'),
                '../node_modules/aurum-game-engine/prebuilt/amd/aurum-game-engine.d.ts'
            );
        });
    }

    public transpile(code: string, url: string, remappedName: string, moduleType: ModuleKind = ModuleKind.AMD): string {
        return transpile(
            code,
            {
                module: moduleType,
                target: ScriptTarget.ESNext,
                inlineSourceMap: true,
                inlineSources: true
            },
            remappedName,
            [],
            url
        );
    }
}

export const typescriptService = new TypescriptService();
