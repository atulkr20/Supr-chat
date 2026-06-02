declare module "@prisma/client" {
  export class PrismaClient {
    constructor(...args: any[]);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    [model: string]: any;
  }
}
