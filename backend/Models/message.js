const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    msg: {
        type: String,
        required: true
    },
    read: { 
        type: Boolean, 
        default: false  
    },
    isSync: { 
        type: Boolean, 
        default: false  
    }
}, { timestamps: true });  

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
