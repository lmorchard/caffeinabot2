const config = require('./config');
const log = require('pino')(config.log);

const modules = ['backend'];

async function init() {
  let context = { log, config };
  for (const moduleName of modules) {
    const module = require(`./${moduleName}`);
    const moduleContext = (await module(context)) || {};
    Object.assign(context, moduleContext);
  }
}

init().catch((err) => log.error(err));
