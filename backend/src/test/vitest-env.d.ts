import "vitest";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
    redisUrl?: string;
  }

  export function inject<T extends keyof ProvidedContext & string>(
    key: T,
    options: { optional: true },
  ): ProvidedContext[T] | undefined;
}
