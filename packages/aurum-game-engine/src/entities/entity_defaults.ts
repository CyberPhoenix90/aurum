import { CommonEntity } from '../models/entities';
import { DataSource, ArrayDataSource } from 'aurumjs';

export const entityDefaults: CommonEntity = {
	alpha: new DataSource(1),
	rotation: new DataSource(0),
	blendMode: new DataSource(undefined),
	clip: new DataSource(false),
	x: new DataSource(0),
	y: new DataSource(0),
	width: new DataSource(0),
	height: new DataSource(0),
	layout: new DataSource(undefined),
	ignoreLayout: new DataSource(false),
	originX: new DataSource(0),
	originY: new DataSource(0),
	scaleX: new DataSource(1),
	scaleY: new DataSource(1),
	shaders: new ArrayDataSource([]),
	visible: new DataSource(true),
	spreadLayout: new DataSource(false),
	zIndex: new DataSource(undefined)
};
