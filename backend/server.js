const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fogapi = "https://97ccc07694d2.ngrok-free.app";
require("dotenv").config();
const cron = require("node-cron");
const userdata = require("./Models/userdata.js");
const message = require("./Models/message.js");
const Drive = require("./Models/drivedetail.js")
const Resource =require("./Models/Resouce.js")
const TpoEvent = require("./Models/TpoEvent.js")
const Attendence = require("./Models/Attendence.js")
const os = require("os")
const osu = require("os-utils");
const { json } = require("stream/consumers");
const { default: axios } = require("axios");

const app = express();
const port = 5000;
let activeJobs = 0;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Database is connected"))
  .catch((error) => console.log("❌ Error occurred:", error));

app.use(cors({
    origin: "*", 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'https://evolve-traning-and-placement-system.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); 

// POST: User Registration
function handleJob(duration = 10000) {
    activeJobs++;
    console.log("Job started. Active jobs:", activeJobs);

    setTimeout(() => {
        activeJobs--;
        console.log("Job ended. Active jobs:", activeJobs);
    }, duration);
}

function handleJob(duration = 10000) {
    activeJobs++;
    console.log("Job started. Active jobs:", activeJobs);

    setTimeout(() => {
        activeJobs--;
        console.log("Job ended. Active jobs:", activeJobs);
    }, duration);
}


app.get("/status", (req, res) => {
    try {
        // os-utils uses callback, not async/await
        osu.cpuUsage(function (cpuPercent) {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

            res.status(200).json({
                cpu: Math.round(cpuPercent * 100), // cpuUsage gives fraction (0–1)
                memory: usedMemPercent,
                activeJobs,
                status: "up"
            });
        });
    } catch (err) {
        console.error("❌ /status error:", err.message);
        res.status(500).json({ status: "down", error: err.message });
    }
});


app.get('/do-task', (req, res) => {
    handleJob(); // Just call the function
    res.json({ message: "Task started!" });
});

// app.post("/api/register", async (req, res) => {
//     try {
//         const { username, password, email, classemail, tpoemail, accesstype } = req.body;

        
//         const exist = await userdata.findOne({ email });
//         if (exist) {
//             return res.status(400).json({ status: "404", message: "User already exists" });
//         }      

//         const newuser = new userdata({
//             username,
//             password,
//             email,
//             classemail,
//             tpoemail,
//             accesstype
//         });

//         await newuser.save();
//         res.status(201).json({ status: 200, message: "User registered successfully", userId: newuser._id });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ status: 500, message: "Internal Server Error" });
//     }
// });

// app.get("/api/login", async (req, res) => {
//     try {
//         const response = await userdata.find();
//         if (response.length === 0) {
//             return res.status(404).json({ status: "404", message: "No users found" });
//         }
//         res.status(200).json(response);
//     } catch (err) {
//         console.log("Error occurred in /api/login route:", err);
//         res.status(500).json({ status: "500", message: "Internal Server Error" });
//     }
// });

app.patch("/api/accounts/:_id", async (req,res)=>{
   try{
    const userId = req.params._id;
    const data = req.body;
    const user = await userdata.findByIdAndUpdate(userId,data,{new:"true"});
    handleJob();
    if(!user){
        res.json({status:"404",message:"Not found to update"})
    }
   res.json({status:"200",message:"Updated successfulyy"})
   }
   catch(error){
        console.log("error occured");
        res.json({status:"500"})
   }
})

app.post("/api/tpo/getdataa/:email",async (req,res)=>{
    try{
        const mail = req.params.email;
        const response = await userdata.find({tpoemail:mail , accesstype:"Class Teacher"})    
        res.status(200).json(response)
         handleJob();
    }
    catch(Error){
        res.json({status:"404"})
    }
})

app.post("/api/tpo/getdata/studentt/:email",async (req,res)=>{
    try{
      
         handleJob();
        const mail = req.params.email;
        const response = await userdata.find({classemail:mail , accesstype:"Student"})  
        res.json(response)
    }
    catch(Error){
        res.json({status:"404"})
    }
})


app.post("/api/tpo/getdata/student/profilee/:email",async (req,res)=>{
    try{
         handleJob();
        const mail = req.params.email;
        const response = await userdata.find({email:mail , accesstype:"Student"})  
        res.json(response)
    }
    catch(Error){
        res.json({status:"404"})
    }
})

app.patch("/api/message/:_id",async (req,res)=>{
    console.log("ali");
    
    try{
         handleJob();
        const userId = req.params._id;
        const data = req.body;
        const user = await message.findByIdAndUpdate(userId,data,{new:"true"});
        if(!user){
            res.json({status:"404",message:"Not found to update"})
        }
       res.json({status:"200",message:"Updated successfulyy"})
       }
       catch(error){
            console.log("error occured");
            res.json({status:"500"})
       }
})

app.post("/api/message",async (req,res)=>{
    try{     
         handleJob();   
        const {sender,receiver,msg} = req.body;
    const newmsg = new message({
        sender,
        receiver,
        msg,
        read : false,
    })
    await newmsg.save()
    res.json({status:"200",id:newmsg._id})
    }
    catch(err){
        res.json({status:"500"})
    }
})

app.post("/api/message/gett/:email", async (req, res) => {
    try {
         handleJob();
        const mail = req.params.email;
        console.log("Fetching messages for:", mail);
        const response = await message.find({ receiver: mail, read: false });
        console.log("Messages found:", response);

        // Return an empty array if no messages exist
        if (response.length === 0) {
            return res.status(200).json([]); 
        }

        res.status(200).json(response);
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ status: "500", message: "Internal Server Error" });
    }
});

app.get("/api/message/get/perticular/:useremail/:nextemail",async (req,res)=>{
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
        res.json(response)
    }
    catch(er){
        res.json({status:"500"});
    }
})

