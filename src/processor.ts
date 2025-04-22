

// src/processor.ts
import { DataMaskConfigByDatabase } from './config';
import { databases } from './db';
import { AnyBulkWriteOperation } from 'mongodb';

const CHUNK_SIZE = 5000;
const BULK_SIZE = 1000;

function getDataMaskConfigForDatabase(
  dbName: string,
  dataMaskConfig: DataMaskConfigByDatabase
): Record<string, string[]> | undefined {
  return dataMaskConfig[dbName];
}
export async function getBulkOperations(
  docs: any[],
  fieldsToMask: string[]
): Promise<AnyBulkWriteOperation<any>[]> {
  return docs.map((doc) => {
    const updates: Record<string, any> = {};

    for (const fieldPath of fieldsToMask) {
      // Apply default mask to all fields
      setNestedField(updates, fieldPath, '******');
    }

    return {
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: updates },
      },
    };
  });
}

function setNestedField(obj: Record<string, any>, path: string, value: any): void {
  const keys = path?.split('.');
  let current = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
  }
}

export async function processDatabase(
  dbName: string,
  dataMaskConfig: DataMaskConfigByDatabase
) {
  const dbConfig = getDataMaskConfigForDatabase(dbName, dataMaskConfig);
  if (!dbConfig) {
    console.warn(`Configuration mask not found for database: ${dbName}`);
    return;
  }

  const db = databases[dbName];
  if (!db) {
    console.error(`Database "${dbName}" is not connected.`);
    return;
  }

  console.log(`Starting to process database "${dbName}"`);

  for (const collectionName in dbConfig) {
    const fieldsToMask = dbConfig[collectionName];
    const collection = db.collection(collectionName);

    const total = await collection.estimatedDocumentCount();
    console.log(`Collection "${collectionName}": khoảng ${total} docs, fields=[${fieldsToMask.join(', ')}]`);

    const cursor = collection.find().sort({ _id: 1 }).batchSize(CHUNK_SIZE);

    let processed = 0;
    let batch: any[] = [];

    for await (const doc of cursor) {
      batch.push(doc);

      if (batch.length >= CHUNK_SIZE) {
        await handleBatch(batch, collection, fieldsToMask, collectionName);
        processed += batch.length;
        console.log(`Masked ${processed}/${total} docs`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await handleBatch(batch, collection, fieldsToMask, collectionName);
      processed += batch.length;
      console.log(`Masked ${processed}/${total} last docs`);
    }
  }

  console.log(`Complete database "${dbName}"`);
}

async function handleBatch(
  docs: any[],
  collection: any,
  fieldsToMask: string[],
  collectionName: string
) {
  const operations = await getBulkOperations(docs, fieldsToMask);

  for (let i = 0; i < operations.length; i += BULK_SIZE) {
    const chunk = operations.slice(i, i + BULK_SIZE);
    try {
      const result = await collection.bulkWrite(chunk, { ordered: false });
      if (result.hasWriteErrors()) {
        console.error(`Write errors in ${collectionName}:`, result.getWriteErrors());
      }
    } catch (err) {
      console.error(`bulkWrite error in ${collectionName}:`, err);
    }
  }
}

