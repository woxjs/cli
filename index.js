const fs = require('fs');
const path = require('path');
const resolveUp = require('resolve-up');
module.exports = (program, client) => {
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
  
  program
    .command('wox:new [project]')
    .description('create a new wox project or plugin')
    .option('-p, --plugin', 'create new plugin mode')
    .action(client.require('./lib/create-new-project'));

  program
    .command('wox:setup <plugins...>')
    .description('setup plugins into project')
    .option('-r, --registry <host>', 'which host can been choosed?')
    .action(client.require('./lib/setup.js'));

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
    const modulePaths = resolveUp(plugin);
    if (!modulePaths.length) continue;
    const modulePath = modulePaths[0];
    const execFile = path.resolve(modulePath, 'commander.js');
    if (!fs.existsSync(execFile)) continue;
    const moduleExports = require(execFile);
    if (typeof moduleExports === 'function' && moduleExports.__IS_CLI_PLUGIN__) {
      moduleExports(program, new client.constructor(modulePath, client.util, client.pkg));
    }
  }
}

module.exports.__IS_CLI_PLUGIN__ = true;