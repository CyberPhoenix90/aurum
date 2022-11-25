import { ArrayDataSource, Aurum, DataSource } from 'aurumjs';
import { AurumCodeEditor } from '../src/code_editor.js';

Aurum.attach(
    <div>
        <AurumCodeEditor
            topPanel={{
                tabs: {}
            }}
            content={{
                codeEditor: {
                    language: 'javascript'
                }
            }}
            general={{
                width: 1280,
                height: 800,
                openFile: new DataSource('a.txt'),
                files: new ArrayDataSource([
                    {
                        content: new ArrayDataSource(['function helloworld() {}']),
                        path: 'a.txt'
                    }
                ])
            }}
        ></AurumCodeEditor>
    </div>,
    document.body
);
