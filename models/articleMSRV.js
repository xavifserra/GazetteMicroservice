const mongoose = require('mongoose');
const Users = require('./user');
const UserSchema = Users.schema//require('mongoose').model('User').schema;


const  { ObjectId } = mongoose.SchemaTypes;

const articleSchema = new mongoose.Schema({
  source: { id:String, name: { type:String, default: '' } },
  author: { type:String, default: '' },
  language: { type: String, default: 'en' },
  title: { type:String, default: '' },
  description: { type:String, default: '' },
  url: { type:String, default: '' },
  urlToImage: { type:String, default: '' },
  publishedAt: { type:Date, default: Date.now },
  favorites: { type:Number, default: 0 },
  dislikes: { type:Number, default: 0 },
  shared: { type:Number, default: 0 },
  postedBy: UserSchema,
  comments: [{ type: ObjectId, ref: 'Comment' }],
});

const Article = mongoose.model(process.env.MICROSERVICE_DATABASE, articleSchema);

module.exports = Article;
