// src/db.ts
import { MongoClient, Db } from 'mongodb';
import { config } from './config';

let client: MongoClient;
export const databases: Record<string, Db> = {};

export async function connectAllDatabases(): Promise<void> {
  client = new MongoClient(config.uri);
  await client.connect();
  console.log(`Connected to MongoDB at ${config.uri}`);

  for (const dbName of config.databases) {
    databases[dbName] = client.db(dbName);
    console.log(`Loaded database "${dbName}"`);
  }
}

export async function disconnectAll(): Promise<void> {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}
