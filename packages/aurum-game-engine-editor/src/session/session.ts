import { ArrayDataSource, DataSource, DuplexDataSource } from 'aurumjs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { memoryService } from '../services/memory/memory_service';
import { Project } from '../models/project';
import { ProjectFile } from '../models/project_file';
import '../services/typescript/typescript_service';

export const openDocuments = new ArrayDataSource<ProjectFile>();
export const selectedDocument = new DuplexDataSource<ProjectFile>(undefined);
export let currentProject: DataSource<Project> = new DataSource();

selectedDocument.listen((v) => {
	memoryService.persistFocusedTab(v?.diskPath.value);
});

openDocuments.listen(() => {
	memoryService.persistRecentTabs(openDocuments.getData().map((e) => e.diskPath.value));
});

export function loadProject(folder: string): void {
	memoryService.persistRecentProject(folder);
	const model = JSON.parse(readFileSync(join(folder, 'project.aurumengine'), 'utf8'));
	currentProject.update(new Project(model, folder));
}

export function closeFile(f: ProjectFile) {
	const index = openDocuments.indexOf(f);
	openDocuments.remove(f);
	if (selectedDocument.value === f) {
		if (openDocuments.length.value > index) {
			selectedDocument.updateUpstream(openDocuments.get(index));
		} else {
			selectedDocument.updateUpstream(openDocuments.get(openDocuments.length.value - 1));
		}
	}
}

/**
 * Opens a project file, which means create a tab and by default focusing it
 * @param file
 * @param noFocus Open only don't switch focus
 */
export function openFile(file: ProjectFile, noFocus: boolean = false) {
	if (!openDocuments.includes(file)) {
		openDocuments.push(file);
	}
	if (!noFocus) {
		selectedDocument.updateUpstream(file);
	}
}

if (memoryService.hasRecentProject()) {
	loadProject(memoryService.getRecentProject());
	if (currentProject.value) {
		if (memoryService.hasRecentTabs()) {
			for (const tab of memoryService.getRecentTabs()) {
				const file = currentProject.value.getFileByPath(tab);
				if (file) {
					openFile(file, true);
				}
			}
		}
		if (memoryService.hasFocusedTab()) {
			const doc = openDocuments.find((e) => e.diskPath.value === memoryService.getFocusedTab());
			if (doc) {
				selectedDocument.updateDownstream(doc);
			}
		} else {
			selectedDocument.updateDownstream(openDocuments.get(0));
		}
	}
}
