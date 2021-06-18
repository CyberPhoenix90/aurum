# Aurum Game Engine Editor

A game editor intended for use with the aurum game engine.

## Setup

This project requires aurum-components and aurum-game-engine to be installed separately.

After installing and building both, you need to run `npm link` in the root of aurum-components, as well as in the `./engine/` and `./render_plugins/pixijs/` folders of aurum-game-engine.

Then run

```
npm install
npm run postinstall
```

in this project, and you're good to go!

## Build and run

| Script              | Effect                                                    |
| ------------------- | --------------------------------------------------------- |
| npm run build       | Builds the project                                        |
| npm run watch       | Builds the project in watch mode, re-compiling on changes |
| npm run postinstall | Links the required modules after npm installing           |
| npm run start       | Starts electron to actually run the app                   |
