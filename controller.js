exports.mapRoute = function (app, prefix) {
    prefix = '/' + prefix;

    var prefixObj = require('./controllers/' + prefix);

    app.get(prefix, prefixObj.index);
    app.get(prefix + '/new', prefixObj.new0);
    app.get(prefix + '/:id', prefixObj.show);
    app.post(prefix + '/create', prefixObj.create);
    app.get(prefix + '/:id/edit', prefixObj.edit);
    app.put(prefix + '/:id', prefixObj.update);
    app.del(prefix + '/:id', prefixObj.destroy);
}