app.post("/api/drivedataa", async (req, res) => {
    try {
         handleJob();
        const data = await Drive.find();  // Use await, not async
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "500", error: "Internal Server Error" });
    }
});

app.put("/api/drivedata/:id", async (req, res) => {
    try {
         handleJob();
      const updatedDrive = await Drive.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true } // return updated doc
      );
      if (!updatedDrive) {
        return res.status(404).json({ message: "Drive not found" });
      }
      res.json(updatedDrive);
    } catch (err) {
      console.error("Error updating drive:", err);
      res.status(500).json({ message: "Server Error" });
    }
  });

  app.post('/api/drivedata', async (req, res) => {
    try {
         handleJob();
      const {
        companyName,
        jobRole,
        salaryPackage,
        driveDate,
        eligibilityCriteria,
        description,
        registrationLink,
        status
      } = req.body;
  
      // Create a new drive object manually
      const newDrive = new Drive({
        companyName,
        jobRole,
        salaryPackage,
        driveDate,
        eligibilityCriteria,
        description,
        registrationLink,
        status
      });
  
      // Save to database
      await newDrive.save();
      res.status(201).json({ message: 'Drive added successfully', drive: newDrive });
  
    } catch (err) {
      console.error("Error in POST /drivedata:", err);
      res.status(400).json({
        error: "Failed to add drive. Check data format.",
        details: err.message
      });
    }
  });

 app.post('/api/resoucess', async (req, res) => {
  console.log("ali req")
    try {
         handleJob();
      const resources = await Resource.find();
      console.log(resources)
      res.json(resources);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });
  
  app.post('/api/resouces', async (req, res) => {
    try {
         handleJob();
      const newRes = new Resource(req.body);
      const saved = await newRes.save();
      res.json(saved);
    } catch (err) {
      res.status(400).json({ error: "Invalid input", details: err.message });
    }
  });

app.put('/api/resouces/:id', async (req, res) => {
    try {
         handleJob();
      const updated = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: "Update failed", details: err.message });
    }
  });
  
