var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var async = require('async');
var util = require('util');

var dburl = 'mongodb://127.0.0.1:27017/order';

exports.mapRoute = function (app) {
    app.get('/orders', exports.index);
    app.get('/orders/:id', exports.show);

    app.post('/orders/create', exports.create);
    app.put('/orders/:id', exports.update);
    app.del('/orders/:id', exports.delete);

    app.post('/orders/:id/order', exports.orderAdd);
    app.del('/orders/:id/order', exports.orderDel);
}

exports.index = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var orders = db.collection('orders');
        orders.find({}, { sort: { createTime: -1 } }).toArray(function (err, docs) {
            if (err) throw err;
            async.each(docs, function(order, callback) {
                var menus = db.collection('menus');
                menus.findOne({ _id: order.menu_id }, function (err, menu) {
                    if (err) callback(err);
                    order.menu = menu;
                    callback();
                });
            }, function(err) {
                if (err) throw err;
                res.render('orders/index', { orders : docs });
            });
        });
    });
}

exports.show = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var orders = db.collection('orders');
        orders.findOne({ _id: new ObjectID(req.params.id) }, function (err, order) {
            if (err) throw err;
            var menus = db.collection('menus');
            menus.findOne({ _id: order.menu_id }, function (err, menu) {
                if (err) throw err;
                var orderMap = new Object;
                for(var i in order.order) {
                    var v = order.order[i];
                    if (!orderMap[v.item]) orderMap[v.item] = [];
                    orderMap[v.item].push(v.name);
                }
                order.orderMap = orderMap;
                order.menu = menu;
                console.log(order);
                res.render('orders/show', { order: order });
            });
        });
    });
}

exports.create = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var menus = db.collection('menus');
        menus.findOne({ _id: new ObjectID(req.body.menuId) }, function (err, menu) {
            if (err) throw err;
            var orders = db.collection('orders');
            var oid = new ObjectID();
            var order = { _id: oid, menu_id: menu._id, createTime: new Date() };
            orders.insert(order, function (err, docs) {
                if (err) throw err;
                res.redirect('/orders/' + oid);
            });
        });
    });
}

exports.orderAdd = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var orders = db.collection('orders');
        orders.update({ _id: new ObjectID(req.params.id) }, 
                      { $push: { order: { name: req.body.name.trim(), item: req.body.item.trim(), createTime: new Date() }}}, 
                      function (err, result) {
            if (err) throw err;
            res.redirect('/orders/' + req.params.id);
        });
    });
}

exports.orderDel = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var orders = db.collection('orders');
        orders.update({ _id: new ObjectID(req.params.id) },
                      { $pull: { order: { name: req.body.name }}},
                      function (err, result) {
            if (err) throw err;
            res.redirect('/orders/' + req.params.id);
        });
    });
}

exports.update = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var orders = db.collection('orders');
        orders.update({ _id: new ObjectID(req.params.id) }, 
                      { $set : { close: req.body.close }},
                      function (err, result) {
            if (err) throw err;
            res.redirect('/orders/' + req.params.id);
        });
    });
}

exports.delete = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var orders = db.collection('orders');
        orders.remove({ _id: new ObjectID(req.params.id) }, 
                      function(err, result) {
            if (err) throw err;
            res.redirect('/orders');
        });
    });
}

