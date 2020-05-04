import mongoose from 'mongoose';
import isEmail from 'validator/lib/isEmail';
const adminPermission = {
        user: {
            'read': true,
            'update': true,
            'delete': true,
        },
        project:{
          'read': true,
          'update': true,
          'delete': true,
        },
        actionItem:{
          'read': true,
          'update': true,
          'delete': true,
        },
        timeEntry:{
          'read': true,
          'update': true,
          'delete': true,
        }
};
const managementPermission = {
        user: {
          'read': true,
          'update': false,
          'delete': false,
        },
        project:{
          'read': true,
          'update': true,
          'delete': true,
        },
        actionItem:{
          'read': true,
          'update': true,
          'delete': true,
        },
        timeEntry:{
          'read': true,
          'update': true,
          'delete': true,
        }
};
const employeePermission ={
        user: {
          'read': true,
          'update': false,
          'delete': false,
        },
        project:{
          'read': true,
          'update': false,
          'delete': false,
        },
        actionItem:{
          'read': true,
          'update': true,
          'delete': false,
        },
        timeEntry:{
          'read': true,
          'update': true,
          'delete': false,
        }
};

const subPermission ={   
        user: {
          'read': false,
          'update': false,
          'delete': false,
        },
        project:{
          'read': true,
          'update': false,
          'delete': false,
        },
        actionItem:{
          'read': true,
          'update': false,
          'delete': false,
        },
        timeEntry:{
          'read': true,
          'update': true,
          'delete': false,
        }
};
//const passwordHash = require('password-hash');
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN','MANAGEMENT','EMPLOYEE','SUB'],
    required: true
  },
  roleAccess:{
    type:String
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [isEmail, 'No valid email address provided.']
  },
  photoURL: {
    type: String,
    // default: 'assets/images/avatars/Velazquez.jpg'
  },
  forgotRandom: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: 0
  },
  dateOfJoin: {
    type: Date,
    required: true,
    default: new Date().toISOString()
  },
  permission: {
    type: {
      modulename: { type: String },
      read: { type: Boolean },
      write: { type: Boolean },
      delete: { type: Boolean }
    }
  },
  createdDate: {
    type: Date,
    required: true,
    default: new Date().toISOString()
  },
  updatedDate: {
    type: Date,
    default: new Date().toISOString()
  }
});

userSchema.statics.findByLogin = async function(login) {
  let user = await this.findOne({
    email: login
  });
  return user;
};

userSchema.pre('save', async function() {
  if (this.roleAccess == 'ADMIN') {
    this.permission = adminPermission;
  } else if(this.roleAccess == 'EMPLOYEE') {
    this.permission = employeePermission;
  } else if(this.roleAccess == 'MANAGEMENT'){
    this.permission = managementPermission
  } else {
    this.permission = subPermission;
  }
});

userSchema.pre('updateOne', function() {
  this.set({ updatedDate: new Date().toISOString() });
});

userSchema.pre('findOneAndUpdate', async function(next) {
  if(this.getUpdate().$set.roleAccess){
          try {
            //console.log(modifiedField);
            let modifiedField = this.getUpdate().$set.roleAccess;
            if (modifiedField == 'ADMIN') {
              this.getUpdate().$set.permission  = adminPermission;
            } else if(modifiedField == 'EMPLOYEE') {
              this.getUpdate().$set.permission  = employeePermission;
            } else if(modifiedField == 'MANAGEMENT'){
              this.getUpdate().$set.permission  = managementPermission
            } else {
              this.getUpdate().$set.permission = subPermission;
            }
            next();
        } catch (error) {
            return next(error);
        }
     
      }else{
        return next();
      }
});

userSchema.methods.validatePassword = async function(password) {
  return await passwordHash.verify(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
