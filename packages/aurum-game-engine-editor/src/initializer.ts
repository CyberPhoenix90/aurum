import { dirname, join } from 'path';
import { rootFolder } from './root';

document.addEventListener('DOMContentLoaded', async () => {
    const defineMap = {};
    const pendingDefine: { [id: string]: { cb(...args: any[]): void; exported: {}; deps: string[] } } = {};
    let amd = false;

    function amdHas(id: string) {
        return id in defineMap || id in pendingDefine;
    }

    function amdGet(id: string) {
        if (!defineMap[id]) {
            const { exported, cb, deps } = pendingDefine[id];
            delete pendingDefine[id];
            defineMap[id] = exported;
            cb(
                ...deps.map((e) => {
                    if (e === 'require') {
                        return {};
                    }

                    if (e === 'exports') {
                        return exported;
                    }
                    if (amdHas(e)) {
                        return amdGet(e);
                    }
                    return require(e);
                })
            );
        }
        return defineMap[id];
    }

    //@ts-ignore
    global.define = function (id: string | number, deps: string[], cb: any) {
        amd = true;
        pendingDefine[id] = {
            deps,
            cb,
            exported: {}
        };
    };
    function enableModuleMapping(moduleMap: { [key: string]: string }) {
        const module = require('module');

        const original = module.prototype.require;
        module.prototype.require = function (path: string, ...args: any[]) {
            const originalId = path;
            if (moduleMap[path]) {
                path = moduleMap[path];
            }
            if (require.cache[path]) {
                return require.cache[path].exports;
            }

            const result = original.call(this, path, ...args);
            if (amd) {
                amd = false;
                //@ts-ignore
                require.cache[path] = {
                    exports: amdGet(originalId),
                    id: '.',
                    filename: path,
                    loaded: true,
                    parent: null,
                    children: [],
                    path: dirname(path)
                };
                return amdGet(originalId);
            } else {
                return result;
            }
        };
    }

    enableModuleMapping({
        '@emotion/css': join(rootFolder, '../node_modules/@emotion/css/dist/emotion-css.umd.min'),
        aurumjs: join(rootFolder, '../node_modules/aurumjs'),
        'aurum-components': join(rootFolder, '../node_modules/aurum-components')
    });

    import('./main');
});
