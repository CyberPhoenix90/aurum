import { EventEmitter } from 'aurumjs';
import { ProjectFile } from '../../models/project_file';

export interface AbstractEditorProps {
	/**
	 * Project file on which this editor operates
	 */
	input: ProjectFile;
	/**
	 * Editor is requesting to switch focus to another file in the project
	 */
	openFile(path: string): void;
	/**
	 * Parent requests for an immediate save of the content
	 */
	onSaveRequested?: EventEmitter<void>;
	/**
	 * Editor is about to be shut down and all local state is lost. Can be used to propt for save or to save immediately
	 */
	onSuspend?: EventEmitter<void>;
}
