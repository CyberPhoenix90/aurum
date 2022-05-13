import { LayoutElementTreeNode, LayoutEngine } from 'aurum-layout-engine';
import { CancellationToken } from 'aurumjs';

export const layoutEngine: LayoutEngine = new LayoutEngine();

export function initializeLayoutEngine(rootNode: LayoutElementTreeNode, cancellationToken: CancellationToken) {
    layoutEngine.initialize(rootNode, cancellationToken);
}
