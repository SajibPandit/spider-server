const mongoose = require('mongoose');

const db = process.env.URI;
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    dbName: 'spyder',
  })
  .then(() => {
    console.log('Connected to Database');
  });