app.post('/api/tpoeventss', async (req, res) => {
  try {
    handleJob();
    const events = await TpoEvent.find();
    res.setHeader('Content-Type', 'application/json');  // explicitly set header
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/fogsynctable1', async (req, res) => {
   try {
         handleJob();
         console.log("Broadcast request arrived to drivesycn");
          const {
            id,
            createdAt,
            updatedAt,
        companyName,
        jobRole,
        salaryPackage,
        driveDate,
        eligibilityCriteria,
        description,
        registrationLink,
        status
      } = req.body;
  
      // Create a new drive object manually
      const newDrive = new Drive({
        updatedAt,
        createdAt,
        id,
        companyName,
        jobRole,
        salaryPackage,
        driveDate,
        eligibilityCriteria,
        description,
        registrationLink,
        status,
        isSync : true
      });
      await newDrive.save();
      console.log("Successfully received and store broadcast data");      
      res.status(201).json(newDrive);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});

app.post('/fogsynctable2', async (req, res) => {
   try {
      handleJob();
       console.log("Broadcast require arrived to Eventsycn");
       const {  id,
                                lecturer,
                                lectureName,
                                eventDateTime,
                                venue,
                                description,
                                status } = req.body;
        const newevent = new TpoEvent({
           id,
                                lecturer,
                                lectureName,
                                eventDateTime,
                                venue,
                                description,
                                status,
                                isSync:true
        })
       console.log("Successfully received and store broadcast data");
       await newevent.save();
      res.status(201).json(newevent);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});

app.post('/fogsynctable3', async (req, res) => {
   try {
         handleJob();
        console.log("Broadcast require arrived to Resourcesycn");
        const {  id,
                                resourceName,
                                description,
                                category,
                                driveLink,
                                uploadedBy,
                                uploadDate } = req.body;
        const newResource = new Resource({
                                id,
                                resourceName,
                                description,
                                category,
                                driveLink,
                                uploadedBy,
                                uploadDate,
                                isSync:true
        })
       console.log("Successfully received and store broadcast data");
       await newResource.save();
      res.status(201).json(newResource);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});

app.post('/fogsynctable4', async (req, res) => {
   try {
         console.log("Broadcast require arrived to Messagesycn");
         const { id,
                                sender,
                                receiver,
                                msg,
                                } = req.body;
        const newMessage = new Message({
           id,
                                sender,
                                receiver,
                                msg,
                                read: read ?? false,
                                isSync:true
        })
       console.log("Successfully received and store broadcast data");
       await newMessage.save();
      res.status(201).json(newMessage);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});

app.post('/fogsynctable5', async (req, res) => {
   try {
        await handleJob();
         console.log("Broadcast require arrived to Attendancesycn");
         const{
           id,
                                userEmail,
                                eventId,
                                eventName,
                                views,
                                feedback,
                                suggestion
         } = req.body;
        const newattend = new Attendence({
           id,
                                userEmail,
                                eventId,
                                eventName,
                                views,
                                feedback,
                                suggestion,
                                markedAt: new Date(markedAt),
                                isSync:true
        })
       console.log("Successfully received and store broadcast data");
       await newattend.save();
      res.status(201).json(newattend);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});
  
  app.post('/api/tpoevents', async (req, res) => {
    try {
         handleJob();
      const newEvent = new TpoEvent(req.body);
      const savedEvent = await newEvent.save();
      res.status(201).json(savedEvent);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  app.put('/api/tpoevents/:id', async (req, res) => {
    try {
         handleJob();
      const updatedEvent = await TpoEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedEvent);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  app.delete('/:id', async (req, res) => {
    try {
         handleJob();
      await TpoEvent.findByIdAndDelete(req.params.id);
      res.json({ message: "Event deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post("/api/attendance", async (req, res) => {
         handleJob();
    const { userEmail, eventId, eventName, views, feedback, suggestion, markedAt } = req.body;
  
    try {
      const attendance1 = new Attendence({
        userEmail,
        eventId,
        eventName,
        views,
        feedback,
        suggestion,
        markedAt
      });
  
      await attendance1.save();
      res.status(201).json({ message: "Attendance marked successfully" });
    } catch (error) {
      console.error("Error saving attendance:", error);
  
      if (error.code === 11000) {
        res.status(400).json({ message: "Attendance already marked for this event" });
      } else {
        res.status(500).json({ message: "Failed to mark attendance" });
      }
    }
  });

app.post('/NewUser', async (req, res) => {
   handleJob();
  try {
    const { 
      username, 
      email, 
      accesstype, 
      tpoemail, 
      classemail, 
      password 
    } = req.body;

    // create new user object
    const newUser = new userdata({
      username,
      email,
      accesstype,
      tpoemail,
      classemail,
      password
    });

    // save to DB
    await newUser.save();

    res.status(201).json({
      message: "User created successfully ✅",
      user: newUser
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating user ❌",
      error: error.message
    });
  }
});
  app.post('/api/classteacher/getdata/students/:email', async (req, res) => {
         handleJob();
    console.log("ali");
    const {email} = req.params;
    console.log(email);
    
    try {
      const students = await userdata.find({ classemail: req.params.email });
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch students.' });
    }
  });
  
  // GET profile of a specific student
  app.post('/api/classteacher/getdata/student/profile/:email', async (req, res) => {
         handleJob();
    try {
      const student = await userdata.find({ email: req.params.email });
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch student profile.' });
    }
  });

  app.post('/api/attendance/all', async (req, res) => {
         handleJob();
    try {
      const records = await Attendance.find().sort({ markedAt: -1 });
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: 'Server error while fetching attendance' });
    }
  });

  //corn sync logic for 1 minute

//   cron.schedule("*/1 * * * *", async () => {
//   try {
//     console.log(" Cron sync stared ");
//     for(var i = 0 ; i < 5 ; i++){
//       switch(i){
//         case 0:
//           const unsyncedDrives = await Drive.find({ isSync: false });
//           if(unsyncedDrives.length == 0){
//             console.log("No new Drive data found while sync ... ")
//           }
//           else{
//           for (const drive of unsyncedDrives) {
//             const payload = {
//                 ...drive.toObject(),
//                 sourcefog: fogapi,
//                 syncTable: "1",
//               };
//             await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata",payload)
//             drive.isSync = true;
//             await drive.save();
            
//           }
//         } 
//           case 1:
//           const unsyncedTpoevent = await TpoEvent.find({ isSync: false });
//           if(unsyncedTpoevent.length == 0){
//             console.log("No new Event data found while sync ... ")
//           }
//           else{
//           for (const event of unsyncedTpoevent) {
//             const payload = {
//                 ...event.toObject(),
//                 sourcefog: fogapi,
//                 syncTable: "2",
//               };
//             await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata",payload)
//             event.isSync = true;
//             await event.save();
//           }
//           }
//           case 2:
//           const unsyncedResource = await Resource.find({ isSync: false });
//           if(unsyncedResource.length == 0){
//             console.log("No new Resource data found while sync ... ")
//           }
//           else{
//           for (const Resource of unsyncedResource) {
//             const payload = {
//                 ...Resource.toObject(),
//                 sourcefog: fogapi,
//                 syncTable: "3",
//               };
//             await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata",payload)
//             Resource.isSync = true;
//             await Resource.save();
//           }
//           }
//           case 3:
//           const unsyncedMessage = await Message.find({ isSync: false });
//           if(unsyncedMessage.length == 0){
//             console.log("No new Drive data found while sync ... ")
//           }
//           else{
//           for (const msg of unsyncedMessage) {
//             const payload = {
//                 ...msg.toObject(),
//                 sourcefog: fogapi,
//                 syncTable: "4",
//               };
//             await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata",payload)
//             msg.isSync = true;
//             await msg.save();
//           }
//           }
//           case 4:
//           const unsyncedAttendance = await Attendence.find({ isSync: false });
//           if(unsyncedAttendance.length == 0){
//             console.log("No new Drive data found while sync ... ")
//           }
//           else{
//           for (const att of unsyncedAttendance) {
//             const payload = {
//                 ...att.toObject(),
//                 sourcefog: fogapi,
//                 syncTable: "5",
//               };
//             await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata",payload)
//             att.isSync = true;
//             await att.save();
//           }
//           }
//       }
//     }
//   } catch (err) {
//     console.error("❌ Cron error:", err.message);
//   }
// });

cron.schedule("*/5 * * * *", async () => {
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
          sourcefog: fogapi,
          syncTable: "1",
        };
        await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata", payload);
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
          sourcefog: fogapi,
          syncTable: "2",
        };
        await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata", payload);
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
          sourcefog: fogapi,
          syncTable: "3",
        };
        await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata", payload);
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
          sourcefog: fogapi,
          syncTable: "5",
        };
        await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata", payload);
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
          sourcefog: fogapi,
          syncTable: "4",
        };
        await axios.post("https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/syncdata", payload);
        msg.isSync = true;
        await msg.save();
      }
      console.log("new Message data found and succesfully sync ...");
    }
    console.log("✅ Sync completed this cycle");
    console.log();

  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }
});


app.listen(5000, '0.0.0.0', () => {
  console.log("Server running on port 5000");
});
