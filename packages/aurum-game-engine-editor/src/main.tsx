import { css } from '@emotion/css';
import { Dialog, MenuStrip, MenuStripMenu, MenuStripMenuContent, PanelComponent, PanelContent, PanelDockLeft, TabBar, WindowManager } from 'aurum-components';
import { Aurum, CancellationToken, ddsMap, dsMap, dsUnique, dsUpdateToken, ErrorBoundary, EventEmitter } from 'aurumjs';
import { ipcRenderer } from 'electron';
import { join, parse, relative } from 'path';
import { AboutPopup } from './components/about/about_popup';
import { CtrlTab } from './components/ctrltab/ctrltab';
import { dialogs } from './components/dialogs/dialogs';
import { AssetEditor } from './components/editors/assets/asset_editor';
import { CodeEditor } from './components/editors/code/code_editor';
import { EntityTemplateEditor } from './components/editors/entity_template/entity_template_editor';
import { NoneEditor } from './components/editors/none/none_editor';
import { SceneEditor } from './components/editors/scene/scene_editor';
import { UnknownEditor } from './components/editors/unknown/unknown_editor';
import { popups } from './components/popups/popups';
import { ProjectCreationPopup } from './components/popups/project_creation_popup';
import { ProjectExplorerNodeType } from './components/project_explorer/model';
import { ProjectExplorer } from './components/project_explorer/project_explorer';
import { ProjectFile } from './models/project_file';
import { playTestSerer } from './play_test_server/play_test_server';
import { MessageType } from './protocol';
import { closeFile, currentProject, loadProject, openDocuments, openFile, selectedDocument } from './session/session';

