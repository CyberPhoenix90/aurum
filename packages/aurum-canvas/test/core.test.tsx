import { Aurum } from '@aurum/rendering';
import { describe, expect, it } from 'vitest';
import { AurumGroup, AurumRectangle, ComponentType } from '../src/core.js';

describe('core entry point', () => {
    it('creates renderer-only component trees without loading HTML JSX tags', () => {
        const tree = (
            <AurumGroup>
                <AurumRectangle x={1} y={2} width={3} height={4} />
            </AurumGroup>
        );
        expect(tree.isIntrinsic).toBe(false);
        expect(ComponentType.RECTANGLE).toBeTypeOf('number');
    });
});
