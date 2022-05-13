import { AbstractResourceManager, Resource } from './abstract_resource_manager';

class TextureManager extends AbstractResourceManager<HTMLImageElement, string> {
    public preload(id: string): Promise<Resource<HTMLImageElement, string>> {
        const data = this.resourceMap.get(id);
        if (!data) {
            throw new Error(`No Texture found for ID ${id}`);
        }

        const img = document.createElement('img');

        const p = new Promise<Resource<HTMLImageElement, string>>((resolve, reject) => {
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
export type Texture = HTMLImageElement | HTMLCanvasElement;
export type TextureReference = string;
