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
    highContrastFontColor: DataSource<string>;
    disabledFontColor: DataSource<string>;
    highlightFontColor: DataSource<string>;
    themeColor0: DataSource<string>;
    themeColor1: DataSource<string>;
    themeColor2: DataSource<string>;
    themeColor3: DataSource<string>;
    themeColor4: DataSource<string>;

    boxShadow: DataSource<string>;

    success: DataSource<string>;
    warning: DataSource<string>;
    error: DataSource<string>;
}

export const darkTheme: Theme = {
    fontFamily: new DataSource('"Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'),
    baseFontSize: new DataSource('14px'),
    detailFontSize: new DataSource('11px'),
    headingFontSize: new DataSource('35px'),
    heading2FontSize: new DataSource('28px'),
    heading3FontSize: new DataSource('21px'),
    baseFontColor: new DataSource('#CFCFC2'),
    highContrastFontColor: new DataSource('#FFFFFF'),
    disabledFontColor: new DataSource('#AFAFA2'),
    highlightFontColor: new DataSource('#E2E2D6'),
    themeColor0: new DataSource('#0f100f'),
    themeColor1: new DataSource('#1e1f1c'),
    themeColor2: new DataSource('#272822'),
    themeColor3: new DataSource('#373832'),
    themeColor4: new DataSource('#474842'),
    highlightColor1: new DataSource('#094771'),
    boxShadow: new DataSource('0px 0px 8px 1px black'),
    success: new DataSource('#4caf50'),
    warning: new DataSource('#f8a700'),
    error: new DataSource('#e25252')
};

export const lightTheme: Theme = {
    fontFamily: new DataSource('"Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'),
    baseFontSize: new DataSource('14px'),
    detailFontSize: new DataSource('11px'),
    headingFontSize: new DataSource('35px'),
    heading2FontSize: new DataSource('28px'),
    heading3FontSize: new DataSource('21px'),
    baseFontColor: new DataSource('#37474f'),
    highContrastFontColor: new DataSource('#000000'),
    disabledFontColor: new DataSource('#AFAFAF'),
    highlightFontColor: new DataSource('#E2E2E2'),
    themeColor0: new DataSource('#EEEEF4'),
    themeColor1: new DataSource('#FAFAF5'),
    themeColor2: new DataSource('#FAFAF5'),
    themeColor3: new DataSource('#FFFFFF'),
    themeColor4: new DataSource('#FFFFFF'),
    highlightColor1: new DataSource('#094f71'),
    boxShadow: new DataSource('0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 2px 0px rgb(0 0 0 / 26%), 0px 2px 3px 0px rgb(0 0 0 / 12%)'),
    success: new DataSource('#4caf50'),
    warning: new DataSource('#f8a500'),
    error: new DataSource('#e25252')
};

export const currentTheme: DataSource<Theme> = new DataSource(darkTheme);
