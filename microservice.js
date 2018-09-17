const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const NewsAPI = require('newsapi');
const appv = require('appversion');

result = require('dotenv').config();

if (result.error) {
  throw result.error;
}


const Articles = require('./models/articleMSRV');
const Users = require('./models/user');

const newsapi1 = new NewsAPI(process.env.NEWS_API1); // 'da5125e659e04c93929fa448a270da80');
const newsapi2 = new NewsAPI(process.env.NEWS_API2); // '546fcf53233c4a85a6447c9f27c5d391');
const app = express();

app.use(bodyParser.json());
let switchAPIKey = true;
let serverStatus = 'idle';
let queriesCounter = 0;
let articlesCounter = 0;
let queriesInterval;

const queryToAPI = () => {
  const languages = ['de', 'en', 'es', 'fr', 'it', 'pt'];
  const arrayOfPromises = [];
  const arrayOfLanguages = [];

  languages.forEach((language, index) => {
    arrayOfPromises.push(switchAPIKey
      ? newsapi1.v2.topHeadlines({ language })
      : newsapi2.v2.topHeadlines({ language }));

    arrayOfLanguages.push(language);
    // console.log(`${switchAPIKey ? 'API1' : 'API2'} HeadLines->${index}`);
  });

  Users.findOne({ name:'API' }).exec()
    .then((result) => {
      userAPI = result;
    });

  switchAPIKey = !switchAPIKey;

  console.log(`Processing query ${queriesCounter}`);
  Promise.all(arrayOfPromises)
    .then((topHeadlinesArray) => {
      // console.log(userAPI);
      topHeadlinesArray.forEach((topHeadlines, index) => {
        // console.log(`source ->${index}`);

        topHeadlines.articles.forEach((article) => {
          // console.log(`article ->${index}`);
          article.postedBy = userAPI;
          article.language = arrayOfLanguages[index];

          Articles.findOne({
            title:article.title,
            description:article.description,
          }, (error, match) => {
            if (error) return handleError(error);
            if (!match) {
              Articles.create(article, (error) => {
                if (error) return handleError(error);
                articlesCounter++;
              });
            }
          });
        });
      });
    })
    .catch((e) => {
      serverStatus = 'error';
      console.log(e);

      clearInterval(queriesInterval);
    });
};

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

app.get('/', (req, res, next) => {
  res.redirect('/server/status');
});

app.get('/server/status', (req, res, next) => {
  Articles.collection.estimatedDocumentCount()
    .then((numberOfDocuments) => {
      const response = {
        serviceStatus: serverStatus,
        timeBetweenQueries: `${process.env.MICROSERVICE_TIME}ms (${process.env.MICROSERVICE_TIME / 60000}min)`,
        amountOfQueries: articlesCounter,
        totalOfArticlesCollected: numberOfDocuments,
        appVersion: appv.getAppVersionSync((err, data) => {
          if (err) console.log(err);
          console.log(data);
        }).version,
      };
      res.send(response);
    })
    .catch((e) => {
      serverStatus = 'DDBB error';
      console.log(e);
    });
}).put('/server/run', (req, res, next) => {
  console.log(`processing queries every: ${process.env.MICROSERVICE_TIME / 60000} minutes`);

  queriesInterval = setInterval(() => {
    queriesCounter++;
    console.log(`query nº: ${queriesCounter}`);
    queryToAPI();
  }, process.env.MICROSERVICE_TIME);
  serverStatus = 'running';
  res.redirect('/server/status');
}).put('/server/stop', (req, res, next) => {
  queriesCounter = 0;
  serverStatus = 'stopped';

  clearInterval(queriesInterval);
  res.redirect('/server/status');
});

app.listen(process.env.MICROSERVICE_PORT, () => {
  console.log(`GAZETTE microservice is listening at port ${process.env.MICROSERVICE_PORT}`);
});
