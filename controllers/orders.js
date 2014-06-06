var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var async = require('async');
var util = require('util');
var querystring = require('querystring');
var url = require('url');
var https = require('https');

var dburl = 'mongodb://127.0.0.1:27017/order';

var slackUrl = 'https://slack.com/api/chat.postMessage'
var slackToken = 'xoxp-2367107353-2370259650-2376525984-fa493e';
var slackChannel = '#general';

function slackPostMessage(msg)
{
    var payload = {
        'token': slackToken,
        'channel': slackChannel,
        'username': '밥서버님',
        'mrkdwn': true,
        'text': msg,
        'icon_url': 'http://c.ask.nate.com/imgs/qrsi.tsp/6404776/8482551/0/1/A/%EB%B0%A5.jpg',
    };
    var postdata = querystring.stringify(payload);
    var options = url.parse(slackUrl);
    options.method = 'POST';
    options.headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': postdata.length };

    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });
    req.write(postdata);
    req.end();
}

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
            if (order==null)
            {
                res.redirect('/orders');
            } else {
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
            }
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
            var order = { _id: oid, password: req.body.password, menu_id: menu._id, createTime: new Date() };
            orders.insert(order, function (err, docs) {
                if (err) throw err;
                res.redirect('/orders/' + oid);
                var msg = '*' + menu.name + '* 의 주문이 시작되었습니다. 빨리 주문하세요!! http://' + req.headers.host + '/orders/' + oid;
                slackPostMessage(msg);
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
        orders.findOne({ _id: new ObjectID(req.params.id) }, function (err, order) {
            if (order.password==null || order.password==req.body.password) {
                orders.update({ _id: new ObjectID(req.params.id) }, 
                              { $set : { close: req.body.close }},
                              function (err, result) {
                    if (err) throw err;
                    res.redirect('/orders/' + req.params.id);
                });
            } else {
                res.redirect('/orders/' + req.params.id);
            }
        });
    });
}

exports.delete = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var orders = db.collection('orders');
        orders.findOne({ _id: new ObjectID(req.params.id) }, function (err, order) {
            if (order.password==null || order.password==req.body.password) {
                orders.remove({ _id: new ObjectID(req.params.id) }, 
                              function(err, result) {
                    if (err) throw err;
                    res.redirect('/orders');
                });
            } else {
                res.redirect('/orders/' + req.params.id);
            }
        });
    });
}

