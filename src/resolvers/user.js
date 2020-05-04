import jwt from "jsonwebtoken";
import { combineResolvers } from "graphql-resolvers";
import { AuthenticationError, UserInputError } from "apollo-server";
import { isAdmin, isAuthenticated, isOauthAuthorized } from "./authorization";
import mongoose, { model } from "mongoose";

const nodemailer = require("nodemailer");
const uuid = require("uuid");
//const expiresIn = "24h";
const CLIENT_ID = `${process.env.GOOGLE_CLIENT_ID}`;
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(CLIENT_ID);
const MAILDOMAIN = `${process.env.MAILDOMAIN}`;

const createToken = async (user, secret, expiresIn) => {
  try {
    const { id, email, firstName, lastName, role, photoURL } = user;
    return await jwt.sign(
      { id, email, firstName, lastName, role, photoURL },
      secret,
      {
        expiresIn
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error("Token not created");
  }
};

const checkEmail = async (models, email) => {
  try {
    var userexist = 0;
    var finduser = await models.User.find({ email: email }, function(
      err,
      result
    ) {
      userexist = result.length;
    });
    if (finduser) {
      if (userexist > 0) {
        return false;
      } else {
        return true;
      }
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error while checking email exist");
  }
};

export default {
  Query: {
    //--------------QUERY USER BY ROLE-----------------------
    getUserByRole: combineResolvers(
      //isAdmin,
      isOauthAuthorized,
      async (parent, { role }, { models }, context) => {
        try {
          return await models.User.find({ role: role, isDeleted: "false" });
        } catch (error) {
          console.log(error);
          throw new Error("Error while getting user by role");
        }
      }
    ),
    //-------------- QUERY ALL USER -------------------------
    getAllUser: combineResolvers(
      //isAuthenticated,
      isOauthAuthorized,
      async (parent, context, { models }) => {
        try {
          return await models.User.find({ isDeleted: "false" });
        } catch (error) {
          console.log(error);
          throw new Error("Error while getting all user");
        }
      }
    ),
    //-----------------QUERY USER BY ID-------------------
    getUserById: combineResolvers(
      isOauthAuthorized,
      async (parent, { id }, { models }) => {
        try {
          let ID = id;
          return await models.User.findById(ID);
        } catch (error) {
          console.log(error);
          throw new Error("Error while getting user by id");
        }
      }
    ),
    //-------------------GET USER DETAILS BY TOKEN------------
    getMe: combineResolvers(async (parent, { token }, { models }, context) => {
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
        });

        if (ticket) {
          const payload = ticket.getPayload();
          console.log(payload);

          // G Suite domain restriction
          if (payload["hd"] !== MAILDOMAIN) {
            return {
              error: true,
              errorMessage: "No user found with this login credentials."
            };
          }
          let user = await models.User.find({
            email: payload["email"],
            isDeleted: "false"
          });

          user = user[0];
          if (user) {
            let User = {
              id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              roleAccess: user.roleAccess,
              email: user.email,
              permission: user.permission,
              photoURL: user.photoURL
            };
            return User;
          } else {
            return false;
          }
        } else {
          throw new AuthenticationError("Your token expired. Sign in again.");
        }
      } catch (error) {
        console.log(error);
        throw new Error("Error while getting user detail from token");
      }
    }),
    getDashboardData: combineResolvers(
      isOauthAuthorized,
      async (parent, args, { models }) => {
        let totalUser = await models.User.countDocuments({
          isDeleted: "false"
        }).exec();
        let totalProject = await models.Project.countDocuments({
          isDeleted: "false"
        }).exec();
        let totalTicket = await models.ActionItem.countDocuments({
          isDeleted: "false"
        }).exec();
        let smallContract = await models.Project.countDocuments(
          { contractSize: 'Small',isDeleted: false}).exec();
        let mediumContract = await models.Project.countDocuments(
            { contractSize: 'Medium',isDeleted: false}).exec();
        let largeContract = await models.Project.countDocuments(
              { contractSize: 'Large',isDeleted: false}).exec();
        let serviceRepairContract = await models.Project.countDocuments(
                { contractSize: 'ServiceRepair',isDeleted: false}).exec();
            
        let dashboardData = {
          totalUser: totalUser,
          totalProject: totalProject,
          totalTicket: totalTicket,
          smallContract:smallContract,
          mediumContract:mediumContract,
          largeContract:largeContract,
          serviceRepairContract:serviceRepairContract        
        };
        return dashboardData;
      }
    )
  },

  Mutation: {
    //----------SIGNUP USER MUTATION-----------------
    signInUser: async (parent, { token }, { models }) => {
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
        });

        if (ticket) {
          const payload = ticket.getPayload();
          console.log(payload);
          // G Suite domain restriction
          if (payload["hd"] !== MAILDOMAIN) {
            return {
              error: true,
              errorMessage: "No user found with this login credentials."
            };
          }
          let photoUrl = "";
          if (payload["picture"]) {
            photoUrl = payload["picture"];
          } else {
            photoUrl = "assets/images/avatars/Velazquez.jpg";
          }

          let email = payload["email"];
          let user = await models.User.find({ email: email });

          if (user.length > 0) {
            models.User.findByIdAndUpdate(
              { _id: user[0]._id },
              { photoURL: photoUrl },
              { upsert: false }
            )
              .exec()
              .catch(err => {
                console.log(`caught error`, err);
              });

            let Rmessage = {};
            Rmessage = {
              message: "User login sucessfully",
              role: user[0].role,
              roleAccess: user[0].roleAccess
            };
            return Rmessage;
          } else {
            const newUser = await models.User.create({
              _id: new mongoose.Types.ObjectId().toHexString(),
              firstName: payload["given_name"],
              lastName: payload["family_name"],
              email: payload["email"],
              role: "SUB",
              roleAccess: "SUB",
              dateOfJoin: new Date(),
              photoURL: photoUrl
            });

            if (newUser) {
              console.log(newUser);
              let Rmessage = {
                message: "User signIn successfully",
                role: newUser.role,
                roleAccess: newUser.roleAccess
              };
              return Rmessage;
            } else {
              return { error: true };
            }
          }
        } else {
          console.log(error);
          let Rmessage = {
            message: "Token not verified",
            role: "",
            roleAccess: ""
          };
          return Rmessage;
        }
      } catch (error) {
        console.log(error);
        throw new Error("Error while signIn user");
      }
    },

    //---------- SIGNUP MUTATION-----------------
    signUpUser: combineResolvers(
      isAdmin,
      async (
        parent,
        { firstName, lastName, email, dateOfJoin, role, roleAccess },
        { models }
      ) => {
        try {
          let emailCheck = await checkEmail(models, email);
          if (emailCheck) {
            const user = await models.User.create({
              firstName,
              lastName,
              email,
              role,
              roleAccess,
              dateOfJoin
            });

            let Message = { message: "User sucessfully registered" };
            return Message;
          } else {
            let Message = { message: "Email already exist" };
            return Message;
          }
        } catch (error) {
          console.log(error);
          throw new Error("Error while signUp user");
        }
      }
    ),

    //-------------FORGOT PASSWORD EMAIL --------------

    forgotPassword: async (parent, { email }, { models }) => {
      let finduser = await models.User.find({ email: email }, function(
        err,
        result
      ) {});
      if (finduser.length == 0) {
        let Message = { message: "Email not exist" };
        return Message;
      }
      // create reusable transport method (opens pool of SMTP connections)
      let smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "dev@bowtiebots.com",
          pass: "BTB#DeveloperTeam"
        }
      });
      let randomNo = uuid.v4();
      let tomail = "";
      tomail = email;

      // send mail with defined transport object
      let info = await smtpTransport.sendMail({
        from: "dev@bowtiebots.com", // sender address
        to: tomail, // list of receivers
        subject: "Reset password link from DNR", // Subject line
        html:
          "<a href=" +
          process.env.FrontURL +
          "/reset-password" +
          randomNo +
          ">Reset password from DNR </a>" // html body
      });

      console.log("Message sent: %s", info.messageId);

      const random = models.User.findOneAndUpdate(
        { email: email },
        { $set: { forgotRandom: randomNo } },
        { upsert: false },
        function(error, doc) {}
      );
      if (random) {
        return { message: "Reset password link has been send." };
      } else {
        return { message: "Something went wrong" };
      }
    },

    //-------------RESET PASSWORD------------------
    resetPassword: combineResolvers(
      isAuthenticated,
      async (parent, { randomNo, password }, { models }) => {
        let result = await models.User.findOneAndUpdate(
          { forgotRandom: randomNo },
          {
            $set: { password: passwordHash.generate(password), forgotRandom: 0 }
          },
          { upsert: false }
        );
        if (result) {
          return { message: "Password has changed" };
        } else {
          return { message: "Forgot random passcode not found" };
        }
      }
    ),

    //----------UPDATE USER MUTATION-----------------

    updateUser: combineResolvers(
      isAdmin,
      async (parent, args, { models, me }) => {
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
          console.log(updates);
          return await models.User.findByIdAndUpdate(
            { _id: id },
            {
              $set: updates
            }
          );
        } catch (error) {
          console.log(error);
          throw new Error("Error while Updating user data");
        }
      }
    ),

    //----------DELETE USER MUTATION-----------------
    deleteUser: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        try {
          let result = await models.User.findByIdAndUpdate(
            { _id: id },
            {
              $set: { isDeleted: true }
            }
          );

          if (!result) {
            let Message = { message: "User not deleted" };
            return Message;
          } else {
            let Message = { message: "User sucessfully deleted" };
            return Message;
          }
        } catch (error) {
          console.log(error);
          throw new Error("Error while Updating user data");
        }
      }
    )
  }
};
