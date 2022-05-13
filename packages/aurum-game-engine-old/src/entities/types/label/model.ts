import { DataSource, ReadOnlyDataSource, ArrayDataSource } from 'aurumjs';
import { Data } from '../../../models/input_data';
import { CommonEntity } from '../../../models/entities';
import { EntityRenderModel } from '../../../rendering/model';

export interface LabelEntityStyle {
	renderCharCount?: Data<number>;
	color?: Data<string>;
	stroke?: Data<string>;
	strokeThickness?: Data<number>;
	fontSize?: Data<number>;
	fontStyle?: Data<string>;
	fontWeight?: Data<string>;
	fontFamily?: Data<string>;
	dropShadowDistance?: Data<number>;
	dropShadow?: Data<boolean>;
	dropShadowAngle?: Data<number>;
	dropShadowColor?: Data<string>;
	dropShadowFuzziness?: Data<number>;
	textBaseline?: Data<'top' | 'bottom' | 'hanging' | 'alphabetic' | 'middle'>;
}

export interface LabelEntity extends CommonEntity {
	renderCharCount?: DataSource<number>;
	text?: DataSource<string>;
	color?: DataSource<string>;
	stroke?: DataSource<string>;
	strokeThickness?: DataSource<number>;
	fontSize?: DataSource<number>;
	fontStyle?: DataSource<string>;
	fontWeight?: DataSource<string>;
	fontFamily?: DataSource<string>;
	dropShadowDistance?: DataSource<number>;
	dropShadow?: DataSource<boolean>;
	dropShadowAngle?: DataSource<number>;
	dropShadowColor?: DataSource<string>;
	dropShadowFuzziness?: DataSource<number>;
	textBaseline?: DataSource<'top' | 'bottom' | 'hanging' | 'alphabetic' | 'middle'>;
	class?: LabelEntity[] | ArrayDataSource<LabelEntity>;
}

export interface LabelEntityRenderModel extends EntityRenderModel {
	text: ReadOnlyDataSource<string>;
	renderCharCount: ReadOnlyDataSource<number>;
	color: ReadOnlyDataSource<string>;
	stroke: ReadOnlyDataSource<string>;
	strokeThickness: ReadOnlyDataSource<number>;
	fontSize: ReadOnlyDataSource<number>;
	fontStyle: ReadOnlyDataSource<string>;
	fontWeight: ReadOnlyDataSource<string>;
	fontFamily: ReadOnlyDataSource<string>;
	dropShadowDistance: ReadOnlyDataSource<number>;
	dropShadow: ReadOnlyDataSource<boolean>;
	dropShadowAngle: ReadOnlyDataSource<number>;
	dropShadowColor: ReadOnlyDataSource<string>;
	dropShadowFuzziness: ReadOnlyDataSource<number>;
	textBaseline: ReadOnlyDataSource<'top' | 'bottom' | 'hanging' | 'alphabetic' | 'middle'>;
}
