import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Express, Router } from "express";
import { Router as createRouter } from "express";

type RouteRegistrar = (router: Router) => void;

const modulesDir = join(dirname(fileURLToPath(import.meta.url)), "../modules");

function resolveMountPath(routeFilePath: string): string {
  const normalized = routeFilePath.replace(/\\/g, "/");
  const match = normalized.match(/\/modules\/([^/]+)\/routes\//);

  if (!match) {
    throw new Error(
      `Cannot resolve mount path for route file: ${routeFilePath}`,
    );
  }

  return `/api/${match[1]}`;
}

async function discoverRouteFiles(): Promise<string[]> {
  const routeFiles: string[] = [];
  const moduleEntries = await readdir(modulesDir, { withFileTypes: true });

  for (const moduleEntry of moduleEntries) {
    if (!moduleEntry.isDirectory()) {
      continue;
    }

    const routesDir = join(modulesDir, moduleEntry.name, "routes");

    let routeEntries;
    try {
      routeEntries = await readdir(routesDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const routeEntry of routeEntries) {
      if (!routeEntry.isFile() || !routeEntry.name.endsWith("routes.ts")) {
        continue;
      }

      routeFiles.push(join(routesDir, routeEntry.name));
    }
  }

  return routeFiles.sort();
}

export async function setupRoutes(app: Express): Promise<void> {
  const routeFiles = await discoverRouteFiles();

  for (const routeFilePath of routeFiles) {
    const mountPath = resolveMountPath(routeFilePath);
    const routeModule = await import(pathToFileURL(routeFilePath).href);
    const registerRoutes = routeModule.default as RouteRegistrar | undefined;

    if (typeof registerRoutes !== "function") {
      throw new Error(
        `Route module "${routeFilePath}" must export a default route registrar function`,
      );
    }

    const router = createRouter();
    registerRoutes(router);
    app.use(mountPath, router);
  }
}
