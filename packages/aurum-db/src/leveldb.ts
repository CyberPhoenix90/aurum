export type TextEncodings =
    | "utf8"
    | "hex"
    | "ascii"
    | "base64"
    | "ucs2"
    | "utf16le"
    | "utf-16le";

export type JsonEncoding = "json";

export type BinaryEncodings = "binary";

export type Encodings = TextEncodings | BinaryEncodings | JsonEncoding;

export interface EncodingOptions {
    keyEncoding?: Encodings;
    valueEncoding?: Encodings;
}
