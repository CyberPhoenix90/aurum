import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface ExtensionManifest {
    manifest_version: number;
    devtools_page: string;
    permissions?: string[];
    host_permissions?: string[];
}

describe('Chromium extension manifest', () => {
    it('declares a Manifest V3 DevTools page without site permissions', () => {
        const manifestUrl = new URL('../../static/manifest.json', import.meta.url);
        const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8')) as ExtensionManifest;

        expect(manifest.manifest_version).toBe(3);
        expect(manifest.devtools_page).toBe('devtools.html');
        expect(manifest.permissions).toBeUndefined();
        expect(manifest.host_permissions).toBeUndefined();
    });

    it('ships both DevTools and panel documents', () => {
        const devtools = readFileSync(new URL('../../static/devtools.html', import.meta.url), 'utf8');
        const panel = readFileSync(new URL('../../static/panel.html', import.meta.url), 'utf8');

        expect(devtools).toContain('devtools.js');
        expect(panel).toContain('panel.js');
        expect(panel).toContain('panel.css');
    });
});
