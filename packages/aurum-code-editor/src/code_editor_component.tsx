import { DataSource, Aurum, ArrayDataSource } from 'aurumjs';
import { FileTreeFile } from './model.js';

export interface CodeEditorProps {
    file: FileTreeFile;
    width: DataSource<number>;
    height: DataSource<number>;
    language: DataSource<string>;
}

export function CodeEditor(props: CodeEditorProps) {
    return (
        <div
            class="monaco"
            style="width:100%;height:100%"
            onDetach={() => {}}
            onAttach={(div) => {
                //@ts-ignore
                require(['vs/editor/editor.main'], function () {
                    //@ts-ignore
                    const editor = monaco.editor.create(div as HTMLDivElement, {
                        value:
                            props.file.content instanceof ArrayDataSource
                                ? props.file.content.getData().join('\n')
                                : `Binary data is not supported by this editor`,
                        minimap: {
                            enabled: false
                        },
                        theme: 'vs-dark',
                        language: props.language.value
                    });

                    // editor.onKeyUp(() => data.code.update(editor.getValue()));
                });
            }}
        ></div>
    );
}
