var multiparty = require('multiparty');
var util = require('util');
var path = require('path');
var fs = require('fs');

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var dburl = 'mongodb://127.0.0.1:27017/order';

exports.index = function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        var collection = db.collection('menus');
        collection.find().toArray(function (err, docs) {
            if (err) throw err;

            console.log(docs);
            res.render('menus/index', { menus: docs });
        });
    });
}

exports.new0 = function (req, res) {
    res.render('menus/new');
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

        console.log(files);

        MongoClient.connect(dburl, function (err, db) {
            if (err) throw err;
            var collection = db.collection('menus');

            var oid = new ObjectID();
            var imageFile = oid.toString() + path.extname(files.menuImage[0].originalFilename);
            var menu = { _id: oid, name: fields.menuName, image: imageFile, desc: fields.menuDesc };
            collection.insert(menu, function (err, docs) {
                if (err) throw err;
                console.log(docs);
                db.close();

                var imagePath = path.join(__dirname, '../public/images/menus/' + imageFile);
                console.log(imagePath);
                fs.rename(files.menuImage[0].path, imagePath, function (err) {
                    if (err) throw err;
                    res.send('create');
                });
            });
        });
    });
}

exports.show = function (req, res) {
  
}

exports.destroy = function (req, res) {

}

exports.edit = function (req, res) {
    
}

exports.update = function (req, res) {
    
}