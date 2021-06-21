import { aspectRatioCalculator, Camera, Container, Label, Panel, Sprite, Stage } from 'aurum-game-engine';
import { PixiJsRenderAdapter } from 'aurum-pixijs-renderer';
import { AurumComponentAPI, DataSource, dsMap, dsUnique, dsUpdateToken, Renderable, Suspense } from 'aurumjs';
import { Aurum } from 'aurumjs';
import { SceneModel, SceneEntityData, EntityTemplateModel } from 'aurum-game-editor-shared';
import { currentScene, backgroundMusic, InternalEntities } from 'aurum-game-editor-api';

const fileCache = new Map();

export interface SceneRendererProps {
	onAttach?(): void;
	model: SceneEntityData[];
}

export function start() {
	const size = aspectRatioCalculator.getBestSize({ x: window.innerWidth, y: window.innerHeight }, 16 / 9);
	const uiSource = new DataSource<Renderable>();

	Aurum.attach(
		<div>
			<audio
				muted="true"
				onAttach={(s) => {
					backgroundMusic.listen(() => {
						if (backgroundMusic.value) {
							s.play();
							s.muted = false;
						}
					});
				}}
				src={backgroundMusic.transform(
					dsUnique(),
					dsMap((path) => mapResource(path))
				)}
			></audio>
			<Stage renderPlugin={new PixiJsRenderAdapter()}>
				<Camera resolutionX={1280} resolutionY={720} width={size.x} height={size.y}>
					{uiSource}
				</Camera>
				<Suspense fallback={<Label color="white">Loading...</Label>}>
					<SceneLoader uiSource={uiSource} scene={currentScene}></SceneLoader>
				</Suspense>
			</Stage>
		</div>,
		document.body
	);
}

function mapResource(path: string): string {
	return `/api/resource?path=Assets/${path}`;
}

async function SceneLoader(props: { scene: DataSource<string>; uiSource: DataSource<Renderable> }): Promise<Renderable> {
	return props.scene.transform(
		dsUpdateToken(),
		dsMap(async ({ token, value: currentScene }) => {
			const { onLoad, onStart } = await import(`/api/scene_code/Scenes/${currentScene.substring(0, currentScene.length - 4)}js`);
			const model: SceneModel = JSON.parse(await downloadProjectFile('Scenes/' + currentScene));
			backgroundMusic.update(model.settings.backgroundMusic?.track);
			onLoad?.(model, token);
			props.uiSource.update(<SceneRenderer model={model.cameraEntities}></SceneRenderer>);
			return <SceneRenderer onAttach={() => onStart?.()} model={model.entities}></SceneRenderer>;
		})
	);
}

async function downloadProjectFile(path: string): Promise<string> {
	if (!fileCache.has(path)) {
		fileCache.set(path, await fetch('/api/resource?path=' + path).then((s) => s.text()));
	}

	return fileCache.get(path);
}

function SceneRenderer(props: SceneRendererProps) {
	return (
		<Container
			onAttach={() => {
				props.onAttach?.();
			}}
		>
			{props.model.map(renderSceneEntity)}
		</Container>
	);
}

function renderSceneEntity(model: SceneEntityData): Renderable {
	const ctr = selectConstructor(model.namespace, model.properties);
	if (model.properties.texture) {
		model.properties.texture = mapResource(model.properties.texture);
	}

	if (ctr instanceof Promise) {
		return ctr;
	}

	return Aurum.factory(
		ctr,
		{
			name: model.name,
			...model.properties
		},
		model.innerText ? model.innerText : (model.children.map((m) => renderSceneEntity(m)) as any)
	);
}

function selectConstructor(namespace: string, props: any): any {
	if (namespace.startsWith('@internal/')) {
		switch (namespace.split('/')[1]) {
			case 'container':
				return Container;
			case 'label':
				return Label;
			case 'sprite':
				return Sprite;
			case 'panel':
				return Panel;
		}
	} else {
		return EntityTemplateLoaderFactory(namespace);
	}
}
function EntityTemplateLoaderFactory(path: string) {
	return async function EntityTemplateLoader(props: any, children: Renderable[], api: AurumComponentAPI) {
		const model: EntityTemplateModel = JSON.parse(await downloadProjectFile(path));
		const { onInitialize } = await import(`/api/entity_template_code/${path.substring(0, path.length - 5)}.js`);
		onInitialize?.(props, new InternalEntities(model.entities), children, api);
		return (
			<Container {...props}>
				<SceneRenderer model={model.entities}></SceneRenderer>
			</Container>
		);
	};
}
