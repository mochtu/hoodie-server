var helpers = {
  isMobileApplication: function (request) {
    var isMobile = request.headers['user-agent'].toLowerCase().indexOf('android') !== -1;
    return isMobile ? 'www/js/cordova/cordova.js' : 'www/js/cordova/cordova_empty.js';
  }
};

exports.register = function (plugin, options, next) {
  plugin.select('web').route([{
    method: 'GET',
    path: '/{p*}',
    handler: {
      directory: {
        path: options.app.www_root,
        listing: false,
        index: false
      }
    }
  }, {
    method: 'GET',
    path: '/cordova.js',
    handler: {
      file: function (request) {
        return helpers.isMobileApplication(request);
      }
    }
  }, {
    method: 'GET',
    path: '/cordova_plugins.js',
    handler: {
      file: {
        path: 'www/js/cordova/cordova_plugins.js'
      }
    }
  }]);

  return next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
