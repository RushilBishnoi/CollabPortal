import { Express } from 'express';
import express from 'express';
import { createNestApp } from '../src/main';

let cachedServer: Express | null = null;
let isInitializing: Promise<Express> | null = null;

async function getCachedServer(): Promise<Express> {
  if (cachedServer) {
    return cachedServer;
  }

  if (!isInitializing) {
    isInitializing = (async () => {
      const expressApp = express();
      const { app } = await createNestApp(expressApp);
      await app.init();
      cachedServer = expressApp;
      return expressApp;
    })();
  }

  return isInitializing;
}

export default async function handler(req: any, res: any) {
  const server = await getCachedServer();
  return server(req, res);
}
