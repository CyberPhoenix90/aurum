import { css } from '@emotion/css';
import { Button, FloatingWindow, TextField, WindowContent, WindowTitle } from 'aurum-components';
import { Aurum, DataSource, Renderable, AurumElementModel } from 'aurumjs';
import { ipcRenderer } from 'electron';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MessageType } from '../../protocol.js';
import { loadProject } from '../../session/session.js';
import { popups } from './popups.js';

export interface ProjectCreationPopupProps {}

const style = css`
    margin: 12px;
    width: 100%;

    .content {
        height: calc(100% - 36px);

        .section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
    }

    .footer {
        display: flex;
        float: right;
        > * {
            margin-left: 16px;
        }
    }

    .text-field {
        width: 300px;
    }
`;

export function ProjectCreationPopup(this: AurumElementModel<ProjectCreationPopupProps>, props: ProjectCreationPopupProps): Renderable {
    const projectName: DataSource<string> = new DataSource();
    const location: DataSource<string> = new DataSource();

    return (
        <FloatingWindow closable onClose={() => popups.remove(this)} draggable x={window.innerWidth / 2 - 250} y={window.innerHeight / 2 - 200} w={500} h={400}>
            <WindowTitle>Project Creation</WindowTitle>
            <WindowContent>
                <div class={style}>
                    <div class="content">
                        <div class="section">
                            <label>Project Name:</label>
                            <TextField value={projectName}></TextField>
                        </div>
                        <div class="section">
                            <label>Location:</label>
                            <TextField
                                value={location}
                                decorators={
                                    <Button
                                        onClick={async () => {
                                            const folder = await ipcRenderer.invoke('*', {
                                                type: MessageType.PickFolder,
                                                payload: {}
                                            });

                                            if (!folder.canceled) {
                                                location.update(folder.filePaths[0]);
                                            }
                                        }}
                                    >
                                        ...
                                    </Button>
                                }
                            ></TextField>
                        </div>
                    </div>
                    <div class="footer">
                        <Button onClick={() => popups.remove(this)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                popups.remove(this);
                                const folder = join(location.value, projectName.value);
                                if (existsSync(location.value) && projectName.value && !existsSync(folder)) {
                                    mkdirSync(folder);
                                    writeFileSync(
                                        join(folder, 'project.aurumengine'),
                                        JSON.stringify({
                                            name: projectName.value
                                        })
                                    );
                                }
                                loadProject(folder);
                            }}
                        >
                            Create
                        </Button>
                    </div>
                </div>
            </WindowContent>
        </FloatingWindow>
    );
}
