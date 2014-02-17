var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var dburl = 'mongodb://127.0.0.1:27017/order';

exports.mapRoute = function (app) {
    app.get('/orders', exports.index);
    app.get('/orders/:id', exports.show);

    app.post('/orders/create', exports.create);
    app.put('/orders/:id', exports.update);
    app.del('/orders/:id', exports.delete);
}

exports.index = funciton (req, res) {
}

exports.show = funciton (req, res) {
}

exports.create = funciton (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var menus = db.collection('menus');

        menus.findOne({ _id: new ObjectID(req.params.id) }, function (err, menu) {
            if (err) throw err;
            console.log(menu);

            var orders = db.collection('orders');
            var oid = new ObjectID();
            var order = { _id: oid, menu_id: menu._id, createTime: new Date() };
            orders.insert(menu, function (err, docs) {
                if (err) throw err;
                console.log(docs);
                res.redirect('/orders/' + oid);
            });
        });
    });
}

exports.update = funciton (req, res) {
}

exports.delete = funciton (req, res) {
}

