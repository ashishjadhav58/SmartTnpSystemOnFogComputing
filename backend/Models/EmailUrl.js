const mongoose = require('mongoose');

// EmailUrl model
// Fields:
// - emailno: string (email or phone identifier)
// - url: string (a related URL)
// - active: boolean (true/false)
// _id is provided by Mongoose automatically

const EmailUrlSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  isSync: { 
        type: Boolean, 
        default: false  
    }
}, { timestamps: true });

module.exports = mongoose.model('EmailUrl', EmailUrlSchema);
