import { Aurum, DataSource } from 'aurumjs';
import { CommonEntityProps, Data, Texture } from '../aurum-game-engine';
import { Container } from '../entities/types/container/container_entity';
import { Sprite } from '../entities/types/sprite/sprite_entity';
import { Unit, UnitType } from '../math/unit';
import { toSourceIfDefined } from '../utilities/data/to_source';

export interface GaugeProps extends CommonEntityProps {
	filling: {
		texture: Texture;
		fillMode?: 'cutOff' | 'shrink';
		drawOffsetX?: Data<number>;
		drawOffsetY?: Data<number>;
		drawDistanceX?: Data<number>;
		drawDistanceY?: Data<number>;
	};
	background?: {
		texture: Texture;
		drawOffsetX?: Data<number>;
		drawOffsetY?: Data<number>;
		drawDistanceX?: Data<number>;
		drawDistanceY?: Data<number>;
	};
	value: Data<number>;
}

export function Gauge(props: GaugeProps, children) {
	const value = toSourceIfDefined(props.value);
	const mode = props.filling.fillMode ?? 'cutOff';

	const width = props.width;
	const height = props.height;
	delete props.width;
	delete props.height;

	return (
		<Container {...props}>
			{props.background ? (
				<Sprite
					width={width}
					height={height}
					texture={props.background.texture}
					drawDistanceX={props.background.drawDistanceX}
					drawDistanceY={props.background.drawDistanceY}
					drawOffsetX={props.background.drawOffsetX}
					drawOffsetY={props.background.drawOffsetY}
				></Sprite>
			) : undefined}
			<Sprite
				width={width}
				height={height}
				drawDistanceY={props.filling.drawDistanceY}
				drawOffsetX={props.filling.drawOffsetX}
				drawOffsetY={props.filling.drawOffsetY}
				texture={props.filling.texture}
				scaleX={value}
				drawDistanceX={value.aggregate([toSourceIfDefined(props.filling.drawOffsetX) ?? new DataSource(undefined)], (v, ddx) =>
					mode === 'cutOff' ? new Unit(v * 100, UnitType.percent) : ddx
				)}
			></Sprite>
			{children}
		</Container>
	);
}
