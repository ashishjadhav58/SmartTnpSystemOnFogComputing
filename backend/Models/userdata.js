const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    accesstype: String,
    tpoemail: String,
    classemail: String,
    password: String
});

const userdata = mongoose.model("userdata", userSchema);

module.exports = userdata;
