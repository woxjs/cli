const fs = require('fs');
const path = require('path');
module.exports = (program, client) => {
  program
    .command('wox:new [project]')
    .description('create a new wox project or plugin')
    .option('-p, --plugin', 'create new plugin mode')
    .action(client.require('./lib/create-new-project'));

  program
    .command('wox <path>')
    .description('create a new wox file by type')
    .option('-p, --component [type]', 'create a new `Vue.component` file')
    .option('-d, --directive', 'create a new `Vue.directive` file')
    .option('-f, --filter', 'create a new `Vue.filter` file')
    .option('-x, --mixin', 'create a new `Vue.mixin` file')
    .option('-c, --controller', 'create a new `Controller` file')
    .option('-m, --middleware', 'create a new `Middleware` file')
    .option('-s, --service', 'create a new `Service` file')
    .option('-t, --decorate', 'create a new `Decorate` file')
    .option('-w, --webview', 'create a new `Decorate` file')
    .action(client.require('./lib/add-new-file'));

  let plugins = [];
  const rootConfigPath = path.resolve(process.cwd(), 'config/plugin.json');
  const packageFilePath = path.resolve(process.cwd(), 'package.json');

  if (fs.existsSync(rootConfigPath)) {
    plugins = Object.keys(require(rootConfigPath));
  } else {
    if (fs.existsSync(packageFilePath)) {
      const pkg = require(packageFilePath);
      if (pkg.plugin) {
        plugins = pkg.plugin.dependencies;
      }
    }
  }

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    let modulePath;
    try{ modulePath = require.resolve(plugin); }catch(e) {}
    if (modulePath) {
      const moduleExports = require(modulePath);
      const moduleDir = path.dirname(modulePath);
      if (typeof moduleExports === 'function' && moduleExports.__IS_CLI_PLUGIN__) {
        moduleExports(program, new client.constructor(moduleDir, ctx.util, ctx.pkg));
      }
    }
  }
}

module.exports.__IS_CLI_PLUGIN__ = true;