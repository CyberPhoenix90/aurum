import { css } from '@emotion/css';
import { Button, FloatingWindow, TextField, WindowContent, WindowTitle } from 'aurum-components';
import { Aurum, DataSource, dsMap, AurumElementModel } from 'aurumjs';
import { ipcRenderer } from 'electron';
import { join, relative } from 'path';
import { SceneSettings } from 'aurum-game-editor-shared';
import { MessageType } from '../../../protocol';
import { currentProject } from '../../../session/session';
import { fileUrl } from '../../../utils/url';
import { popups } from '../../popups/popups';

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

interface SceneSettingsPopupProps {
    sceneSettings: SceneSettings;
    onApply(newSettings: SceneSettings): void;
}

export function SceneSettingsPopup(this: AurumElementModel<SceneSettingsPopupProps>, props: SceneSettingsPopupProps) {
    const { onApply, sceneSettings } = props;
    const music = new DataSource(sceneSettings.backgroundMusic?.track ?? '');

    return (
        <FloatingWindow
            closable
            maximizable
            draggable
            onClose={() => popups.remove(this)}
            x={window.innerWidth / 2 - 250}
            y={window.innerHeight / 2 - 200}
            w={500}
            h={300}
        >
            <WindowTitle>Scene Settings</WindowTitle>
            <WindowContent>
                <div class={style}>
                    <div class="content">
                        <div class="section">
                            <label>Background Music:</label>
                            <TextField
                                value={music}
                                decorators={
                                    <Button
                                        onClick={async () => {
                                            const file = await ipcRenderer.invoke('*', {
                                                type: MessageType.PickFile,
                                                payload: {
                                                    defaultPath: currentProject.value.folder,
                                                    filters: [{ name: 'Music file', extensions: ['mp3'] }]
                                                }
                                            });

                                            if (!file.canceled) {
                                                const path = relative(join(currentProject.value.folder, 'Assets'), file.filePaths[0]);
                                                if (!path.startsWith('..')) {
                                                    music.update(path);
                                                }
                                            }
                                        }}
                                    >
                                        ...
                                    </Button>
                                }
                            ></TextField>
                        </div>
                        {music.transform(
                            dsMap((path) => {
                                if (path) {
                                    return <audio style="width:100%" src={fileUrl(join(currentProject.value.folder, 'Assets', path))} controls></audio>;
                                }
                            })
                        )}
                    </div>
                    <div class="footer">
                        <Button onClick={() => popups.remove(this)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                popups.remove(this);
                                onApply({
                                    backgroundMusic: {
                                        track: music.value,
                                        volume: 1
                                    }
                                });
                            }}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </WindowContent>
        </FloatingWindow>
    );
}
