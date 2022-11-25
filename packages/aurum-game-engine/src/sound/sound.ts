import { ActiveSoundEffect } from './active_sound_effect.js';

export interface SoundOptions {
    loop?: boolean;
    volume?: number;
}

export class Sound {
    private masterRecord: HTMLAudioElement;
    private cachedSamples: ActiveSoundEffect[];

    constructor(data: HTMLAudioElement) {
        this.masterRecord = data;
        this.cachedSamples = [new ActiveSoundEffect(data)];
    }

    public play(options: SoundOptions = {}): ActiveSoundEffect {
        const ase = this.getSoundEffect();

        ase.play(options);

        return ase;
    }

    public stopAll(): void {
        this.cachedSamples.forEach((s) => s.stop());
    }

    private getSoundEffect(): ActiveSoundEffect {
        let result = this.cachedSamples.find((s) => !s.isInUse);
        if (result) {
            return result;
        } else {
            result = new ActiveSoundEffect(this.masterRecord.cloneNode(false) as HTMLAudioElement);
            this.cachedSamples.push(result);
            return result;
        }
    }
}
