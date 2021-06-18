import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

interface MemoryServiceModel {
	recentProject?: string;
	recentTabs?: string[];
	focusedTab?: string;
}

class MemoryService {
	private model: MemoryServiceModel;

	constructor() {
		try {
			if (existsSync(join(storageFolder, stateFile))) {
				this.model = JSON.parse(readFileSync(join(storageFolder, stateFile), 'utf8'));
			} else {
				this.model = {};
			}
		} catch (e) {
			console.warn(e);
			this.model = {};
		}
	}

	public hasRecentTabs(): boolean {
		return !!this.model.recentTabs;
	}

	public getRecentTabs(): string[] {
		return this.model.recentTabs;
	}

	public persistRecentTabs(tabs: string[]): void {
		this.model.recentTabs = tabs;
		this.save();
	}

	public hasFocusedTab(): boolean {
		return !!this.model.focusedTab;
	}

	public getFocusedTab(): string {
		return this.model.focusedTab;
	}

	public persistFocusedTab(focusedTab: string): void {
		if (this.model.focusedTab === focusedTab) {
			return;
		}

		this.model.focusedTab = focusedTab;
		this.save();
	}

	public hasRecentProject(): boolean {
		return !!this.model.recentProject;
	}

	public getRecentProject(): string {
		return this.model.recentProject;
	}

	public persistRecentProject(recent: string): void {
		this.model.recentProject = recent;
		this.save();
	}

	private save(): void {
		writeFileSync(join(storageFolder, stateFile), JSON.stringify(this.model, undefined, 4));
	}
}

const storageFolder = '.aurum_engine_editor';
const stateFile = 'editor_state.json';

if (!existsSync(storageFolder)) {
	mkdirSync(storageFolder);
}
if (!statSync(storageFolder).isDirectory()) {
	unlinkSync(storageFolder);
	mkdirSync(storageFolder);
}
export const memoryService = new MemoryService();
