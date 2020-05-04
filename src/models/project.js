import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: String,
    required: true
  },
  contractType: {
    type: String,
    enum: ['Billable', 'Static'],
    required: true
  },
  contractSize: {
    type: String,
    enum: ['Small', 'Medium', 'Large', 'ServiceRepair'],
    required: true
  },
  billingType: {
    type: String,
    enum: [
      'FixedPrice',
      'Time&Material'
    ],
    required: true
  },
  taxStatus: {
    type: String,
    enum: ['Taxable', 'Non-Taxable'],
    required: true
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: 0
  },
  completionDate: {
    type: Date,
    required: true
  },
  parent:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default:null
  },
  projectedHours:{
    type:Number,
    required:true
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
})

projectSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedDate: new Date().toISOString() })
})

const Project = mongoose.model('Project', projectSchema)

export default Project
// contract which are Time and material covered are billable rest are static type
