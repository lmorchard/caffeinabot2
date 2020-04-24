const util = require('util');
const fs = require('fs');
const express = require('express');
const watch = require('watch');

const fsStat = util.promisify(fs.stat);
const fsAccess = util.promisify(fs.access);

async function initPluginModules(context, moduleNames) {
  const contextOut = { ...context };
  for (const moduleName of moduleNames) {
    const moduleContext = await initPluginModule(contextOut, moduleName);
    Object.assign(contextOut, moduleContext || {})
  }
  return contextOut;
}

async function initPluginModule(context, moduleName) {
  const modulePath = `${__dirname}/../${moduleName}`;
  const log = context.log.child({ name: moduleName });
  log.trace({ msg: 'init' });

  const handleError = (err, msg = 'init failed') => {
    if (err.code === 'ENOENT') {
      // no-op
    } else {
      log.error({ msg, error: err });
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
    handleError(err);
  }

  try {
    const modulePublicPath = `${modulePath}/public`;
    const modulePublicStat = await fsStat(modulePublicPath); 
    if (modulePublicStat.isDirectory()) {
      await webFrontendServe(context, `/${moduleName}`, modulePublicPath);
      log.trace({ msg: `static web file path`, modulePublicPath, moduleName });
    };
  } catch (err) {
    handleError(err);
  }

  return moduleContext;
}

function initModuleLogger(context, name) {
  const log = context.log.child({ name });
  log.info({ msg: 'init' });
  return log;
}

async function webFrontendServe(context, urlpath, filepath) {
  const { log, app, reloadReturned } = context;
  app.use(urlpath, express.static(filepath));
  watch.watchTree(filepath, { interval: 1.0 }, (f, curr, prev) => {
    reloadReturned.reload();
  });
}

module.exports = {
  initPluginModules,
  initPluginModule,
  initModuleLogger,
  webFrontendServe,
};
