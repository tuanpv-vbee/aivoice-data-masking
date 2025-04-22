// src/index.ts
import { config, dataMaskConfig } from './config';
import { connectAllDatabases, disconnectAll } from './db';
import { processDatabase } from './processor';

async function main() {
  await connectAllDatabases();

  for (const dbName of config?.databases) {
    console.log(`\n===== START ${dbName} =====`);
    await processDatabase(dbName, dataMaskConfig);
    console.log(`===== END   ${dbName} =====\n`);
  } 

  await disconnectAll();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectAll();
});

