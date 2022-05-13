import { HSVVector } from './color_vectors/hsv_vector';
import { RGBAVector } from './color_vectors/rgba_vector';
import { HSLAVector } from './color_vectors/hsla_vector';
import { HSVAVector } from './color_vectors/hsva_vector';
import { clamp } from '../utilities/math_utils';

const PARSE_RGBA = /rgba\((\d\d?\d?)\s*,\s*(\d\d?\d?)\s*,\s*(\d\d?\d?)\s*,\s*(\d\.?[\d]*)\)/i;
const PARSE_RGB = /rgb\((\d\d?\d?)\s*,\s*(\d\d?\d?)\s*,\s*(\d\d?\d?)\)/i;
const PARSE_HSLA = /hsla\(([-]{0,1}[\d]+\.?[\d]*)\s*,\s*(\d\d?\d?%)\s*,\s*(\d\d?\d?%)\s*,\s*(\d\.?[\d]*)\)/i;
const PARSE_HSL = /hsl\(([-]{0,1}[\d]+\.?[\d]*)\s*,\s*(\d\d?\d?%)\s*,\s*(\d\d?\d?%)\)/i;
const PARSE_HSVA = /hsva\(([-]{0,1}[\d]+\.?[\d]*)\s*,\s*(\d\d?\d?%)\s*,\s*(\d\d?\d?%)\s*,\s*(\d\.?[\d]*)\)/i;
const PARSE_HSV = /hsv\(([-]{0,1}[\d]+\.?[\d]*)\s*,\s*(\d\d?\d?%)\s*,\s*(\d\d?\d?%)\)/i;

export class Color {
    public get r() {
        return this.rgbaMemory.r;
    }

    public get g() {
        return this.rgbaMemory.g;
    }

    public get b() {
        return this.rgbaMemory.b;
    }

    public get a() {
        return this.rgbaMemory.a;
    }

    public set r(value: number) {
        this.rgbaMemory.r = value;
        this.applyRGBOverflow();
        this.updateHSV();
    }

    public set g(value: number) {
        this.rgbaMemory.g = value;
        this.applyRGBOverflow();
        this.updateHSV();
    }

    public set b(value: number) {
        this.rgbaMemory.b = value;
        this.applyRGBOverflow();
        this.updateHSV();
    }

    public set a(value: number) {
        this.rgbaMemory.a = value;
        this.applyRGBOverflow();
    }

    public get hue() {
        return this.hsvMemory.h;
    }

    public get saturation() {
        return this.hsvMemory.s;
    }

    public get value() {
        return this.hsvMemory.v;
    }

    public set hue(value: number) {
        this.hsvMemory.h = value;
        this.applyHSVOverflow();
        this.updateRGB();
    }

    public set saturation(value: number) {
        this.hsvMemory.s = value;
        this.applyHSVOverflow();
        this.updateRGB();
    }

    public set value(value: number) {
        this.hsvMemory.v = value;
        this.applyHSVOverflow();
        this.updateRGB();
    }

    public get rgbaAverage() {
        return this.rgbaMemory.arithmeticAverage();
    }

    /**
     * There are different formulas for this. What this tries to express is how bright the color appears to the human eye. This is not simply the sum of RGB because blue for example appears much darker than green even at the same intensity levels.
     * 0 = black
     * 1 = white
     */
    public getPerceivedLightness(): number {
        return clamp(0.299 * this.r + 0.587 * this.g + 0.114 * this.b, 0, 1);
    }

    public invert() {
        this.hue = (this.hue + 180) % 360;
    }

    public setPerceivedLightness(lightness: number): this {
        lightness = clamp(lightness, 0, 1);

        const sum = this.rgbaMemory.r + this.rgbaMemory.g + this.rgbaMemory.b;

        let rFactor;
        let gFactor;
        let bFactor;

        if (sum > 0) {
            rFactor = this.rgbaMemory.r / sum;
            gFactor = this.rgbaMemory.g / sum;
            bFactor = this.rgbaMemory.b / sum;
        } else {
            rFactor = 0.33333;
            gFactor = 0.33333;
            bFactor = 0.33333;
        }

        const targetSum = 0xff * 3 * lightness;

        this.rgbaMemory.r = rFactor * targetSum;
        this.rgbaMemory.g = gFactor * targetSum;
        this.rgbaMemory.b = bFactor * targetSum;

        this.applyRGBOverflow();
        this.updateHSV();

        return this;
    }

