/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var Hapi = require('hapi');
var Bcrypt = require('bcrypt');
var Basic = require('hapi-auth-basic');


module.exports = function () {

  return function (env_config, callback) {

    var pack = new Hapi.Pack();

    env_config.hooks.runStatic('server.pack.pre', [pack]);

    pack.server(env_config.www_port, {
      labels: ['web'],
      cors: true,
      payload: {
        maxBytes: 1048576 * 10 // 10 MB
      }
    });

    pack.server(env_config.admin_port, {
      labels: ['admin'],
      cors: true,
      payload: {
        maxBytes: 1048576 * 10 // 10 MB
      }
    });

    var hapi_plugins = [
      './plugins/web',
      './plugins/admin',
      './plugins/api',
      './helpers/logger',
      './helpers/handle_404'
    ];
    
    //authentication
    var users = {
        john: {
            username: 'john',
            password: '$2a$10$iqJSHD.BGr0E2IxQwYgJmeP3NvhPrXAeLSaGCj6IR/XU5QtjVu5Tm',   // 'secret'
            name: 'John Doe',
            id: '2133d32a'
        }
    };

    var validate = function (username, password, callback) {
        var user = users[username];
        if (!user) {
            return callback(null, false);
        }

        Bcrypt.compare(password, user.password, function (err, isValid) {
            callback(err, isValid, { id: user.id, name: user.name });
        });
    };

    pack.register(Basic, function (err) {
        pack._servers[0].auth.strategy('simple', 'basic', { validateFunc: validate });
        pack._servers[1].auth.strategy('simple', 'basic', { validateFunc: validate });
    });

    // register plugins against the server pack
    //
    hapi_plugins.forEach(function (plugin) {
      pack.register([
        {
          plugin: require(plugin),
          options: {
            app: env_config,
            web: pack._servers[0],
            admin: pack._servers[1]
          }
        }
      ], function (err) {
        if (err) {
          console.error('Failed to load a plugin:', err);
        }
      });
    });

    env_config.hooks.runStatic('server.pack.post', [pack]);

    pack.start(function () {
      console.log('WWW:   ', env_config.www_link());
      console.log('Admin: ', env_config.admin_link());

      return callback();
    });

  };

};

