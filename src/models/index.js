import mongoose from 'mongoose';

import User from './user';
import Project from './project';

const db = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}${process.env.MONGO_URI}`;

mongoose.Promise = global.Promise

const connectDb = () => {
  if ( db ) {
    return mongoose.connect(
        db,
      { socketTimeoutMS: 0,
        keepAlive: true,
      }
    );
  }

  if (db) {
    return mongoose.connect(
      db,
      { useNewUrlParser: true },
    );
  }
};
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
const models = { User,Project};

export { connectDb };

export default models;

