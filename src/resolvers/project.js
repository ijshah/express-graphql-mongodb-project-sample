import { combineResolvers } from "graphql-resolvers";
import { AuthenticationError, UserInputError } from "apollo-server";
import { isAdmin, isOauthAuthorized ,isManagement } from "./authorization";
import _ from "lodash"

export default {
  Query: {
    //--------------PROJECT BY ID---------------
    getProjectById: combineResolvers(
      isOauthAuthorized,
      async (parent, { id }, { models }) => {
        let result = await models.Project.find({ _id: id });
        return result[0];
      }
    )
  },
  Mutation: {
    //--------------------CREATE PROJECT MUTATION-----------
    createProject: combineResolvers(
      isManagement,
      async (p,
        {
          projectName,
          customer,
          contractType,
          billingType,
          contractSize,
          taxStatus,
          completionDate,
          parent,
          projectedHours
        },
        { models }
      ) => {
        try {
          let newProject = await models.Project.create({
            projectName: projectName,
            customer: customer,
            contractType: contractType,
            contractSize: contractSize,
            billingType: billingType,
            taxStatus: taxStatus,
            completionDate: completionDate,
            parent: parent,
            projectedHours: projectedHours
          });

          let Message = { message: "Project created successfully" };
          return Message;
        } catch (error) {
          console.log(error);
          throw new Error("Project not created");
        }
      }
    ),

    //---------------UPDATE PROJECT MUTATION------------

    updateProject: combineResolvers(
      isManagement,
      async (parent, args, { models }) => {
        try {
          const entries = Object.keys(args);
          const updates = {};
          let id = args.id;

          // constructing dynamic query
          for (let i = 0; i < entries.length; i++) {
            if (Object.keys(args)[i] !== "id") {
              updates[entries[i]] = Object.values(args)[i];
            }
          }
          await models.Project.findByIdAndUpdate(
            { _id: id },
            {
              $set: updates
            }
          );
          let Message = { message: "Project Updated Successfully" };
          return Message;
        } catch (error) {
          console.log(error);
          throw new Error("Project not updated");
        }
      }
    ),

    //----------DELETE PROJECT MUTATION-----------------
    deleteProject: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        try {
          await models.Project.findByIdAndUpdate(
            { _id: id },
            {
              $set: { isDeleted: true }
            }
          );
          await models.ActionItem.updateMany({ project : id }, 
            {
              $set: { isDeleted: true }
            },
            {multi: true});
          
          let Message = { message: "Project sucessfully deleted" };
          return Message;
        } catch (error) {
          console.log(error);
          throw new Error("Project not deleted");
        }
      }
    )
  }
};
