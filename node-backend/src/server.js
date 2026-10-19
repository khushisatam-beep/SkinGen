const config = require("./config");
const { createApp } = require("./app");
const { createMlClient } = require("./services/mlClient");
const { createDb } = require("./services/db");
const { createHistory } = require("./services/history");

const ml = createMlClient({ baseUrl: config.mlServiceUrl, timeoutMs: config.mlTimeoutMs });
const db = createDb(config);
const history = createHistory({ db, config });
createApp({ ml, db, history, config }).listen(config.port, () =>
  console.log(`SkinGen Node API on port ${config.port} (history ${config.enableHistory ? "enabled" : "disabled"})`));
db.connect().then(() => history.syncModelMetadata(ml));   // background: API works even if MongoDB is down
