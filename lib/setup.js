const fs = require('fs');
const path = require('path');
const globby = require('globby');
const fse = require('fs-extra');
const { Signale } = require('signale');
module.exports = async (ctx, plugins, options) => {
  let name = 'npm';
  const actions = plugins.slice(0);
  actions.unshift('install');
  if (options.registry) {
    if (/^http(s)?\:\/\//i.test(options.registry)) {
      actions.push('--registry=' + options.registry);
    } else {
      name = options.registry;
    }
  }

  await ctx.util.exec(name, actions, process.cwd());
  ctx.catch(async () => {
    const _actions = plugins.slice(0);
    _actions.unshift('uninstall');
    await ctx.util.exec('npm', _actions, process.cwd());
  });

  const pluginListFile = path.resolve(process.cwd(), 'config/plugin.json');
  if (!fs.existsSync(pluginListFile)) throw new Error('this project is not a wox project');
  const PluginListExports = require(pluginListFile);
  const pluginConfigFiles = globby.sync(['config/plugin.*.json'], { cwd: process.cwd() }).map(file => path.resolve(process.cwd(), file));
  const pluginConfigExports = pluginConfigFiles.map(file => require(file));

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    const pluginPath = path.resolve(process.cwd(), 'node_modules', plugin, 'woxconfig.json');
    if (!PluginListExports[plugin]) {
      PluginListExports[plugin] = {
        enable: true
      }
    }
    if (fs.existsSync(pluginPath)) {
      const pluginExports = require(pluginPath);
      pluginConfigExports.forEach(config => {
        if (!config[plugin]) {
          config[plugin] = pluginExports;
        }
      });
    }
  }

  // fse.outputFileSync(output, code, 'utf8');
  fse.outputFileSync(pluginListFile, JSON.stringify(PluginListExports, null, 2), 'utf8');
  pluginConfigFiles.forEach((file, index) => {
    fse.outputFileSync(file, JSON.stringify(pluginConfigExports[index], null, 2), 'utf8');
  });
  const interactive = new Signale();
  interactive.success({
    message: `OK, add plugins success!`,
    suffix: '(+' + plugins.length + ')'
  });
}