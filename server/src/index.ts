import { createApp } from './app.ts';
import { env } from './config/env.ts';
import { connectDb } from './db/connect.ts';

await connectDb(env.MONGO_URI);
createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
