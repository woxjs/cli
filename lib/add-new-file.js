const fs = require('fs');
const fse = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const { Signale } = require('signale');
const templates = require('./template');

module.exports = async (ctx, project, options = {}) => {
  const interactive = new Signale();
  const fileTemplates = [];
  if (options.component) {
    switch (options.component) {
      case 'js': fileTemplates.push(templates.jsComponent); break;
      case 'jsx': fileTemplates.push(templates.jsxComponent); break;
      default: fileTemplates.push(templates.vueComponent);
    }
  }
  ['directive', 'filter', 'mixin', 'controller', 'middleware', 'service', 'decorate', 'webview'].forEach(key => {
    if (options[key]) fileTemplates.push(templates[key]);
  });

  let count = 0;
  for (let i = 0; i < fileTemplates.length; i++) {
    const item = fileTemplates[i];
    const output = path.resolve(process.cwd(), item.dir, project + item.ext);
    const data = item.callback ? item.callback(project) : {};
    const result = await render(ctx, item.template, output, data);
    if (result) {
      count++;
    }
  }
  interactive.success({
    message: `OK, add file success!`,
    suffix: '(+' + count + ')'
  });
}

async function render(ctx, template, output, data = {}) {
  if (!fs.existsSync(template)) throw new Error('can not find template:' + template);
  const code = await new Promise((resolve, reject) => {
    ejs.renderFile(template, data, function(err, str){
      if (err) return reject(err);
      resolve(str);
    });
  });
  if (!fs.existsSync(output)) {
    fse.outputFileSync(output, code, 'utf8');
    ctx.catch(() => fs.unlinkSync(output));
    return true;
  }
}