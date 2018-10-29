const path = require('path');
const Addone = require('../lib/addone');
const utils = require('@clusic/utils');
module.exports = async (cmd, roll, files, options) => {
  if (!options) throw new Error('You should set file type by `--<type>`');
  const cwd = process.cwd();
  const addone = new Addone(cmd, roll);
  const pkg = utils.loadFile(path.resolve(cwd, 'package.json'));

  if (options.controller) await addone.controller(cwd, ...files);
  if (options.middleware) await addone.middleware(cwd, ...files);
  if (options.service) await addone.service(cwd, ...files);
  if (options.directive) await addone.directive(cwd, ...files);
  if (options.filter) await addone.filter(cwd, ...files);
  if (options.webview) {
    if (options.async) {
      await addone.asyncWebview(cwd, ...files);
    } else {
      await addone.webview(cwd, ...files);
    }
  }
  if (options.component) {
    if (options.async) {
      await addone.asyncComponent(cwd, ...files);
    } else {
      await addone.component(cwd, ...files);
    }
  }

  if (addone.addCount || addone.modifyCount || addone.removeCount) {
    return cmd.complete({
      prefix: '[Make]',
      message: `OK, files status: [+${addone.addCount}] [*${addone.modifyCount}]`,
      suffix: '(@' + pkg.name + ')'
    });
  }

  cmd.complete({
    prefix: '[Make]',
    message: `OK, nothing changed.`,
    suffix: '(@' + pkg.name + ')'
  });
}