const fs = require('fs');
const path = require('path');
const Addone = require('../lib/addone');
const utils = require('@clusic/utils');
module.exports = async (cmd, roll, ...plugins) => {
  const pkg = utils.loadFile(path.resolve(cwd, 'package.json'));
  const addone = new Addone(cmd, roll);
  cmd.await('installing...');
  await addone.uninstall(process.cwd(), plugins);
  cmd.await('removing configs ...');
  const pluginIndexFile = path.resolve(process.cwd(), 'plugin/index.json');
  if (fs.existsSync(pluginIndexFile)) {
    const pluginIndexExports = utils.loadFile(pluginIndexFile);
    const _temp = JSON.stringify(pluginIndexExports, null, 2);
    plugins.forEach(plugin => {
      if (pluginIndexExports[plugin]) {
        delete pluginIndexExports[plugin];
      }
    });
    fs.writeFileSync(pluginIndexFile, JSON.stringify(pluginIndexExports, null, 2), 'utf8');
    roll(() => fs.writeFileSync(pluginIndexFile, _temp, 'utf8'));
  }

  const pluginEnvFiles = [path.resolve(process.cwd(), 'plugin/development.json'), path.resolve(process.cwd(), 'plugin/production.json')];
  pluginEnvFiles.forEach(pluginEnvFile => {
    if (fs.existsSync(pluginEnvFile)) {
      const pluginEnvExports = utils.loadFile(pluginEnvFile);
      const _tmp = JSON.stringify(pluginEnvExports, null, 2);
      const i = plugins.reduce((n, plugin) => {
        if (pluginEnvExports[plugin]) {
          delete pluginEnvExports[plugin];
          return ++n;
        }
        return n;
      }, 0);
      if (i > 0) {
        fs.writeFileSync(pluginEnvFile, JSON.stringify(pluginEnvExports, null, 2), 'utf8');
        roll(() => fs.writeFileSync(pluginEnvFile, _tmp, 'utf8'));
      }
    }
  })
  cmd.complete({
    prefix: '[Install]',
    message: `OK. ${plugins.map(p => '+' + p).join(' ')}`,
    suffix: '(@' + pkg.name + ')'
  });
}