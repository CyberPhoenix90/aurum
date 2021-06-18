import { NumberField } from 'aurum-components';
import { Aurum, ddsMap, DuplexDataSource } from 'aurumjs';

interface CameraControlProps {
	posX: DuplexDataSource<number>;
	posY: DuplexDataSource<number>;
	zoom: DuplexDataSource<number>;
}

export function CameraControls(props: CameraControlProps) {
	const { posX, posY, zoom } = props;

	return (
		<div class="scene-editor-camera-controls">
			<span>Camera </span>
			<NumberField
				value={posX.transformDuplex(
					ddsMap(
						(v) => v.toString(),
						(v) => parseInt(v) || 0
					)
				)}
			></NumberField>
			,
			<NumberField
				value={posY.transformDuplex(
					ddsMap(
						(v) => v.toString(),
						(v) => parseInt(v) || 0
					)
				)}
			></NumberField>
			<span>Zoom</span>
			<NumberField
				value={zoom.transformDuplex(
					ddsMap(
						(v) => v.toString(),
						(v) => parseFloat(v) || 1
					)
				)}
			></NumberField>
		</div>
	);
}
