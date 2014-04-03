module.exports = function(app) {

    var path = require('path')
    , _ = require('underscore')
    , folio = require('folio')
    , jade = require('jade')
    , po2json = require('po2json')
    , i18n = require('i18n-abide')
    , mbc = require('mbc-common')
    , conf = mbc.config.ConfigServer
    , commonConf = mbc.config.Common
    , logger  = mbc.logger().addLogger('config_server_routes');


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

    var lib_dir                 = path.join(__dirname, '..', 'vendor');
    var common_dir              = path.join('node_modules','mbc-common');
    var common_lib_dir          = path.join(__dirname, '..', common_dir, 'vendor');
    var bower_common_lib_dir    = path.join(__dirname, '..', common_dir, 'bower_components');

    var addPath = function (dir, libs) {
        return _.map(libs, function(lib) {
            return path.join(dir, lib);
        });
    }

    var vendorBower = [
        'jquery/jquery.min.js',
        'bootstrap/docs/assets/js/bootstrap.min.js',
        'jqueryui/ui/minified/jquery-ui.min.js',
        'underscore/underscore.js',
        'backbone/backbone-min.js',
        'knockout.js/knockout.js',
        'knockback/knockback-core.min.js',
        'node-uuid/uuid.js',
        'moment/moment.js',
        'jed/jed.js',
        'backbone-modal/backbone.modal-min.js',
        'spark-md5/spark-md5.min.js',
        'sprintf/src/sprintf.js',
        'resumablejs/resumable.js',
        'd3/d3.js',
        'knockout-sortable/build/knockout-sortable.js',
        'bootstrap-paginator/build/bootstrap-paginator.min.js',
        'backbone.memento/backbone.memento.js',
        'kineticjs/kinetic.min.js',
    ];

    var vendorLibDir = [
    ];

    var vendorCommonLibDir = [
        'jquery-ui.toggleSwitch.js',
        'knockout-jqueryui.min.js',
        'knockout-common-binding.js',
    ];

    var vendorJs = new folio.Glossary(
        addPath(bower_common_lib_dir, vendorBower)
        .concat(addPath(lib_dir, vendorLibDir))
        .concat(addPath(common_lib_dir, vendorCommonLibDir))
    , {minify: false}); //XXX Hack Dont let uglify minify this: too slow

    // serve using express

    app.get('/js/vendor.js', folio.serve(vendorJs));

    var vendorOtherBower = [
        'backbone-pageable/lib/backbone-pageable.js',
        'backbone-relational/backbone-relational.js',
    ];

    //XXX Hack to include relational after backbone.io
    var vendorOthersJs = new folio.Glossary(
        addPath(bower_common_lib_dir, vendorOtherBower)
    , {minify:app.get('minify')});

    app.get('/js/vendor_others.js', folio.serve(vendorOthersJs));

    /**
     * Views Javascript Package
     */
    var localViews = [ 'header' ];

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
