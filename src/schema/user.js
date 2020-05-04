import { gql } from "apollo-server-express";
export default gql`
  extend type Query {
    getUserByRole(role:String!): [User!]
    getUserById(id: ID!): User
    getMe(token: String!): User
    getAllUser: [User!]
    getDashboardData:dashboardData!
  }

  extend type Mutation {
    
    signInUser(token: String!): Rmessage!

    signUpUser(
      firstName: String!
      lastName: String!
      email: String!
      dateOfJoin: Date
      role: String!
      roleAccess: String!
    ): Message!

    signIn(login: String!, password: String!): Token!

    forgotPassword(email: String!): Message!

    resetPassword(randomNo: String!, password: String!): Message!

    updateUser(
      id: ID!
      firstName: String
      lastName: String
      email: String
      dateOfJoin: Date
      role: String
      roleAccess: String
      permission: String
    ): User!

    deleteUser(id: ID!): Message!
  }

  type dashboardData {
    totalUser: String
    totalProject: String 
    totalTicket: String
    smallContract:String
    mediumContract:String
    largeContract:String
    serviceRepairContract:String
  }

  type Rmessage {
    message: String!
    role: String
    roleAccess:String
  }

  type Message {
    message: String!
  }

  type Token {
    token: String!
    firstName: String!
    photoURL: String!
    role: String!
    email: String!
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    isDeleted: Boolean!
    email: String!
    role: String!
    roleAccess: String!
    dateOfJoin: Date
    photoURL: String!
    permission:String!
    createdDate: Date
    updatedDate: Date
  }
`;