async function start() {
    const onSave = new EventEmitter<void>();
    let ctrlTab;
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            onSave.fire();
        }

        if (e.ctrlKey && e.key === 'Tab' && openDocuments.length.value > 1) {
            const i = openDocuments.indexOf(selectedDocument.value) + (e.shiftKey ? -1 : 1);
            selectedDocument.updateUpstream(openDocuments.get((i < 0 ? i + openDocuments.length.value : i) % openDocuments.length.value));
            if (!ctrlTab) {
                ctrlTab = (
                    <Dialog
                        target={document.body}
                        layout={{
                            direction: 'up',
                            targetPoint: 'center',
                            orientationX: 'center'
                        }}
                    >
                        <CtrlTab selectedDocument={selectedDocument} documents={openDocuments}></CtrlTab>
                    </Dialog>
                );

                dialogs.push(ctrlTab);
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (ctrlTab && e.key === 'Control') {
            dialogs.remove(ctrlTab);
            ctrlTab = undefined;
        }
    });

    Aurum.attach(
        <div
            class={css`
                height: 100%;
                #screen {
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }

                .page-body {
                    height: 100%;
                    display: flex;
                    justify-content: space-between;
                }

                .page-main {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .page-content {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
            `}
        >
            <div class="page-content">
                <div class="header">
                    <MenuStrip dialogSource={dialogs}>
                        <MenuStripMenu>
                            File
                            <MenuStripMenuContent>
                                <div onClick={() => popups.push(<ProjectCreationPopup></ProjectCreationPopup>)}>New Project</div>
                                <div
                                    onClick={async () => {
                                        const folder = await ipcRenderer.invoke('*', {
                                            type: MessageType.PickFolder,
                                            payload: {}
                                        });

                                        if (!folder.canceled) {
                                            loadProject(folder.filePaths[0]);
                                        }
                                    }}
                                >
                                    Open Project
                                </div>
                                <div>Save</div>
                                <div>Save As</div>
                            </MenuStripMenuContent>
                        </MenuStripMenu>
                        <MenuStripMenu>
                            Edit
                            <MenuStripMenuContent>
                                <div>Undo</div>
                                <div>Redo</div>
                            </MenuStripMenuContent>
                        </MenuStripMenu>
                        <MenuStripMenu>
                            Run
                            <MenuStripMenuContent>
                                <div
                                    onClick={() => {
                                        if (selectedDocument.value) {
                                            playTestSerer.open(relative(join(currentProject.value.folder, 'Scenes'), selectedDocument.value.diskPath.value));
                                        } else {
                                            playTestSerer.open();
                                        }
                                    }}
                                >
                                    From current scene
                                </div>
                                <div>From main scene</div>
                            </MenuStripMenuContent>
                        </MenuStripMenu>
                        <MenuStripMenu>
                            Export As
                            <MenuStripMenuContent>
                                <div>Electron application</div>
                                <div>Web application</div>
                                <div>Android application</div>
                            </MenuStripMenuContent>
                        </MenuStripMenu>
                        <MenuStripMenu>
                            Help
                            <MenuStripMenuContent>
                                <div onClick={() => popups.push(<AboutPopup></AboutPopup>)}>About Aurum Engine Editor</div>
                            </MenuStripMenuContent>
                        </MenuStripMenu>
                    </MenuStrip>
                </div>
                <div class="page-body">
                    <PanelComponent>
                        <PanelDockLeft size={300} resizable>
                            <ProjectExplorer project={currentProject}></ProjectExplorer>
                        </PanelDockLeft>
                        <PanelContent style="display:flex; flex-direction:column;">
                            <div class="tabs">
                                <TabBar
                                    onClose={(toRemove) => {
                                        const f = getFile(toRemove);
                                        closeFile(f);
                                    }}
                                    onReorder={(a, b) => {
                                        openDocuments.swapItems(getFile(a), getFile(b));
                                    }}
                                    canClose
                                    canReorder
                                    selected={selectedDocument.transformDuplex(
                                        ddsMap(
                                            (t) => t?.diskPath.value,
                                            (at) => currentProject.value.getFileByPath(at)
                                        )
                                    )}
                                >
                                    {openDocuments.map((e) => ({
                                        id: e.diskPath.value,
                                        content: parse(e.diskPath.value).base
                                    }))}
                                </TabBar>
                            </div>
                            <div id="screen">
                                {selectedDocument.withInitial(undefined).transform(
                                    dsUnique(),
                                    dsUpdateToken(),
                                    dsMap(({ token, value }) => (
                                        <ErrorBoundary errorFallback={(error) => error.message}> {pickEditor(value, token)}</ErrorBoundary>
                                    ))
                                )}
                            </div>
                        </PanelContent>
                    </PanelComponent>
                </div>
            </div>
            <div style="z-index:100;">
                <WindowManager>{popups}</WindowManager>
            </div>
            <div style="z-index:100;">{dialogs}</div>
        </div>,
        document.body
    );

    function getFile(doc: string): ProjectFile {
        if (doc) {
            return openDocuments.getData().find((e) => e.diskPath.value === doc);
        } else {
            return undefined;
        }
    }

    function pickEditor(selectedDocument: ProjectFile, token: CancellationToken) {
        const onSuspend = new EventEmitter<void>();
        token.addCancelable(() => onSuspend.fire());
        if (selectedDocument === undefined) {
            return (
                <NoneEditor
                    onSuspend={onSuspend}
                    onSaveRequested={onSave}
                    openFile={(path) => openFile(currentProject.value.getFileByPath(path))}
                    input={selectedDocument}
                ></NoneEditor>
            );
        }

        switch (selectedDocument.type) {
            case ProjectExplorerNodeType.Code:
                return (
                    <CodeEditor
                        onSuspend={onSuspend}
                        onSaveRequested={onSave}
                        openFile={(path) => openFile(currentProject.value.getFileByPath(path))}
                        input={selectedDocument}
                    ></CodeEditor>
                );
            case ProjectExplorerNodeType.Asset:
                return (
                    <AssetEditor
                        onSuspend={onSuspend}
                        onSaveRequested={onSave}
                        openFile={(path) => openFile(currentProject.value.getFileByPath(path))}
                        input={selectedDocument}
                    ></AssetEditor>
                );
            case ProjectExplorerNodeType.Scene:
                return (
                    <SceneEditor
                        onSuspend={onSuspend}
                        onSaveRequested={onSave}
                        openFile={(path) => openFile(currentProject.value.getFileByPath(path))}
                        input={selectedDocument}
                    ></SceneEditor>
                );
            case ProjectExplorerNodeType.EntityTemplate:
                return (
                    <EntityTemplateEditor
                        onSuspend={onSuspend}
                        onSaveRequested={onSave}
                        openFile={(path) => openFile(currentProject.value.getFileByPath(path))}
                        input={selectedDocument}
                    ></EntityTemplateEditor>
                );
            default:
                return (
                    <UnknownEditor
                        onSuspend={onSuspend}
                        onSaveRequested={onSave}
                        openFile={(path) => openFile(currentProject.value.getFileByPath(path))}
                        input={selectedDocument}
                    ></UnknownEditor>
                );
        }
    }
}

start();
