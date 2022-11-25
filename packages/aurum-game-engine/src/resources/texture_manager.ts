import { AbstractResourceManager, ResourceWrapper } from './abstract_resource_manager.js';

class TextureManager extends AbstractResourceManager<HTMLImageElement, string> {
    public preload(id: string): Promise<ResourceWrapper<HTMLImageElement, string>> {
        const data = this.resourceMap.get(id);
        if (!data) {
            throw new Error(`No Texture found for ID ${id}`);
        }

        const img = document.createElement('img');

        const p = new Promise<ResourceWrapper<HTMLImageElement, string>>((resolve, reject) => {
            img.addEventListener('load', () => {
                data.resource = img;
                data.isLoaded = true;
                resolve(data);
            });
            img.addEventListener('error', (e) => reject(e));
        });
        img.src = data.url;
        return p;
    }
}

export const textureManager: TextureManager = new TextureManager();
