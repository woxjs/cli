const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const unzip = require('unzip');
const prompts = require('prompts');
const { Signale } = require('signale');
const progress = require('request-progress');
const request = require('request');
const randomString = require("randomstring");
// 测试地址 http://02.xiao2012-xyx-pcgame.720582.com/yxdown.com_starcraft_chsV1.08.rar
module.exports = async (ctx, project, options) => {
  const templateRemoteUri = options.plugin 
    ? 'https://codeload.github.com/woxjs/plugin/zip/master'
    : 'https://codeload.github.com/woxjs/template/zip/master';

  if (!project) project = await askProject();
  const interactive = new Signale({ interactive: true });
  if (!project) return interactive.error('the task of create project is stopped.');

  // 创建项目目录
  const projectDir = path.resolve(process.cwd(), project);
  if (fs.existsSync(projectDir)) throw new Error('project is exists at: ' + projectDir);
  fs.mkdirSync(projectDir);
  ctx.catch(() => fse.removeSync(projectDir));

  const filename = path.resolve(process.cwd(), randomString.generate() + '.zip');

  // 下载文件
  await download(interactive, templateRemoteUri, filename);
  ctx.catch(async () => fs.unlinkSync(filename));

  // 解包文件
  const { project_dir, temp_dirname } = await unpack(ctx, interactive, filename);

  // 拷贝文件
  interactive.scope('copying');
  interactive.await(`${path.relative(process.cwd(), project_dir)} -> ${path.relative(process.cwd(), projectDir)}`);
  fse.copySync(project_dir, projectDir);

  // 修改信息
  interactive.scope('modifying');
  interactive.await(`file: package.json`);
  const pkgPath = path.resolve(projectDir, 'package.json');
  const pkg = require(path.resolve(projectDir, 'package.json'));
  pkg.name = project;
  pkg.description = `The description of this project`;
  pkg.version = '1.0.0';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

  // 删除相关文件
  interactive.scope('deleting');
  fse.removeSync(filename);
  fse.removeSync(project_dir);
  fse.removeSync(temp_dirname);
  interactive.await(`${path.relative(process.cwd(), filename)}, ${path.relative(process.cwd(), project_dir)}, ${path.relative(process.cwd(), temp_dirname)}`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 完成
  interactive.success({
    message: `OK, create project success!`,
    suffix: '(' + pkg.name + ')'
  });
  interactive.disable();
}

function checkProjectName(value) {
  return /^[a-z0-9_\-@\/]+$/.test(value);
}

async function askProject() {
  const response = await prompts({
    type: 'text',
    name: 'project',
    message: 'What is the name of this project?',
    validate: value => {
      if (checkProjectName(value)) return true;
      else return `only /^[a-z0-9_-@/]+$/ can been used.`;
    }
  });
  return response.project;
}

async function download(interactive, uri, filename, time) {
  interactive.scope('downloading')
  interactive.await('prepare to download template ...');
  await new Promise((resolve, reject) => {
    progress(request(uri), { delay: 1000 })
    .on('progress', state => {
      const percent = (state.percent * 100).toFixed(2) + '%';
      interactive.await(`[${percent}] - ${state.speed.toFixed(2)} bytes/sec - ${state.time.elapsed} s`);
    })
    .on('error', reject)
    .on('end', () => {
      interactive.success('[100%] - download success.');
      resolve();
    })
    .pipe(fs.createWriteStream(filename));
  });
  await new Promise(resolve => setTimeout(resolve, time || 1000));
}

async function unpack(ctx, interactive, filename) {
  interactive.scope('unpacking')
  const temp_dirname = path.resolve(randomString.generate());
  fs.mkdirSync(temp_dirname);
  ctx.catch(() => fse.removeSync(temp_dirname));
  interactive.await('unpacking zip package ...');
  await new Promise((resolve, reject) => {
    fs.createReadStream(filename)
    .pipe(unzip.Extract({ path: temp_dirname }))
    .on('error', reject)
    .on('close', resolve);
  });
  const project_dir = selectProjectDir(temp_dirname); 
  return {project_dir, temp_dirname};
}

function selectProjectDir(dir) {
  const dirs = fs.readdirSync(dir);
  if (dirs.length !== 1) throw new Error('Unpack package catch error');
  return path.resolve(dir, dirs[0]);
}