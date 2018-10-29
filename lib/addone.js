const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const ChildProcess = require('child_process');
const utils = require('@clusic/utils');

module.exports = class Addtion {
  constructor(cmd, roll) {
    this.cmd = cmd;
    this.roll = roll;
    this.addCount = 0;
    this.modifyCount = 0;
  }
  
  async render(template, output, data = {}) {
    template = path.resolve(__dirname, '..', 'template', template);
    output = path.resolve(process.cwd(), output);
    if (!fs.existsSync(template)) throw new Error('找不到模板文件:' + template);
    const code = await new Promise((resolve, reject) => {
      ejs.renderFile(template, data, function(err, str){
        if (err) return reject(err);
        resolve(str);
      });
    });
    if (!fs.existsSync(output)) this.addFile(output, code);
  }

  addFile(output, code) {
    fse.outputFileSync(output, code, 'utf8');
    this.roll(() => fse.removeSync(output));
    this.cmd.await('+', '[File]', output);
    this.addCount++;
  }

  updateFile(output, content, _content) {
    fse.outputFileSync(output, content, 'utf8');
    this.roll(() => fse.outputFileSync(output, _content, 'utf8'));
    this.cmd.success('+', output);
    this.modifyCount++;
  }
  
  prefix(...names) {
    const name = names.join('_').replace(/\//g, '_').replace(/[_-][a-z0-9]/ig, s => s.substring(1).toUpperCase());
    let first = name.charAt(0);
    const next = name.substring(1);
    return first.toUpperCase() + next;
  }
  
  async controller(cwd, ...names) {
    let filePath = names.join('/');
    if (!/\.js$/.test(filePath)) filePath += '.js';
    await this.render('controller.ejs', path.resolve(cwd, 'app', 'controller', filePath), {
      className: this.prefix(...names) + 'Controller'
    });
  }
  
  async middleware(cwd, ...names) {
    let filePath = names.join('/');
    if (!/\.js$/.test(filePath)) filePath += '.js';
    await this.render('middleware.ejs', path.resolve(cwd, 'app', 'middleware', filePath));
  }
  
  async service(cwd, ...names) {
    let filePath = names.join('/');
    if (!/\.js$/.test(filePath)) filePath += '.js';
    await this.render('service.ejs', path.resolve(cwd, 'app', 'service', filePath), {
      className: this.prefix(...names) + 'Service'
    });
  }

  async webview(cwd, ...names) {
    let filePath = names.join('/');
    if (!/\.js$/.test(filePath)) filePath += '.vue';
    await this.render('webview.ejs', path.resolve(cwd, 'app', 'webview', filePath), {
      className: this.prefix(...names) + 'Page'
    });
  }

  async asyncWebview(cwd, ...names) {
    let filePath = names.join('/');
    if (!/\.js$/.test(filePath)) filePath += '.vue';
    await this.render('webview.ejs', path.resolve(cwd, 'app', 'async-webview', filePath), {
      className: this.prefix(...names) + 'Page'
    });
  }
  
  install(cwd, ...plugins) {
    return new Promise((resolve, reject) => {
      plugins.unshift('i');
      plugins.push('--save');
      this.cmd.await('npm', ...plugins);
      const ls = ChildProcess.spawn('npm', plugins, { silent: true, cwd: cwd });
      let errors = [];
      ls.stdout.on('data', data => data.toString().split('\n').forEach(str => str && str.trim() && str.trim().length && this.cmd.success(str)));
      ls.stderr.on('data', data => data.toString().split('\n').forEach(str => {
        if (str && str.trim() && str.trim().length){
          this.cmd.watch(str);
          errors.push(str);
        }
      }));
      ls.on('exit', code => {
        if (code === 0) return resolve();
        reject(new Error('npm install catch error:' + errors.join('#')));
      });
    });
  }
  
  uninstall(cwd, ...plugins) {
    return new Promise((resolve, reject) => {
      plugins.unshift('uninstall');
      plugins.push('--save');
      this.cmd.await('npm', ...plugins);
      const ls = ChildProcess.spawn('npm', plugins, { silent: true, cwd: cwd });
      let errors = [];
      ls.stdout.on('data', data => data.toString().split('\n').forEach(str => str && str.trim() && str.trim().length && this.cmd.success(str)));
      ls.stderr.on('data', data => data.toString().split('\n').forEach(str => {
        if (str && str.trim() && str.trim().length){
          this.cmd.watch(str);
          errors.push(str);
        }
      }));
      ls.on('exit', code => {
        if (code === 0) return resolve();
        reject(new Error('npm install catch error:' + errors.join('#')));
      });
    });
  }
};