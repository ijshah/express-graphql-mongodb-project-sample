import 'dotenv/config';
import cors from 'cors';
// import morgan from 'morgan';
import http from 'http';
import DataLoader from 'dataloader';
import express from 'express';
import {
  ApolloServer,
  AuthenticationError
} from 'apollo-server-express';

import schema from './schema';
import resolvers from './resolvers';
import models, { connectDb } from './models';
import loaders from './loaders';

//const ConstraintDirective = require('graphql-constraint-directive');
const app = express();
const EasygraphqlFormatError = require('easygraphql-format-error')
const formatError = new EasygraphqlFormatError()
const errorName = formatError.errorName

app.use(cors());

const server = new ApolloServer({
  introspection: true,
  playground: true,
  typeDefs: schema,
  resolvers,
  introspection: true,
  formatError: (err) => {
    return formatError.getError(err)
  },
  context: async ({ req,  connection }) => {
    if (connection) {
      return {
        models,
        loaders: {
          user: new DataLoader(keys =>
            loaders.user.batchUsers(keys, models),
          ),
          project: new DataLoader(keys =>
            loaders.project.batchProjects(keys, models),
          )
        },
      };
    }
     //console.log('headers', req.headers.authorization);
    if (req) {
      const me = req.headers.authorization;
      return {
        models,
        me,
        secret: process.env.SECRET,
        loaders: {
          user: new DataLoader(keys =>
            loaders.user.batchUsers(keys, models),
          ),
          project: new DataLoader(keys =>
            loaders.project.batchProjects(keys, models),
          )
        },
      };
    }
  },
});

server.applyMiddleware({ app, path: '/graphql'});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);
// const isTest = !!process.env.TEST_DATABASE_URL;
// const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 8080;

connectDb().then(async () => {
  httpServer.listen({ port }, () => {
    console.log(`🚀 Apollo Server on http://localhost:${port}/ 🚀`);
  });
});

