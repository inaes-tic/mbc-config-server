module.exports = function(app) {

    var path = require('path')
    , folio = require('folio')
    , jade = require('jade')
    , po2json = require('po2json')
    , i18n = require('i18n-abide')
    , _ = require('underscore')
    , os = require('os')
    , fs = require('fs')
    , exec = require('child_process').exec
    , mbc = require('mbc-common')
    , conf = mbc.config.ConfigServer
    , commonConf = mbc.config.Common
    , logger  = mbc.logger().addLogger('config-server-routes')
    , imageFiles = []
    , watchr  = require('watchr')
    , url = require('url')
    , elements = []
    , events = []
    ;

    app.get('/po/:id', function (req, res) {
        var lang = req.params.id;
        var locale = i18n.localeFrom(lang);
        var jsondata = '';
        try {
            jsondata = po2json.parseSync('locale/' + locale + '/LC_MESSAGES/messages.po');
            res.send (jsondata);
        } catch (e) {
            logger.error(e);
        }
    });

    /**
     * Vendor Javascript Package
     */

    var lib_dir = path.join(__dirname, '..', 'vendor')
    var common_lib_dir = path.join(__dirname, '..', 'node_modules/mbc-common/vendor')

    var commonVendor = [
        require.resolve('jquery-browser/lib/jquery.js'),
        require.resolve('underscore/underscore.js'),
        require.resolve('backbone/backbone.js'),
        require.resolve('knockout/build/output/knockout-latest.js'),
        require.resolve('knockback/knockback-core.js'),
        require.resolve('jqueryui-browser/ui/jquery-ui.js'),
        require.resolve('node-uuid'),
        require.resolve('moment'),
        require.resolve('jed'),
        path.join(lib_dir, 'bootstrap/dist/js/bootstrap.min.js'),
        path.join(common_lib_dir, 'kinetic-v4.5.2.min.js'),
        path.join(common_lib_dir, 'backbone.modal-min.js'),
        require.resolve('backbone-pageable/lib/backbone-pageable.js'),
    ];

    var vendorJs = new folio.Glossary(commonVendor, {minify: false}); //XXX Hack Dont let uglify minify this: too slow

    // serve using express
    app.get('/js/vendor.js', folio.serve(vendorJs));

    /* Ko binding need to load after all filter widgets */
    vendorOthersJs = new folio.Glossary([
        require.resolve('backbone-relational/backbone-relational.js'),
        path.join(lib_dir, 'jquery-ui.toggleSwitch.js'),
        path.join(lib_dir, 'knockout-common-binding.js'),
    ]);

    app.get('/js/vendor_others.js', folio.serve(vendorOthersJs));

    /**
     * Views Javascript Package
     */
    var localViews = [ 'header' ];
    var commonViews = [ 'editor' ];

    var configView = mbc.views.views.config;

    var getViewFileName = function(e) {
        return path.join(__dirname, '..', 'public/js/views/', e + '.js');
    };

    var viewsJs = new folio.Glossary(
        localViews.map(getViewFileName).concat(
        configView.js
        )
    , { minify:app.get('minify') }
    );

    app.get('/js/views.js', folio.serve(viewsJs));

    /**
     * Models Javascript Package
     */

    var folioModels = function(models) {
        return new folio.Glossary(
            models.map (function (e) {
                return require.resolve('mbc-common/models/' + e);
            })
        );
    };

    app.get('/js/models.js', folio.serve(new folio.Glossary(configView.models)));

    /**
     * Template Javascript Package
     *
     * We are going to use pre-compiled
     * jade on the client-side.
     */

    var localTemplates = ['header'];

    var getFileName = function (e) {
        return path.join(__dirname, '..', 'views/templates/', e + '.jade');
    };

    var jade_runtime = require.resolve('jade/runtime.js');
    var jade_compiler = function (name, source) {
        var ret =  'template[\'' + name + '\'] = ' +
            jade.compile(source, {
                filename: mbc.views.getTemplateFilename(name),
                client: true,
                compileDebug: false
            }) + ';';
        return ret;
    };

    var templateJs = new folio.Glossary([
        jade_runtime,
        path.join(__dirname, '..', 'views/templates/js/header.js')].concat(
            localTemplates.map(getFileName),
            configView.templates
        ),
        {
            compilers: {
                jade: jade_compiler,
            }
        }
    );

    // serve using express
    app.get('/js/templates.js', folio.serve(templateJs));

    app.get('*',  function(req, res) {
        res.render('index', { name: conf.Branding.name, description: conf.Branding.description });
    });

}
