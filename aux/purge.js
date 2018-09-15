var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://admin:admin2018@ds115442.mlab.com:15442/ironhack_prj2';

MongoClient.connect(url, function (err, db) {
    var mycol = db.collection('articlemsrv');

    var duplicates = [];
    mycol.aggregate([
            {
                $match: {
                    description: {"$ne": ''} // myfield es el campo por el que queremos borrar los duplicados
                }
            },
            {
                $group: {
                    _id: {description: "$myfield"},
                    dups: {"$addToSet": "$_id"},
                    count: {"$sum": 1}
                }
            },
            {
                $match: {
                    count: {"$gt": 1}
                }
            }
        ], function (err, result) {
            if (err) {
                console.error(err);
                return db.close();
            }

            result.forEach(function (doc) {
                doc.dups.shift(); // Nos quedamos con el primer elemento
                doc.dups.forEach(function (dupId) {
                    duplicates.push(dupId);
                });
            });

            mycol.remove({_id: {$in: duplicates}}, function (err, result) {
                if (err) {
                    console.error(err);
                }

                db.close();
            });
        });
});
