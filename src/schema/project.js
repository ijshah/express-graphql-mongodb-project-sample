import { gql } from "apollo-server-express";
export default gql`
  type Project {
    id: ID!
    projectName: String
    customer: String
    contractType: String
    billingType: String
    taxStatus: String
    contractSize:String
    parent:Project
    projectedHours:String
    isDeleted: Boolean
    completionDate:Date
    createdDate: Date
    updatedDate: Date
  }
  type project {
    _id: ID!
    projectName: String
    customer: String
    contractType: String
    billingType: String
    taxStatus: String
    contractSize:String
    parent:String
    projectedHours:String
    isDeleted: Boolean
    completionDate:Date
    createdDate: Date
    updatedDate: Date
  }
   
  extend type Query {
   
    getProjectById(id: ID!): Project
  }


  extend type Mutation {
    createProject(
      projectName: String!
      customer: String!
      contractType: String!
      billingType: String!
      contractSize:String!
      taxStatus: String!
      parent:ID
      projectedHours:String!
      completionDate:Date!
      createdDate: Date
      updatedDate: Date
    ): Message!

    updateProject(
      id: ID!
      projectName: String
      customer: String
      contractType: String
      billingType: String
      contractSize:String
      taxStatus: String
      parent:ID
      completionDate:Date
      projectedHours:String
      isDeleted: Boolean
    ): Message!
    deleteProject(id: ID!): Message!
  }
`;
