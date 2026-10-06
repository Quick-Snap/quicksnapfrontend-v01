// Type definitions for qrcode
declare module "qrcode" {
  export interface QRCodeToDataURLOptions {
    type?: string;
    rendererOpts?: { quality?: number };
    errorCorrectionLevel?: "low" | "medium" | "quartile" | "high" | "L" | "M" | "Q" | "H";
    margin?: number;
    scale?: number;
    width?: number;
    color?: { dark?: string; light?: string };
  }

  export function toDataURL(
    text: string | any[],
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toDataURL(
    text: string | any[],
    callback: (error: Error | null, url: string) => void
  ): void;

  export function toDataURL(
    text: string | any[],
    options: QRCodeToDataURLOptions,
    callback: (error: Error | null, url: string) => void
  ): void;

  export function toString(
    text: string | any[],
    options?: { type?: "svg" | "utf8"; [key: string]: any }
  ): Promise<string>;

  const QRCode: {
    toDataURL: typeof toDataURL;
    toString: typeof toString;
  };

  export default QRCode;
}
