import { ColorPicker, NumberField } from 'aurum-components';
import { Aurum, ddsMap, DuplexDataSource } from 'aurumjs';

interface GridControlsProps {
	xSpace: DuplexDataSource<number>;
	ySpace: DuplexDataSource<number>;
	render: DuplexDataSource<boolean>;
	color: DuplexDataSource<string>;
	snap: DuplexDataSource<boolean>;
}

export function GridControls(props: GridControlsProps) {
	const { color, render, snap, xSpace, ySpace } = props;

	return (
		<div class="scene-editor-camera-controls">
			<label style="user-select:none;">
				<input type="checkbox" checked={render}></input> Grid
			</label>
			<label style="user-select:none;">
				<input type="checkbox" checked={snap}></input> Snap
			</label>
			<NumberField
				min="2"
				value={xSpace.transformDuplex(
					ddsMap(
						(v) => v.toString(),
						(v) => parseInt(v) || 0
					)
				)}
			></NumberField>
			⨯
			<NumberField
				min="2"
				value={ySpace.transformDuplex(
					ddsMap(
						(v) => v.toString(),
						(v) => parseInt(v) || 0
					)
				)}
			></NumberField>
			<span>Color</span>
			<ColorPicker value={color}></ColorPicker>
		</div>
	);
}
