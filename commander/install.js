const fs = require('fs');
const path = require('path');
const Addone = require('../lib/addone');
const utils = require('@clusic/utils');
module.exports = async (cmd, roll, ...plugins) => {
  const pkg = utils.loadFile(path.resolve(process.cwd(), 'package.json'));
  const addone = new Addone(cmd, roll);
  cmd.await('installing...');
  await addone.install(process.cwd(), ...plugins);
  roll(async () => await addone.uninstall(process.cwd(), ...plugins));
  cmd.await('adding configs ...');
  const pluginIndexFile = path.resolve(process.cwd(), 'plugin/index.json');
  if (fs.existsSync(pluginIndexFile)) {
    const pluginIndexExports = utils.loadFile(pluginIndexFile);
    const _temp = JSON.stringify(pluginIndexExports, null, 2);
    plugins.forEach(plugin => {
      if (!pluginIndexExports[plugin]) {
        pluginIndexExports[plugin] = {
          enable: true
        }
      }
    });
    fs.writeFileSync(pluginIndexFile, JSON.stringify(pluginIndexExports, null, 2), 'utf8');
    roll(() => fs.writeFileSync(pluginIndexFile, _temp, 'utf8'));
  }
  const pluginEnvFiles = [path.resolve(process.cwd(), 'plugin/development.json'), path.resolve(process.cwd(), 'plugin/production.json')];
  const result = [];
  plugins.forEach(plugin => {
    const pluginPath = path.resolve(process.cwd(), 'node_modules', plugin, '.wox.json');
    if (fs.existsSync(pluginPath)) {
      const pluginExports = utils.loadFile(pluginPath);
      result.push({
        plugin,
        exports: pluginExports
      });
    }
  });
  pluginEnvFiles.forEach(pluginEnvFile => {
    if (fs.existsSync(pluginEnvFile)) {
      const pluginEnvExports = utils.loadFile(pluginEnvFile);
      const _tmp = JSON.stringify(pluginEnvExports, null, 2);
      const i = result.reduce((n, res) => {
        if (!pluginEnvExports[res.plugin]) {
          pluginEnvExports[res.plugin] = res.exports;
          return ++n;
        }
        return n;
      }, 0);
      if (i > 0) {
        fs.writeFileSync(pluginEnvFile, JSON.stringify(pluginEnvExports, null, 2), 'utf8');
        roll(() => fs.writeFileSync(pluginEnvFile, _tmp, 'utf8'));
      }
    }
  });
  cmd.complete({
    prefix: '[Install]',
    message: `OK. ${plugins.map(p => '+' + p).join(' ')}`,
    suffix: '(@' + pkg.name + ')'
  });
}