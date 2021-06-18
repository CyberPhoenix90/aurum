import { DataSource } from 'aurumjs';

export interface Theme {
	highlightColor1: DataSource<string>;
	fontFamily: DataSource<string>;
	baseFontSize: DataSource<string>;
	headingFontSize: DataSource<string>;
	heading2FontSize: DataSource<string>;
	heading3FontSize: DataSource<string>;
	detailFontSize: DataSource<string>;
	baseFontColor: DataSource<string>;
	disabledFontColor: DataSource<string>;
	highlightFontColor: DataSource<string>;
	themeColor1: DataSource<string>;
	themeColor2: DataSource<string>;
	themeColor3: DataSource<string>;
	themeColor4: DataSource<string>;
}

export const darkTheme: Theme = {
	fontFamily: new DataSource('"Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'),
	baseFontSize: new DataSource('14px'),
	detailFontSize: new DataSource('11px'),
	headingFontSize: new DataSource('35px'),
	heading2FontSize: new DataSource('28px'),
	heading3FontSize: new DataSource('21px'),
	baseFontColor: new DataSource('#CFCFC2'),
	disabledFontColor: new DataSource('#AFAFA2'),
	highlightFontColor: new DataSource('#E2E2D6'),
	themeColor1: new DataSource('#1e1f1c'),
	themeColor2: new DataSource('#272822'),
	themeColor3: new DataSource('#373832'),
	themeColor4: new DataSource('#474842'),
	highlightColor1: new DataSource('#094771')
};

export const currentTheme: DataSource<Theme> = new DataSource(darkTheme);
