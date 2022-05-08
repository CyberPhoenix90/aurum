import { SceneEntityData } from 'aurum-game-editor-shared';

export class InternalEntities {
    public readonly entities: SceneEntityData[];

    constructor(entities: SceneEntityData[]) {
        this.entities = entities;
    }

    public getEntityByName(name: string): SceneEntityData {
        for (const s of this.entities) {
            const result = this.findByNameIn(name, s);
            if (result) {
                return result;
            }
        }

        return undefined;
    }

    private findByNameIn(name: string, source: SceneEntityData): SceneEntityData {
        if (source.name === name) {
            return source;
        }
        for (const c of source.children as any) {
            const result = this.findByNameIn(name, c);
            if (result) {
                return result;
            }
        }

        return undefined;
    }
}
