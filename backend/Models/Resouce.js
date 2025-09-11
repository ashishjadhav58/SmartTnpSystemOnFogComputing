const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  resourceName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  category: { 
    type: String 
  },
  driveLink: { 
    type: String, 
    required: true 
  },
  uploadedBy: { 
    type: String 
  },
  uploadDate: { 
    type: Date, 
    default: Date.now  
  },
  isSync: { 
    type: Boolean, 
    default: false    
  }
}, { timestamps: true }); 

module.exports = mongoose.model('Resource', ResourceSchema);
