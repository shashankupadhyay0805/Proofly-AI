import 'dotenv/config';
import { createApp } from './app.js';
import { connectToDb } from './config/db.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

async function main() {
  await connectToDb(process.env.MONGODB_URI);
  const app = createApp();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err);
  process.exit(1);
});

