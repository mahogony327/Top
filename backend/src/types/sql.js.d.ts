declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export interface QueryExecResult {
    columns: string[];
    values: any[][];
  }

  export interface ParamsObject {
    [key: string]: any;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string, params?: ParamsObject | any[]): Database;
    exec(sql: string, params?: ParamsObject | any[]): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export class Statement {
    bind(params?: ParamsObject | any[]): boolean;
    step(): boolean;
    get(params?: ParamsObject | any[]): any[];
    getAsObject(params?: ParamsObject | any[]): { [key: string]: any };
    run(params?: ParamsObject | any[]): void;
    reset(): void;
    free(): void;
  }

  export interface SqlJsConfig {
    locateFile?: (filename: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
