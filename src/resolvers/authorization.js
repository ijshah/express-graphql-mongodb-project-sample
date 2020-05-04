import { ForbiddenError } from "apollo-server";
import { combineResolvers, skip } from "graphql-resolvers";
const CLIENT_ID = `${process.env.GOOGLE_CLIENT_ID}`;
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(CLIENT_ID);
const MAILDOMAIN = `${process.env.MAILDOMAIN}`;

export const isOauthAuthorized = async (parent, args, { me, models },context) => {
  if (me) {
    const ticket = await client.verifyIdToken({
      idToken: me,
      audience: CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    });

    const payload = ticket.getPayload();

    // G Suite domain restriction
    payload["hd"] !== MAILDOMAIN
      ? new ForbiddenError("Not authenticated as user.")
      : skip;

    let user = await models.User.find({
      email: payload["email"],
      isDeleted: "false"
    });
    user = user[0];
    context.user = user;
    //console.log(user);
    return user ? skip : new ForbiddenError("Not Authorized");
  }
};
export const isManagement =  combineResolvers(
  isOauthAuthorized,
  async (parent, args, { me, models },context) => {
    const ticket = await client.verifyIdToken({
      idToken: me,
      audience: CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();

    let user = await models.User.find({
      $or:[ 
        {email: payload["email"],
        isDeleted: "false",
        roleAccess: "MANAGEMENT"} ,
        { email: payload["email"],
        isDeleted: "false",
        roleAccess: "ADMIN" }
      ] 
    });
	user = user[0];
	context.user = user;
    return user ? skip : new ForbiddenError("Not Authorized");
  }
);

export const isAdmin = combineResolvers(
  isOauthAuthorized,
  async (parent, args, { me, models }) => {
    const ticket = await client.verifyIdToken({
      idToken: me,
      audience: CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();

    let user = await models.User.find({
      email: payload["email"],
      roleAccess: "ADMIN",
      isDeleted: "false"
    });
    user = user[0];
    return user ? skip : new ForbiddenError("Not Authorized");
  }
);

/*export const isAuthenticated = async (parent, args, { me }) => {
  //console.log(me);
  if (me) {
    try {
      jwt.verify(me, process.env.SECRET)
        ? skip
        : new ForbiddenError("Not authenticated as user.");
    } catch (e) {
      throw new AuthenticationError("Your session expired. Sign in again.");
    }
  }
};
export const isAdmin = combineResolvers(
  isAuthenticated,
  (parent, args, { me }) => {
    let decoded = jwt.verify(me, process.env.SECRET);
    decoded.role === "ADMIN"
      ? skip
      : new ForbiddenError("Not authorized as admin.");
  }
);*/
