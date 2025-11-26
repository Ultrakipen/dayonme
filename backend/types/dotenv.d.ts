declare module 'dotenv' {
    interface DotenvParseOutput {
      [key: string]: string;
    }
  
    interface DotenvConfigOptions {
      path?: string;
      encoding?: string;
      debug?: boolean;
    }
  
    interface DotenvConfigOutput {
      error?: Error;
      parsed?: DotenvParseOutput;
    }
  
    function config(options?: DotenvConfigOptions): DotenvConfigOutput;
    function parse(src: Buffer | string): DotenvParseOutput;
  
    export { config, parse };
  }
  