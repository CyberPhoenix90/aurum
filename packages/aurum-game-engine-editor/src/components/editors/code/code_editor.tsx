import { Aurum, AurumComponentAPI, DataFlowBoth, ddsDebounce, Renderable } from 'aurumjs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { rootFolder } from '../../../root';
import { fileUrl } from '../../../utils/url';
import { AbstractEditorProps } from '../abstract';
declare const monaco: typeof import('monaco-editor');

export interface CodeEditorProps extends AbstractEditorProps {}

export function CodeEditor(props: CodeEditorProps, children: Renderable[], api: AurumComponentAPI) {
	return (
		<div
			style="width:100%; height:100%;"
			onAttach={(div) => {
				const path = require('path');
				const amdLoader = require(join(rootFolder, '../../node_modules/monaco-editor/min/vs/loader.js'));
				const amdRequire = amdLoader.require;

				amdRequire(['vs/editor/editor.main'], function() {
					monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
						target: monaco.languages.typescript.ScriptTarget.ES2020,
						allowNonTsExtensions: true,
						moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
						module: monaco.languages.typescript.ModuleKind.CommonJS,
						jsxFactory: 'Aurum.factory',
						jsxFragmentFactory: 'Aurum.fragment',
						jsx: 2,
						noEmit: true,
						typeRoots: ['node_modules/@types']
					});

					monaco.languages.typescript.typescriptDefaults.addExtraLib(
						readFileSync(path.join(rootFolder, '../../node_modules/aurumjs/prebuilt/amd/aurumjs.d.ts'), 'utf8'),
						'node_modules/aurumjs/index.d.ts'
					);

					const monacoEditor = monaco.editor.create(div, {
						automaticLayout: true,

						theme: 'vs-dark',
						language: 'typescript'
					});

					changeCommandKeybinding(monacoEditor, 'editor.action.quickFix', monaco.KeyMod.Alt | monaco.KeyCode.Enter);
					//@ts-ignore
					const editorService = monacoEditor._codeEditorService;
					const openEditorBase = editorService.openCodeEditor.bind(editorService);
					editorService.openCodeEditor = async (input, source) => {
						const result = await openEditorBase(input, source);
						if (result === null) {
							props.openFile(input.resource.path);
						}
						return result; // always return the base result
					};

					const saveStream = props.input.content.transformDuplex(ddsDebounce(250, DataFlowBoth.UPSTREAM), api.cancellationToken);
					monacoEditor.onDidChangeModelContent(() => {
						saveStream.updateUpstream(monacoEditor.getValue());
					});
					monacoEditor.focus();

					props.input.content.listenAndRepeat((code) => {
						if (code !== monacoEditor.getValue()) {
							const models = monaco.editor.getModels();
							const uri = fileUrl(props.input.diskPath.value);
							const model = models.find((m) => m.uri.toString() === uri);
							if (model) {
								if (model.getValue() !== code) {
									model.setValue(code);
								}
								if (monacoEditor.getModel() !== model) {
									monacoEditor.setModel(model);
								}
							} else {
								monacoEditor.setModel(monaco.editor.createModel(code, 'typescript', monaco.Uri.parse(uri)));
							}
						}
					}, api.cancellationToken);

					api.cancellationToken.addCancelable(() => {
						monacoEditor.dispose();
					});
				});
			}}
		></div>
	);
}

function changeCommandKeybinding(editor, id: string, keybinding: number) {
	editor._standaloneKeybindingService.addDynamicKeybinding('-' + id, null, () => {});
	const action = editor.getAction(id);
	editor._standaloneKeybindingService.addDynamicKeybinding(id, keybinding, () => {
		action.run();
	});
}
