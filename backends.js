var mbc            = require('mbc-common'),
    collections    = mbc.config.Common.Collections,
    backboneio     = require('backbone.io'),
    middleware     = new mbc.iobackends().get_middleware()
;

module.exports = function (db) {
    var backends = {
        app: {
            redis: true,
            store: backboneio.middleware.configStore(),
        },
    }
    return backends;
};
