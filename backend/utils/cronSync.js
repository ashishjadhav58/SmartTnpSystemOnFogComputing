const cron = require("node-cron");
const Drive = require("../Models/drivedetail.js");
const TpoEvent = require("../Models/TpoEvent.js");
const Resource = require("../Models/Resouce.js");
const message = require("../Models/message.js");
const Attendence = require("../Models/Attendence.js");
const EmailUrl = require("../Models/EmailUrl.js");
const axios = require("axios");
const { FOG_API, SYNC_API_ENDPOINT } = require("../config/constants");

const buildSyncHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.SYNC_API_KEY) {
    headers["x-api-key"] = process.env.SYNC_API_KEY;
  }

  if (process.env.SYNC_API_AUTHORIZATION) {
    headers.Authorization = process.env.SYNC_API_AUTHORIZATION;
  }

  return headers;
};

const postSyncPayload = async (payload) => {
  const response = await axios.post(SYNC_API_ENDPOINT, payload, {
    headers: buildSyncHeaders(),
    timeout: 30000,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    const details = typeof response.data === "string"
      ? response.data
      : JSON.stringify(response.data);
    throw new Error(`Sync request rejected with status ${response.status}: ${details}`);
  }

  return response;
};

const buildSyncPayload = (document, syncTable, keyAliases = []) => {
  const documentId = document._id ? document._id.toString() : undefined;
  const payload = {
    ...document.toObject(),
    id: documentId,
    syncTable,
    sourcefog: FOG_API,
  };

  for (const alias of keyAliases) {
    payload[alias] = documentId;
  }

  return payload;
};

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
          const payload = buildSyncPayload(drive, "1", ["driveId"]);
          await postSyncPayload(payload);
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
          const payload = buildSyncPayload(event, "2", ["eventId"]);
          await postSyncPayload(payload);
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
          const payload = buildSyncPayload(res, "3", ["resourceId"]);
          await postSyncPayload(payload);
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
          const payload = buildSyncPayload(att, "5", ["attendanceId"]);
          await postSyncPayload(payload);
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
          const payload = buildSyncPayload(msg, "4", ["messageId"]);
          await postSyncPayload(payload);
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
          const payload = buildSyncPayload(e, "6", ["emailId"]);
          await postSyncPayload(payload);
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
