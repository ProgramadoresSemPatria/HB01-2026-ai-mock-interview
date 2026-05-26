import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export interface Context {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  userId?: number;
}

export function createContext(opts: CreateExpressContextOptions): Context {
  return {
    req: opts.req,
    res: opts.res,
    // userId será adicionado pelo middleware de auth quando implementado
  };
}

export type { Context as AppContext };
