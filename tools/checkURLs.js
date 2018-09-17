
result = require('dotenv').config();

if (result.error) {
  throw result.error;
}

const checkURL = (() => {

  client.connect(url, function (err, client) {
      const db = client.db("ironhack_prj2");
      const collection = db.collection("articles");

      const options = { allowDiskUse: false };

      const pipeline = [{
              "$group": {
                  "_id": {
                      "description": "$description"
                  },
                  "dups": {
                      "$push": "$_id"
                  },
                  "count": {
                      "$sum": 1.0
                  }
              }
          },
          {
              "$match": {
                  "count": {
                      "$gt": 1.0
                  }
              }
          },
          {
              "$match": {
                  "id": {
                      "_id": "$_id"
                  }
              }
          },
          {
              "$match": {}
          }
      ];

      const cursor = collection.aggregate(pipeline, options);

      cursor.forEach((doc) => {
              console.log(doc);
              doc.dups.shift();
              db.getCollection("articlemsrvs").remove({
                  "_id": {
                      "$in": doc.dups
                  }
              });
          },
          (err) => {
              client.close();
          }
      );
  });
});

module.exports = checkURL;
