declare module "pdf-parse" {
  interface LoadParameters {
    data: ArrayBuffer | Uint8Array | Buffer;
    password?: string;
  }

  interface TextResult {
    pages: { text: string }[];
    text: string;
    total: number;
  }

  class PDFParse {
    constructor(options: LoadParameters);
    getText(): Promise<TextResult>;
    destroy(): Promise<void>;
    static setWorker(workerSrc?: string): string;
    static get isNodeJS(): boolean;
  }

  export { PDFParse };
}