    private rgbaMemory: RGBAVector;
    private hsvMemory: HSVVector;

    constructor(color: RGBAVector | HSLAVector | HSVAVector) {
        const { x, y, z, w } = color;

        if (color instanceof RGBAVector) {
            this.rgbaMemory = new RGBAVector(x, y, z, w);
            this.applyRGBOverflow();
            this.updateHSV();
        } else if (color instanceof HSVAVector) {
            this.rgbaMemory = new RGBAVector(0, 0, 0, color.a);
            this.hsvMemory = color.toHSVVector();
            this.updateRGB();
            this.applyRGBOverflow();
        } else if (color instanceof HSLAVector) {
            this.rgbaMemory = color.toRGBA();
            this.applyRGBOverflow();
            this.updateHSV();
        }
    }

    public static fromRGBA(red: number, green: number, blue: number, alpha: number) {
        return new Color(new RGBAVector(red, green, blue, alpha));
    }

    public static fromRGB(red: number, green: number, blue: number): Color {
        return Color.fromRGBA(red, green, blue, 255);
    }

    public static fromHSLA(hue: number, saturation: number, lightness: number, alpha: number) {
        return new Color(new HSLAVector(hue, saturation, lightness, alpha));
    }

    public static fromHSL(hue: number, saturation: number, lightness: number): Color {
        return new Color(new HSLAVector(hue, saturation, lightness, 1));
    }

    public static fromHSVA(hue: number, saturation: number, value: number, alpha: number) {
        return new Color(new HSVAVector(hue, saturation, value, alpha));
    }

    public static fromHSV(hue: number, saturation: number, value: number): Color {
        return new Color(new HSVAVector(hue, saturation, value, 1));
    }
    /**
     * Attempts to guess what color is meant based on the shape of input
     */
    public static fromString(input: string) {
        const trimmed = input.trim();
        if (trimmed.startsWith('#')) {
            return Color.fromHex(input);
        }

        if (trimmed.match(PARSE_RGBA)) {
            const [, r, g, b, a] = PARSE_RGBA.exec(trimmed);
            return Color.fromRGBA(parseInt(r), parseInt(g), parseInt(b), Math.floor(parseFloat(a) * 256));
        }

        if (trimmed.match(PARSE_RGB)) {
            const [, r, g, b] = PARSE_RGB.exec(trimmed);
            return Color.fromRGB(parseInt(r), parseInt(g), parseInt(b));
        }

        if (trimmed.match(PARSE_HSVA)) {
            const [, h, s, v, a] = PARSE_HSVA.exec(trimmed);
            return Color.fromHSVA(parseInt(h), parseFloat(s) / 100, parseFloat(v) / 100, Math.floor(parseFloat(a) * 256));
        }

        if (trimmed.match(PARSE_HSV)) {
            const [, h, s, v] = PARSE_HSV.exec(trimmed);
            return Color.fromHSV(parseInt(h), parseFloat(s) / 100, parseFloat(v) / 100);
        }

        if (trimmed.match(PARSE_HSLA)) {
            const [, h, s, l, a] = PARSE_HSLA.exec(trimmed);
            return Color.fromHSLA(parseInt(h), parseFloat(s) / 100, parseFloat(l) / 100, Math.floor(parseFloat(a) * 256));
        }

        if (trimmed.match(PARSE_HSL)) {
            const [, h, s, l] = PARSE_HSL.exec(trimmed);
            return Color.fromHSL(parseInt(h), parseFloat(s) / 100, parseFloat(l) / 100);
        }

        return Color.fromName(trimmed);
    }

    public static fromHex(code: string) {
        if (code.length === 4 || code.length === 7) {
            return Color.fromRGBHex(code);
        } else if (code.length === 5 || code.length === 9) {
            return Color.fromRGBAHex(code);
        } else {
            return Color.BLACK;
        }
    }

    public static fromName(name: string): Color {
        const target: Color = colorByName[name.toLowerCase()];
        if (target) {
            return target.clone();
        } else {
            return undefined;
        }
    }

