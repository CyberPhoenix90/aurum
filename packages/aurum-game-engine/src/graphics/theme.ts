import { DataSource, ObjectDataSource } from 'aurumjs';
import { Color } from './color';

export interface Theme {
    defaultFont: DataSource<string>;
    defaultFontColor: DataSource<Color>;
    defaultFontSize: DataSource<number>;
}

export const defaultTheme: Theme = {
    defaultFont: new DataSource('Arial'),
    defaultFontColor: new DataSource(Color.WHITE),
    defaultFontSize: new DataSource(12)
};

export const theme = new ObjectDataSource<Theme>(defaultTheme);
