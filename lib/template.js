const path = require('path');
module.exports = {
  vueComponent: {
    template: path.resolve(__dirname, '../template/component-vue.ejs'),
    ext: '.vue',
    dir: 'app/vue/component',
    callback: project => {
      return {
        className: prefix(...project.split('/'))
      }
    }
  },
  jsComponent: {
    template: path.resolve(__dirname, '../template/component-js.ejs'),
    ext: '.js',
    dir: 'app/vue/component',
    callback: project => {
      return {
        className: prefix(...project.split('/'))
      }
    }
  },
  jsxComponent: {
    template: path.resolve(__dirname, '../template/component-jsx.ejs'),
    ext: '.jsx',
    dir: 'app/vue/component',
    callback: project => {
      return {
        className: prefix(...project.split('/'))
      }
    }
  },
  directive: {
    template: path.resolve(__dirname, '../template/directive.ejs'),
    ext: '.js',
    dir: 'app/vue/directive'
  },
  filter: {
    template: path.resolve(__dirname, '../template/filter.ejs'),
    ext: '.js',
    dir: 'app/vue/filter'
  },
  mixin: {
    template: path.resolve(__dirname, '../template/mixin.ejs'),
    ext: '.js',
    dir: 'app/vue/mixin'
  },
  jsController: {
    template: path.resolve(__dirname, '../template/controller.ejs'),
    ext: '.js',
    dir: 'app/controller'
  },
  jsxController: {
    template: path.resolve(__dirname, '../template/controller.ejs'),
    ext: '.jsx',
    dir: 'app/controller'
  },
  middleware: {
    template: path.resolve(__dirname, '../template/middleware.ejs'),
    ext: '.js',
    dir: 'app/middleware'
  },
  jsService: {
    template: path.resolve(__dirname, '../template/service.ejs'),
    ext: '.js',
    dir: 'app/service'
  },
  jsxService: {
    template: path.resolve(__dirname, '../template/service.ejs'),
    ext: '.jsx',
    dir: 'app/service'
  },
  decorate: {
    template: path.resolve(__dirname, '../template/decorate.ejs'),
    ext: '.js',
    dir: 'app/decorate',
    callback: project => {
      return {
        className: prefix(...project.split('/'))
      }
    }
  },
  webview: {
    template: path.resolve(__dirname, '../template/webview.ejs'),
    ext: '.vue',
    dir: 'app/webview',
    callback: project => {
      return {
        className: prefix(...project.split('/'))
      }
    }
  },
}

function prefix(...names) {
  const name = names.join('_').replace(/\//g, '_').replace(/[_-][a-z0-9]/ig, s => s.substring(1).toUpperCase());
  let first = name.charAt(0);
  const next = name.substring(1);
  return first.toUpperCase() + next;
}