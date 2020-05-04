import { GraphQLDateTime } from "graphql-iso-date";

import userResolvers from "./user";
import projectResolvers from "./project";

const customScalarResolver = {
  Date: GraphQLDateTime
};

export default [
  customScalarResolver,
  userResolvers,
  projectResolvers,
];
