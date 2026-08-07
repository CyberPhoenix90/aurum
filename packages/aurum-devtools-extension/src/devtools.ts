import { bindPanelVisibility } from './devtools_panel_lifecycle.js';

chrome.devtools.panels.create('Aurum', '', 'panel.html', bindPanelVisibility);
