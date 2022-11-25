import { currentScene } from './session.js';

class SceneManager {
    public switchScene(scene: string): void {
        currentScene.update(scene);
    }
}

export const sceneManager: SceneManager = new SceneManager();
