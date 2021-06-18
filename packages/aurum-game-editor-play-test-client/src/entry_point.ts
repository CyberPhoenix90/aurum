/// <reference types="requirejs" />
//@ts-ignore
require.jsExtRegExp = /^\/|:|\?$/;
requirejs.config({
    paths: {
        "pixi.js": "node_modules/pixi.js/dist/browser/pixi",
        aurumjs: "node_modules/aurumjs/prebuilt/amd/aurumjs",
        ["aurum-game-editor-api"]:
            "node_modules/aurum-game-editor-api/prebuilt/amd/aurum-game-editor-api",
        ["aurum-game-engine"]:
            "node_modules/aurum-game-engine/prebuilt/amd/aurum-game-engine",
        ["aurum-pixijs-renderer"]:
            "node_modules/aurum-pixijs-renderer/prebuilt/amd/aurum-pixijs-renderer",
    },
    shim: {
        "pixi.js": {
            exports: "PIXI",
        },
    },
});

///@ts-ignore
require(["startup"], (startup) => {
    startup.start();
});
