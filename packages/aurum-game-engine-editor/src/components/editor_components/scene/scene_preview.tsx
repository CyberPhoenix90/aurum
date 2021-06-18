import { css } from '@emotion/css';
import { aurumify, currentTheme } from 'aurum-components';
import { Camera, CameraGraphNode, Stage } from 'aurum-game-engine';
import { PixiJsRenderAdapter } from 'aurum-pixijs-renderer';
import { ArrayDataSource, Aurum, AurumComponentAPI, DataSource, DuplexDataSource, Renderable } from 'aurumjs';
import { Grid, SceneGrid } from './grid';
import { SceneEntityDataReactive } from './scene_edit_model';
import { DragSession, SceneRenderer } from './scene_renderer';

const style = aurumify([currentTheme], (theme, lifecycleToken) =>
	aurumify(
		[theme.fontFamily, theme.baseFontSize, theme.highlightFontColor, theme.themeColor1],
		(fontFamily, size, highlightFont, color1) => css`
			background-color: ${color1};
			font-family: ${fontFamily};
			font-size: ${size};
			color: ${highlightFont};
			overflow: hidden;

			width: 100%;
			height: 100%;
			&:focus {
				outline: rgb(168, 168, 168) solid 1px;
			}
		`,
		lifecycleToken
	)
);

interface ScenePreviewProps {
	editTarget: DataSource<SceneEntityDataReactive>;

	cameraEntities?: ArrayDataSource<SceneEntityDataReactive>;
	sceneEntities?: ArrayDataSource<SceneEntityDataReactive>;
	allowDrag?: boolean;
	cameraX: DuplexDataSource<number>;
	cameraY: DuplexDataSource<number>;
	resolutionX: DataSource<number>;
	resolutionY: DataSource<number>;
	zoom: DuplexDataSource<number>;
	grid?: SceneGrid;
}

export function ScenePreview(props: ScenePreviewProps, children: Renderable[], api: AurumComponentAPI) {
	const { cameraX, cameraY, editTarget, resolutionX, resolutionY, zoom, sceneEntities, cameraEntities } = props;
	let cameraEntity: DataSource<CameraGraphNode> = new DataSource();
	const dragSession: DataSource<DragSession> = new DataSource();
	if (props.allowDrag) {
		api.cancellationToken.registerDomEvent(window, 'mousemove', (e: MouseEvent) => {
			if (dragSession.value) {
				const { target, dragStartX, dragStartY, initPosX, initPosY } = dragSession.value;
				if (props.grid && props.grid.snap.value) {
					target.properties.x.update(
						Math.floor((initPosX + (e.clientX - dragStartX + props.grid.xSpace.value / 2)) / props.grid.xSpace.value) * props.grid.xSpace.value
					);
					target.properties.y.update(
						Math.floor((initPosY + (e.clientY - dragStartY + props.grid.ySpace.value / 2)) / props.grid.ySpace.value) * props.grid.ySpace.value
					);
				} else {
					target.properties.x.update(initPosX + (e.clientX - dragStartX));
					target.properties.y.update(initPosY + (e.clientY - dragStartY));
				}
			}
		});
		api.cancellationToken.registerDomEvent(window, 'mouseup', (e) => {
			dragSession.update(undefined);
		});
	}

	return (
		<div
			class={style}
			tabindex="0"
			onKeyDown={(e) => {
				if (editTarget.value) {
					let amount = 1;
					if (e.shiftKey) {
						amount = 10;
					}
					if (e.ctrlKey) {
						amount = 100;
					}

					switch (e.key) {
						case 'ArrowDown':
							if (typeof editTarget.value.properties.y.value === 'number') {
								editTarget.value.properties.y.update(editTarget.value.properties.y.value + amount);
							}
							break;
						case 'ArrowUp':
							if (typeof editTarget.value.properties.y.value === 'number') {
								editTarget.value.properties.y.update(editTarget.value.properties.y.value - amount);
							}
							break;
						case 'ArrowLeft':
							if (typeof editTarget.value.properties.x.value === 'number') {
								editTarget.value.properties.x.update(editTarget.value.properties.x.value - amount);
							}
							break;
						case 'ArrowRight':
							if (typeof editTarget.value.properties.x.value === 'number') {
								editTarget.value.properties.x.update(editTarget.value.properties.x.value + amount);
							}
							break;
					}
				}
			}}
			onAttach={(node) => {
				api.cancellationToken.setInterval(() => {
					if (resolutionX.value !== node.clientWidth) {
						resolutionX.update(node.clientWidth);
					}
					if (resolutionY.value !== node.clientHeight) {
						resolutionY.update(node.clientHeight);
					}
				}, 100);
			}}
		>
			<Stage renderPlugin={new PixiJsRenderAdapter()}>
				<Camera
					x={cameraX.downStreamToDataSource()}
					y={cameraY.downStreamToDataSource()}
					resolutionX={resolutionX.aggregate([zoom], (x, z) => x / z)}
					resolutionY={resolutionY.aggregate([zoom], (y, z) => y / z)}
					width={resolutionX}
					height={resolutionY}
					onAttach={(camera) => {
						cameraEntity.update(camera);
					}}
				>
					{cameraEntities ? <SceneRenderer dragSession={dragSession} selected={editTarget} model={cameraEntities}></SceneRenderer> : undefined}
					{props.grid && (
						<Grid
							width={resolutionX.aggregate([zoom], (x, z) => x / z)}
							height={resolutionY.aggregate([zoom], (y, z) => y / z)}
							{...props.grid}
						></Grid>
					)}
				</Camera>
				<SceneRenderer dragSession={dragSession} selected={editTarget} model={sceneEntities}></SceneRenderer>
			</Stage>
		</div>
	);
}
