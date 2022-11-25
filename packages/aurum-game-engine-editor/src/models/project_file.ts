import { DuplexDataSource } from 'aurumjs';
import { ProjectExplorerNodeType } from '../components/project_explorer/model.js';

export interface ProjectFile {
    type: ProjectExplorerNodeType;
    diskPath: DuplexDataSource<string>;
    projectPath: DuplexDataSource<string>;
    content: DuplexDataSource<string>;
}
