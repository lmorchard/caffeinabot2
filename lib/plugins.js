const util = require('util');
const fs = require('fs');

const fsStat = util.promisify(fs.stat);
const fsAccess = util.promisify(fs.access);

async function initPluginModules(context, moduleNames) {
  const contextOut = { ...context };
  for (const moduleName of moduleNames) {
    const moduleContext = await initPluginModule(contextOut, moduleName);
    Object.assign(contextOut, moduleContext || {});
  }
  return contextOut;
}

async function initPluginModule(context, moduleName) {
  const { services } = context;
  const modulePath = `${__dirname}/../${moduleName}`;
  const log = context.log.child({ name: moduleName });
  log.trace({ msg: 'init' });

  const handleError = (err, msg = 'init failed') => {
    if (err.code === 'ENOENT') {
      // no-op
    } else {
      log.error({ msg, error: err, errorMsg: err.toString() });
    }
  };

  let moduleContext = {};
  try {
    const moduleInitPath = `${modulePath}/index.js`;
    await fsAccess(moduleInitPath, fs.constants.R_OK);
    const moduleInit = require(moduleInitPath);
    moduleContext = await moduleInit({
      ...context,
      log,
      moduleName,
    });
    log.trace({ msg: `init module context`, moduleName });
  } catch (err) {
    handleError(err, 'failed module context init');
  }

  try {
    if (context.app) {
      const modulePublicPath = `${modulePath}/public`;
      const modulePublicStat = await fsStat(modulePublicPath);
      if (modulePublicStat.isDirectory()) {
        await services.call('web:server:serveStatic', {
          urlpath: `/${moduleName}`,
          filepath: modulePublicPath,
        });
      }
    }
  } catch (err) {
    handleError(err, 'failed static web files');
  }

  return moduleContext;
}

function initModuleLogger(context, name) {
  const log = context.log.child({ name });
  log.info({ msg: 'init' });
  return log;
}

module.exports = {
  initPluginModules,
  initPluginModule,
  initModuleLogger,
};
