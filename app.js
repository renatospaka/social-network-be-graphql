const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(bodyParser.json());        //application/json
//app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form></form>

//setup CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
}) 

//graphql miiddleware
app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolvers
}));

//error handler
app.use((error, req, res, next) => {
  console.log(error);
  const errCode = error.statusCode || 500;
  const message = error.message;
  const data = error.data
  res.status(errCode).json({ message: message, data: data })
}) 
//database access
require('dotenv').config()
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser:true, useUnifiedTopology: true })
  .then(result => {
    app.listen(8091);
  })
  .catch(err => console.log(err))