    private static fromRGBHex(hex: string): Color {
        if (hex[0] === '#') {
            hex = hex.substring(1);
        }

        if (hex.length === 3) {
            return Color.fromRGB(parseInt(hex.substring(0, 1), 16) * 16, parseInt(hex.substring(1, 2), 16) * 16, parseInt(hex.substring(2, 3), 16) * 16);
        } else if (hex.length === 6) {
            return Color.fromRGB(parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16));
        } else {
            throw new Error('Invalid hex color length');
        }
    }

    public static fromRGBAHex(hex: string): Color {
        if (hex[0] === '#') {
            hex = hex.substring(1);
        }

        if (hex.length === 6 || hex.length === 3) {
            return Color.fromRGBHex(hex);
        } else if (hex.length === 8 || hex.length === 4) {
            if (hex.length === 4) {
                return Color.fromRGBA(
                    parseInt(hex.substring(0, 1), 16) * 16,
                    parseInt(hex.substring(1, 2), 16) * 16,
                    parseInt(hex.substring(2, 3), 16) * 16,
                    parseInt(hex.substring(3, 4), 16) * 16
                );
            } else {
                return Color.fromRGBA(
                    parseInt(hex.substring(0, 2), 16),
                    parseInt(hex.substring(2, 4), 16),
                    parseInt(hex.substring(4, 6), 16),
                    parseInt(hex.substring(6, 8), 16)
                );
            }
        } else {
            throw new Error('Invalid hex color length');
        }
    }

    public static get RED() {
        return Color.fromRGB(255, 0, 0);
    }

    public static get GREEN() {
        return Color.fromRGB(0, 255, 0);
    }

    public static get BLUE() {
        return Color.fromRGB(0, 0, 255);
    }

    public static get WHITE() {
        return Color.fromRGB(255, 255, 255);
    }

    public static get BLACK() {
        return Color.fromRGB(0, 0, 0);
    }

    public static get GRAY() {
        return Color.fromRGB(122, 122, 122);
    }

    public static get TRANSPARENT() {
        return Color.fromRGBA(0, 0, 0, 0);
    }

    public setOpacity(opacity: number): this {
        this.a = opacity * 255;
        return this;
    }

    public getOpacity(): number {
        return this.a / 255;
    }

    public setRGBA(red: number, green: number, blue: number, alpha: number) {
        this.rgbaMemory.r = red;
        this.rgbaMemory.g = green;
        this.rgbaMemory.b = blue;
        this.rgbaMemory.a = alpha;
        this.applyRGBOverflow();
        this.updateHSV();
    }

    public setRGB(red: number, green: number, blue: number) {
        this.rgbaMemory.r = red;
        this.rgbaMemory.g = green;
        this.rgbaMemory.b = blue;
        this.applyRGBOverflow();
        this.updateHSV();
    }

    public toRGB(): string {
        return `rgb(${this.r},${this.g},${this.b})`;
    }

    public toRGBA(): string {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }

    public toHex8(): string {
        return `#${this.r.toString(16).padStart(2, '0')}${this.g.toString(16).padStart(2, '0')}${this.b.toString(16).padStart(2, '0')}${this.a
            .toString(16)
            .padStart(2, '0')}`;
    }

    public toHex6(): string {
        return `#${this.r.toString(16).padStart(2, '0')}${this.g.toString(16).padStart(2, '0')}${this.b.toString(16).padStart(2, '0')}`;
    }

    public static fromRGBNumber(value: number): Color {
        return Color.fromRGB(value >> 16, (value >> 8) & 0xff, value & 0xff);
    }

    public toRGBNumber(): number {
        return (this.r << 16) + (this.g << 8) + this.b;
    }

    public toRGBANumber(): number {
        return (this.r << 24) + (this.g << 16) + (this.b << 8) + this.a;
    }

    public toVector(): RGBAVector {
        return this.rgbaMemory.clone();
    }

    public clone(): Color {
        return new Color(this.rgbaMemory.clone());
    }

    private applyRGBOverflow() {
        this.rgbaMemory.floor();
        this.rgbaMemory.modulo(256);
    }

    private applyHSVOverflow() {
        this.hsvMemory.h = this.hsvMemory.h % 360;
        this.hsvMemory.v = clamp(this.hsvMemory.v, 0, 1);
        this.hsvMemory.s = clamp(this.hsvMemory.s, 0, 1);
    }

    private updateHSV() {
        this.hsvMemory = this.rgbaMemory.toHSV();
    }

    private updateRGB() {
        this.rgbaMemory = this.hsvMemory.toRGBA(this.a);
    }
}
const colorByName = {
    aliceblue: Color.fromHex('#f0f8ff'),
    antiquewhite: Color.fromHex('#faebd7'),
    aqua: Color.fromHex('#00ffff'),
    aquamarine: Color.fromHex('#7fffd4'),
    azure: Color.fromHex('#f0ffff'),
    beige: Color.fromHex('#f5f5dc'),
    bisque: Color.fromHex('#ffe4c4'),
    black: Color.fromHex('#000000'),
    blanchedalmond: Color.fromHex('#ffebcd'),
    blue: Color.fromHex('#0000ff'),
    blueviolet: Color.fromHex('#8a2be2'),
    brown: Color.fromHex('#a52a2a'),
    burlywood: Color.fromHex('#deb887'),
    cadetblue: Color.fromHex('#5f9ea0'),
    chartreuse: Color.fromHex('#7fff00'),
    chocolate: Color.fromHex('#d2691e'),
    coral: Color.fromHex('#ff7f50'),
    cornflowerblue: Color.fromHex('#6495ed'),
    cornsilk: Color.fromHex('#fff8dc'),
    crimson: Color.fromHex('#dc143c'),
    cyan: Color.fromHex('#00ffff'),
    darkblue: Color.fromHex('#00008b'),
    darkcyan: Color.fromHex('#008b8b'),
    darkgoldenrod: Color.fromHex('#b8860b'),
    darkgray: Color.fromHex('#a9a9a9'),
    darkgreen: Color.fromHex('#006400'),
    darkgrey: Color.fromHex('#a9a9a9'),
    darkkhaki: Color.fromHex('#bdb76b'),
    darkmagenta: Color.fromHex('#8b008b'),
    darkolivegreen: Color.fromHex('#556b2f'),
    darkorange: Color.fromHex('#ff8c00'),
    darkorchid: Color.fromHex('#9932cc'),
    darkred: Color.fromHex('#8b0000'),
    darksalmon: Color.fromHex('#e9967a'),
    darkseagreen: Color.fromHex('#8fbc8f'),
    darkslateblue: Color.fromHex('#483d8b'),
    darkslategray: Color.fromHex('#2f4f4f'),
    darkslategrey: Color.fromHex('#2f4f4f'),
    darkturquoise: Color.fromHex('#00ced1'),
    darkviolet: Color.fromHex('#9400d3'),
    deeppink: Color.fromHex('#ff1493'),
    deepskyblue: Color.fromHex('#00bfff'),
    dimgray: Color.fromHex('#696969'),
    dimgrey: Color.fromHex('#696969'),
    dodgerblue: Color.fromHex('#1e90ff'),
    firebrick: Color.fromHex('#b22222'),
    floralwhite: Color.fromHex('#fffaf0'),
    forestgreen: Color.fromHex('#228b22'),
    fuchsia: Color.fromHex('#ff00ff'),
    gainsboro: Color.fromHex('#dcdcdc'),
    ghostwhite: Color.fromHex('#f8f8ff'),
    goldenrod: Color.fromHex('#daa520'),
    gold: Color.fromHex('#ffd700'),
    gray: Color.fromHex('#808080'),
    green: Color.fromHex('#008000'),
    greenyellow: Color.fromHex('#adff2f'),
    grey: Color.fromHex('#808080'),
    honeydew: Color.fromHex('#f0fff0'),
    hotpink: Color.fromHex('#ff69b4'),
    indianred: Color.fromHex('#cd5c5c'),
    indigo: Color.fromHex('#4b0082'),
    ivory: Color.fromHex('#fffff0'),
    khaki: Color.fromHex('#f0e68c'),
    lavenderblush: Color.fromHex('#fff0f5'),
    lavender: Color.fromHex('#e6e6fa'),
    lawngreen: Color.fromHex('#7cfc00'),
    lemonchiffon: Color.fromHex('#fffacd'),
    lightblue: Color.fromHex('#add8e6'),
    lightcoral: Color.fromHex('#f08080'),
    lightcyan: Color.fromHex('#e0ffff'),
    lightgoldenrodyellow: Color.fromHex('#fafad2'),
    lightgray: Color.fromHex('#d3d3d3'),
    lightgreen: Color.fromHex('#90ee90'),
    lightgrey: Color.fromHex('#d3d3d3'),
    lightpink: Color.fromHex('#ffb6c1'),
    lightsalmon: Color.fromHex('#ffa07a'),
    lightseagreen: Color.fromHex('#20b2aa'),
    lightskyblue: Color.fromHex('#87cefa'),
    lightslategray: Color.fromHex('#778899'),
    lightslategrey: Color.fromHex('#778899'),
    lightsteelblue: Color.fromHex('#b0c4de'),
    lightyellow: Color.fromHex('#ffffe0'),
    lime: Color.fromHex('#00ff00'),
    limegreen: Color.fromHex('#32cd32'),
    linen: Color.fromHex('#faf0e6'),
    magenta: Color.fromHex('#ff00ff'),
    maroon: Color.fromHex('#800000'),
    mediumaquamarine: Color.fromHex('#66cdaa'),
    mediumblue: Color.fromHex('#0000cd'),
    mediumorchid: Color.fromHex('#ba55d3'),
    mediumpurple: Color.fromHex('#9370db'),
    mediumseagreen: Color.fromHex('#3cb371'),
    mediumslateblue: Color.fromHex('#7b68ee'),
    mediumspringgreen: Color.fromHex('#00fa9a'),
    mediumturquoise: Color.fromHex('#48d1cc'),
    mediumvioletred: Color.fromHex('#c71585'),
    midnightblue: Color.fromHex('#191970'),
    mintcream: Color.fromHex('#f5fffa'),
    mistyrose: Color.fromHex('#ffe4e1'),
    moccasin: Color.fromHex('#ffe4b5'),
    navajowhite: Color.fromHex('#ffdead'),
    navy: Color.fromHex('#000080'),
    oldlace: Color.fromHex('#fdf5e6'),
    olive: Color.fromHex('#808000'),
    olivedrab: Color.fromHex('#6b8e23'),
    orange: Color.fromHex('#ffa500'),
    orangered: Color.fromHex('#ff4500'),
    orchid: Color.fromHex('#da70d6'),
    palegoldenrod: Color.fromHex('#eee8aa'),
    palegreen: Color.fromHex('#98fb98'),
    paleturquoise: Color.fromHex('#afeeee'),
    palevioletred: Color.fromHex('#db7093'),
    papayawhip: Color.fromHex('#ffefd5'),
    peachpuff: Color.fromHex('#ffdab9'),
    peru: Color.fromHex('#cd853f'),
    pink: Color.fromHex('#ffc0cb'),
    plum: Color.fromHex('#dda0dd'),
    powderblue: Color.fromHex('#b0e0e6'),
    purple: Color.fromHex('#800080'),
    rebeccapurple: Color.fromHex('#663399'),
    red: Color.fromHex('#ff0000'),
    rosybrown: Color.fromHex('#bc8f8f'),
    royalblue: Color.fromHex('#4169e1'),
    saddlebrown: Color.fromHex('#8b4513'),
    salmon: Color.fromHex('#fa8072'),
    sandybrown: Color.fromHex('#f4a460'),
    seagreen: Color.fromHex('#2e8b57'),
    seashell: Color.fromHex('#fff5ee'),
    sienna: Color.fromHex('#a0522d'),
    silver: Color.fromHex('#c0c0c0'),
    skyblue: Color.fromHex('#87ceeb'),
    slateblue: Color.fromHex('#6a5acd'),
    slategray: Color.fromHex('#708090'),
    slategrey: Color.fromHex('#708090'),
    snow: Color.fromHex('#fffafa'),
    springgreen: Color.fromHex('#00ff7f'),
    steelblue: Color.fromHex('#4682b4'),
    tan: Color.fromHex('#d2b48c'),
    teal: Color.fromHex('#008080'),
    thistle: Color.fromHex('#d8bfd8'),
    tomato: Color.fromHex('#ff6347'),
    turquoise: Color.fromHex('#40e0d0'),
    violet: Color.fromHex('#ee82ee'),
    wheat: Color.fromHex('#f5deb3'),
    white: Color.fromHex('#ffffff'),
    whitesmoke: Color.fromHex('#f5f5f5'),
    yellow: Color.fromHex('#ffff00'),
    yellowgreen: Color.fromHex('#9acd32'),
    transparent: Color.TRANSPARENT
};
