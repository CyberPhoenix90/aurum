import { EventEmitter } from 'aurumjs';
import { ProjectFile } from '../../models/project_file';

export interface AbstractEditorProps {
	input: ProjectFile;
	openFile(path: string): void;
	onSaveRequested: EventEmitter<void>;
	onSuspend: EventEmitter<void>;
}
