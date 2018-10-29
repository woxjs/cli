const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const unzip = require('unzip');
const inquirer = require('inquirer');
const request = require('request');
const progress = require('request-progress');
const randomString = require("randomstring");
const utils = require('@clusic/utils');
const files = [];
const githubZipUrl = 'https://codeload.github.com/woxjs/template/zip/master';
const questions = {
  project: {
    type: 'input',
    name: 'project',
    message: '输入项目名',
    validate(name) {
      if (!name) return '项目名不能为空';
      return /^[a-z0-9_\-]+$/.test(name) ? true : '项目名格式不正确';
    }
  }
}
module.exports = async (cmd, roll, project) => {
  const Question = [];
  const cwd = process.cwd();
  if (!project) Question.push(questions.project);
  if (Question.length) {
    const prompt = inquirer.createPromptModule();
    const answer = await prompt(Question);
    project = answer.project;
  }

  const projectDir = path.resolve(process.cwd(), project);
  if (fs.existsSync(projectDir)) throw new Error('项目已存在');
  fs.mkdirSync(projectDir); 
  roll(() => fse.removeSync(projectDir));
  cmd.await('+', '[Dictionary]', projectDir);

  // 下载文件
  const filename = path.resolve(cwd, randomString.generate() + '.zip');
  await download(cmd, githubZipUrl, filename);
  roll(() => fse.removeSync(filename));

  // 创建临时文件夹
  const dir = path.resolve(randomString.generate());
  fs.mkdirSync(dir);
  roll(() => fse.removeSync(dir));

  // 解包
  cmd.await('unpacking zip package ...');
  await unPack(filename, dir);
  roll(() => fse.emptyDirSync(dir));
  cmd.success('unpack success, next ...');

  // 选中文件夹
  const targetDir = selectProjectDir(dir);

  // 拷贝文件
  cmd.await('Copying files...');
  fse.copySync(targetDir, projectDir);

  // 修改信息
  const pkgPath = path.resolve(projectDir, 'package.json');
  const pkg = utils.loadFile(path.resolve(projectDir, 'package.json'));
  pkg.name = project;
  pkg.description = `The ${project} project of wox`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

  // 删除相关文件
  fse.removeSync(filename);
  fse.removeSync(dir);
  cmd.success('Project created in %s\n\nNext Steps:\n\n $ cd %s\n $ npm i\n $ npm run dev\n\n', projectDir, project);
}

function download(cmd, url, filename) {
  return new Promise((resolve, reject) => {
    cmd.await('[0%] connecting ...');
    progress(request(url))
    .on('progress', function (state) {
      cmd.await(
        '[%s] [%s] [%s]',
        parseInt(state.percent * 100) + '%',
        state.size.transferred + '/' + state.size.total,
        state.time.elapsed + 's/' + state.time.remaining + 's'
      );
    })
    .on('error', reject)
    .on('end', function () {
      cmd.success('[100%] - download success.');
      resolve();
    })
    .pipe(fs.createWriteStream(filename));
  });
}

function unPack(file, dir) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
    .pipe(unzip.Extract({ path: dir }))
    .on('error', reject)
    .on('close', resolve);
  })
}

function selectProjectDir(dir) {
  const dirs = fs.readdirSync(dir);
  if (dirs.length !== 1) throw new Error('Unpack package catch error');
  return path.resolve(dir, dirs[0]);
}

