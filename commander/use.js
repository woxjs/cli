const fs = require('fs');
const path = require('path');
const rpcPath = path.resolve(process.env.HOME, '.woxrc.json');
if (!fs.existsSync(rpcPath)) {
  fs.writeFileSync(rpcPath, JSON.stringify({
    use: 'npm'
  }, null, 2), 'utf8');
}
module.exports = async (cmd, roll, commander) => {
  const rc = module.exports.config();
  rc.use = commander;
  fs.writeFileSync(rpcPath, JSON.stringify(rc, null, 2), 'utf8');
  cmd.success('now, you can use `' + commander + '` to install or uninstall');
}

module.exports.config = () => {
  return require(rpcPath);
}