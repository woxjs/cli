#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');
const program = require('commander');
const catcher = require('@clusic/catch');
const utils = require('@clusic/utils');
const { Signale } = require('signale');
const Addone = require('./lib/addone');

const cmd = new Signale({
  interactive: true,
  scope: 'wox'
});

program.version(pkg.version, '-v, --version');

program
  .command('new [project]')
  .description('create a new project')
  .action(project => tryCatch(async roll => await exec('new', roll, project)));

program
  .command('add <files...>')
  .description('add files by params')
  .option('-C, --controller', 'add a controller file')
  .option('-M, --middleware', 'add a middleware file')
  .option('-S, --service', 'add a service file')
  .option('-W, --webview', 'add a webview file')
  .option('-P, --component', 'add a component file')
  .option('-D, --directive', 'add a directive file')
  .option('-F, --filter', 'add a filter file')
  .option('-A, --async', 'the webview must be a async webview')
  .allowUnknownOption()
  .action((...args) => tryCatch(async roll => await exec('add', roll, ...args)));

program
  .command('install <plugins...>')
  .alias('i')
  .description('setup wox plugins')
  .action(plugins => tryCatch(async roll => await exec('install', roll, ...plugins)));

program
  .command('uninstall <plugins...>')
  .alias('d')
  .description('remove wox plugins')
  .action(plugins => tryCatch(async roll => await exec('uninstall', roll, ...plugins)));

const pluginFilePath = path.resolve(process.cwd(), 'plugin', 'index.json');
if (fs.existsSync(pluginFilePath)) {
  const plugins = utils.loadFile(pluginFilePath);
  for (const plugin in plugins) {
    if (!plugins[plugin].enable) continue;
    const filePath = path.resolve(process.cwd(), 'node_modules', plugin, '.command.js');
    if (fs.existsSync(filePath)) {
      const fileExports = utils.loadFile(filePath);
      if (typeof fileExports === 'function') {
        fileExports(program, {
          tryCatch, exec, Addone
        });
      }
    }
  }
}

program.parse(process.argv);

function tryCatch(callback) {
  return catcher(callback, e => cmd.error(e.message));
}

async function exec(name, ...args) {
  if (typeof name === 'function') {
    return await name(cmd);
  }
  const res = utils.loadFile(path.resolve(__dirname, 'commander', name + '.js'));
  if (typeof res !== 'function') throw new Error('can not find the commander of ' + name);
  return await res(cmd, ...args);
}