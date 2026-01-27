const express = require("express");
const router = express.Router();
const message = require("../Models/message.js");
const { handleJob } = require("../middleware/handleJob");

// PATCH: Update message (mark as read)
router.patch("/message/:_id", async (req, res) => {
  try {
    handleJob();
    const messageId = req.params._id;
    const updateData = req.body;
    const updatedMessage = await message.findByIdAndUpdate(messageId, updateData, { new: true });
    if (!updatedMessage) {
      return res.status(404).json({ status: "404", message: "Message not found" });
    }
    res.json({ status: "200", message: "Message updated successfully", data: updatedMessage });
  } catch (err) {
    console.error("Error updating message:", err);
    res.status(500).json({ status: "500", message: "Internal server error" });
  }
});

// POST: Create new message
router.post("/message", async (req, res) => {
  try {
    handleJob();
    const { sender, receiver, msg } = req.body;
    const newmsg = new message({
      sender,
      receiver,
      msg,
      read: false,
    });
    await newmsg.save();
    res.json({ status: "200", id: newmsg._id });
  } catch (err) {
    res.json({ status: "500" });
  }
});

// POST: Get messages by email
router.post("/message/gett/:email", async (req, res) => {
  try {
    handleJob();
    const mail = req.params.email;
    console.log("Fetching messages for:", mail);
    const response = await message.find({ receiver: mail, read: false });
    console.log("Messages found:", response);

    if (response.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ status: "500", message: "Internal Server Error" });
  }
});

// GET: Get conversation between two users
router.get("/message/get/perticular/:useremail/:nextemail", async (req, res) => {
  try {
    handleJob();
    const { useremail, nextemail } = req.params;
    const response = await message.find({
      $or: [
        { sender: useremail, receiver: nextemail },
        { sender: nextemail, receiver: useremail }
      ]
    });
    console.log(response);
    res.json(response);
  } catch (er) {
    res.json({ status: "500" });
  }
});

module.exports = router;
