var multiparty = require('multiparty');
var path = require('path');
var fs = require('fs');
var async = require('async');
var util = require('util');

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var dburl = 'mongodb://127.0.0.1:27017/order';

exports.mapRoute = function (app) {
    app.get('/menus', exports.index);
    app.get('/menus/new', exports.new);
    app.get('/menus/:id/edit', exports.edit);

    app.post('/menus/create', exports.create);
    app.put('/menus/:id', exports.update);
    app.del('/menus/:id', exports.delete);

    app.post('/menus/:id/comment', exports.comment)

    //app.get('/menus/:id', exports.show);
}

exports.index = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var collection = db.collection('menus');
        collection.find({}, { sort: { createTime: -1 } }).toArray(function (err, docs) {
            if (err) throw err;
            res.render('menus/index', { menus: docs });
        });
    });
}

exports.new = function (req, res) {
    res.render('menus/new');
}

exports.edit = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var collection = db.collection('menus');
        collection.findOne({ _id: new ObjectID(req.params.id) }, function (err, doc) {
            if (err) throw err;
            res.render('menus/edit', { menu: doc });
        });
    });
}

exports.create = function (req, res) {
    var fields = {};

    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        if (files.menuImage.length === 0) {
            res.writeHead(400, { 'content-type': 'text/plain' });
            res.end("no image");
            return;
        }
        if (err) {
            res.writeHead(400, { 'content-type': 'text/plain' });
            res.end("invalid request: " + err.message);
            return;
        }

        MongoClient.connect(dburl, function (err, db) {
            if (err) throw err;
            var collection = db.collection('menus');

            var oid = new ObjectID();
            var imageFile = oid.toString() + path.extname(files.menuImage[0].originalFilename);
            var menu = { _id: oid, name: fields.menuName, image: imageFile, desc: fields.menuDesc, createTime: new Date() };
            collection.insert(menu, function (err, docs) {
                if (err) throw err;
                db.close();

                console.log(docs);

                var imagePath = path.join(__dirname, '../public/images/menus/' + imageFile);
                fs.rename(files.menuImage[0].path, imagePath, function (err) {
                    if (err) throw err;
                    res.redirect('/menus');
                });
            });
        });
    });
}

exports.update = function (req, res) {
    console.log(req.body);
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var collection = db.collection('menus');
        collection.update({ _id: new ObjectID(req.params.id) }, 
                          { $set: { name: req.body.menuName, desc: req.body.menuDesc } }, 
                          function (err, result) {
            if (err) throw err;
            res.redirect('/menus');
        });
    });
}

exports.comment = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var collection = db.collection('menus');
        collection.update({ _id: new ObjectID(req.params.id) }, 
                          { $push: { comments: { text: req.body.comment, createTime: new Date() }}}, 
                          function (err, result) {
            if (err) throw err;
            res.redirect('/menus');
        });
    });
}

exports.show = function (req, res) {
  
}

exports.delete = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var collection = db.collection('menus');
        collection.remove({ _id: new ObjectID(req.params.id) }, 
                          function (err, result) {
            if (err) throw err;
            res.redirect('/menus');
        });
    });
}

