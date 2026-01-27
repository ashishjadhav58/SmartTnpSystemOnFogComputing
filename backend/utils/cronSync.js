const cron = require("node-cron");
const { SYNC_API_ENDPOINT } = require("../config/constants");
const Drive = require("../Models/drivedetail.js");
const TpoEvent = require("../Models/TpoEvent.js");
const Resource = require("../Models/Resouce.js");
const message = require("../Models/message.js");
const Attendence = require("../Models/Attendence.js");
const EmailUrl = require("../Models/EmailUrl.js");
const axios = require("axios");
const { FOG_API, AWS_API_GATEWAY } = require("../config/constants");

function startCronSync() {
  cron.schedule("*/1 * * * *", async () => {
    try {
      console.log();
      console.log("⏳ Cron sync started...");

      // 0️⃣ Drives
      const unsyncedDrives = await Drive.find({ isSync: false });
      if (unsyncedDrives.length === 0) {
        console.log("No new Drive data found while sync...");
      } else {
        for (const drive of unsyncedDrives) {
          const payload = {
            ...drive.toObject(),
            sourcefog: FOG_API,
            syncTable: "1",
          };
          await axios.post(SYNC_API_ENDPOINT, payload);
          drive.isSync = true;
          await drive.save();
        }
        console.log("new Drive data found and succesfully sync ...");
      }

      // 1️⃣ Events
      const unsyncedEvents = await TpoEvent.find({ isSync: false });
      if (unsyncedEvents.length === 0) {
        console.log("No new Event data found while sync...");
      } else {
        for (const event of unsyncedEvents) {
          const payload = {
            ...event.toObject(),
            sourcefog: FOG_API,
            syncTable: "2",
          };
          await axios.post(SYNC_API_ENDPOINT, payload);
          event.isSync = true;
          await event.save();
        }
        console.log("new Event data found and succesfully sync ...");
      }

      // 2️⃣ Resources
      const unsyncedResources = await Resource.find({ isSync: false });
      if (unsyncedResources.length === 0) {
        console.log("No new Resource data found while sync...");
      } else {
        for (const res of unsyncedResources) {
          const payload = {
            ...res.toObject(),
            sourcefog: FOG_API,
            syncTable: "3",
          };
          await axios.post(SYNC_API_ENDPOINT, payload);
          res.isSync = true;
          await res.save();
        }
        console.log("new Resource data found and succesfully sync ...");
      }

      // 4️⃣ Attendance
      const unsyncedAttendance = await Attendence.find({ isSync: false });
      if (unsyncedAttendance.length === 0) {
        console.log("No new Attendance data found while sync...");
      } else {
        for (const att of unsyncedAttendance) {
          const payload = {
            ...att.toObject(),
            sourcefog: FOG_API,
            syncTable: "5",
          };
          await axios.post(SYNC_API_ENDPOINT, payload);
          att.isSync = true;
          await att.save();
        }
        console.log("new Attendance data found and succesfully sync ...");
      }

      // 3️⃣ Messages
      const unsyncedMessages = await message.find({ isSync: false });
      if (unsyncedMessages.length === 0) {
        console.log("No new Message data found while sync...");
      } else {
        for (const msg of unsyncedMessages) {
          const payload = {
            ...msg.toObject(),
            sourcefog: FOG_API,
            syncTable: "4",
          };
          await axios.post(SYNC_API_ENDPOINT, payload);
          msg.isSync = true;
          await msg.save();
        }
        console.log("new Message data found and succesfully sync ...");
      }

      // 6️⃣ EmailUrls
      const unsyncedEmailUrls = await EmailUrl.find({ isSync: false });
      if (unsyncedEmailUrls.length === 0) {
        console.log("No new EmailUrl data found while sync...");
      } else {
        for (const e of unsyncedEmailUrls) {
          const payload = {
            ...e.toObject(),
            sourcefog: FOG_API,
            syncTable: "6",
          };
          await axios.post(SYNC_API_ENDPOINT, payload);
          e.isSync = true;
          await e.save();
        }
        console.log("new EmailUrl data found and succesfully sync ...");
      }
      console.log("✅ Sync completed this cycle");
      console.log();

    } catch (err) {
      console.error("❌ Cron error:", err.message);
    }
  });
}

module.exports = startCronSync;
