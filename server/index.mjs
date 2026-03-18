const port = process.env.PORT || 3001;
import { createApp, createJsonDataStore } from './app.mjs';

const store = createJsonDataStore();

await store.init();

const app = createApp({ store });

app.listen(port, () => {
  console.log(`Cat pizza backend listening on http://localhost:${port}`);
});
