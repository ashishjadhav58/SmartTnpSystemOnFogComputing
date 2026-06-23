const express = require("express");
const router = express.Router();
const userdata = require("../Models/userdata.js");
const Recruiter = require("../Models/Recruiter.js");
const bcrypt = require("bcrypt");
const { handleJob } = require("../middleware/handleJob");

// PATCH: Update user account
router.patch("/accounts/:_id", async (req, res) => {
  try {
    const userId = req.params._id;
    const data = req.body;
    const user = await userdata.findByIdAndUpdate(userId, data, { new: "true" });
    handleJob();
    if (!user) {
      res.json({ status: "404", message: "Not found to update" });
    }
    res.json({ status: "200", message: "Updated successfully" });
  } catch (error) {
    console.log("error occurred");
    res.json({ status: "500" });
  }
});

// POST: Get TPO data by email
router.post("/tpo/getdataa/:email", async (req, res) => {
  try {
    const mail = req.params.email;
    const response = await userdata.find({ tpoemail: mail, accesstype: "Class Teacher" });
    res.status(200).json(response);
    handleJob();
  } catch (Error) {
    res.json({ status: "404" });
  }
});

// POST: Get student data by email
router.post("/tpo/getdata/studentt/:email", async (req, res) => {
  try {
    const mail = req.params.email;
    const students = await userdata.find({ classemail: req.params.email });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// POST: Get student profile by email
router.post("/tpo/getdata/student/profilee/:email", async (req, res) => {
  try {
    const mail = req.params.email;
    const student = await userdata.findOne({ email: mail });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student profile.' });
  }
});

// POST: Local signin (for offline mode when AWS is unavailable)
router.post("/user/signin", async (req, res) => {
  try {
    handleJob();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    // Find user by email (username is email in this system)
    const user = await userdata.findOne({ email: username });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Check password (plain text comparison for now, or use bcrypt if passwords are hashed)
    // Note: If passwords are stored as plain text, compare directly
    // If passwords are hashed, use bcrypt.compare
    let passwordMatch = false;
    
    if (user.password === password) {
      // Plain text password match
      passwordMatch = true;
    } else {
      // Try bcrypt comparison if password is hashed
      try {
        const bcrypt = require("bcrypt");
        passwordMatch = await bcrypt.compare(password, user.password);
      } catch (bcryptErr) {
        // If bcrypt fails, assume plain text didn't match
        passwordMatch = false;
      }
    }
    
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Get current host IP for AI services
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const hostname = host.split(':')[0];
    const aiServiceBaseUrl = `http://${hostname}:8000`;
    
    // Return user data in same format as AWS response
    res.json({
      data: {
        _id: user._id,
        id: user.id || user._id.toString(),
        username: user.username,
        email: user.email,
        accesstype: user.accesstype,
        tpoemail: user.tpoemail,
        classemail: user.classemail
      },
      ip: `${protocol}://${hostname}:5000`,
      aiServices: {
        baseUrl: aiServiceBaseUrl,
        resume: `${aiServiceBaseUrl}/resume`,
        predict: `${aiServiceBaseUrl}/predict`,
        match: `${aiServiceBaseUrl}/match`,
        chat: `${aiServiceBaseUrl}/resume/chat`
      },
      message: "Login Successful (Local Mode)"
    });
  } catch (err) {
    console.error("Error in local signin:", err);
    res.status(500).json({ error: "Failed to sign in", details: err.message });
  }
});

// POST: Bulk import students (by TPO)
router.post("/tpo/import-students", async (req, res) => {
  try {
    handleJob();
    const { students, tpoemail, classemail } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: "Students array is required and must not be empty" });
    }

    if (!tpoemail || !classemail) {
      return res.status(400).json({ error: "TPO email and class teacher email are required" });
    }

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (const studentData of students) {
      try {
        const { username, email, password, accesstype = "Student" } = studentData;

        if (!username || !email || !password) {
          failed++;
          errors.push(`Missing required fields for ${email || 'unknown'}`);
          continue;
        }

        // Validate password length (minimum 8 characters)
        if (password.length < 8) {
          failed++;
          errors.push(`Password must be at least 8 characters for ${email || 'unknown'}`);
          continue;
        }

        // Check if student already exists
        const existing = await userdata.findOne({ email });
        if (existing) {
          failed++;
          errors.push(`Student with email ${email} already exists`);
          continue;
        }

        // Create new student
        const newStudent = new userdata({
          username,
          email,
          password, // Store plain password (will be hashed if model has pre-save hook)
          accesstype: accesstype || "Student",
          tpoemail,
          classemail
        });

        await newStudent.save();
        imported++;
      } catch (err) {
        failed++;
        errors.push(`Error importing ${studentData.email || 'unknown'}: ${err.message}`);
        console.error(`Error importing student ${studentData.email}:`, err);
      }
    }

    res.status(200).json({
      success: true,
      imported,
      failed,
      total: students.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : [] // Return first 10 errors
    });
  } catch (err) {
    console.error("Error in bulk import:", err);
    res.status(500).json({ error: "Failed to import students", details: err.message });
  }
});

// Handler function for NewUser (exported for reuse in server.js)
const handleNewUser = async (req, res) => {
  console.log('🚀 [handleNewUser] Handler called!', {
    method: req.method,
    url: req.url,
    path: req.path,
    hasBody: !!req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : []
  });
  
  handleJob();
  try {
    console.log('[POST /NewUser] Received request from AWS:', {
      body: req.body,
      hasId: !!req.body?.id,
      hasEmail: !!req.body?.email,
      hasUsername: !!req.body?.username,
      fullBody: JSON.stringify(req.body)
    });

    const {
      id,           // UUID from AWS DynamoDB
      username,
      email,
      accesstype,
      tpoemail,
      classemail,
      password,
      updatedAt     // Timestamp from AWS
    } = req.body;

    // Validate required fields
    if (!email) {
      console.error('[POST /NewUser] Missing required field: email');
      return res.status(400).json({
        message: "Error creating user ❌",
        error: "Email is required"
      });
    }

    if (!username) {
      console.error('[POST /NewUser] Missing required field: username');
      return res.status(400).json({
        message: "Error creating user ❌",
        error: "Username is required"
      });
    }

    // Check if user already exists (by email or by AWS id)
    const existingUser = await userdata.findOne({ 
      $or: [
        { email: email },
        ...(id ? [{ id: id }] : [])
      ]
    });

    if (existingUser) {
      // Update existing user with AWS data
      existingUser.username = username || existingUser.username;
      existingUser.accesstype = accesstype || existingUser.accesstype;
      existingUser.tpoemail = tpoemail || existingUser.tpoemail;
      existingUser.classemail = classemail || existingUser.classemail;
      existingUser.password = password || existingUser.password;
      if (id) existingUser.id = id; // Store AWS UUID
      if (updatedAt) existingUser.updatedAt = new Date(updatedAt);
      
      await existingUser.save();
      console.log(`[POST /NewUser] Updated existing user from AWS:`, email);
      
      return res.status(200).json({
        message: "User updated successfully ✅",
        user: existingUser
      });
    }

    // Create new user with AWS data
    const userDataToSave = {
      username,
      email,
      accesstype: accesstype || "Student",
      tpoemail: tpoemail || "",
      classemail: classemail || "",
      password: password || "",
      updatedAt: updatedAt ? new Date(updatedAt) : new Date()
    };

    // Add AWS UUID if provided
    if (id) {
      userDataToSave.id = id;
    }

    const newUser = new userdata(userDataToSave);

    try {
      console.log(`[POST /NewUser] Attempting to save user to MongoDB:`, {
        email: newUser.email,
        username: newUser.username,
        id: newUser.id
      });
      
      await newUser.save();
      
      console.log(`[POST /NewUser] ✅ New user saved from AWS:`, {
        email: newUser.email,
        username: newUser.username,
        accesstype: newUser.accesstype,
        id: newUser.id,
        _id: newUser._id,
        savedAt: new Date().toISOString()
      });
    } catch (saveError) {
      console.error(`[POST /NewUser] ❌ Error saving user to MongoDB:`, {
        error: saveError.message,
        stack: saveError.stack,
        errorName: saveError.name,
        userData: {
          email: newUser.email,
          username: newUser.username,
          id: newUser.id
        }
      });
      throw saveError;
    }

    // If user is a Recruiter, also save to Recruiter collection for management
    if (accesstype === "Recruiter") {
      try {
        const existingRecruiter = await Recruiter.findOne({ email });
        if (!existingRecruiter) {
          const hashedPassword = await bcrypt.hash(password, 10);
          
          const newRecruiter = new Recruiter({
            username,
            email,
            password: hashedPassword,
            companyName: "",
            contactNumber: "",
            createdBy: tpoemail || "",
            isApproved: true,
            accesstype: "Recruiter"
          });
          
          await newRecruiter.save();
          console.log(`[POST /NewUser] Recruiter also saved to Recruiter collection:`, email);
        } else {
          console.log(`[POST /NewUser] Recruiter already exists in Recruiter collection:`, email);
        }
      } catch (recruiterError) {
        console.error("[POST /NewUser] Error saving recruiter to Recruiter collection:", recruiterError);
      }
    }

    // Verify user was saved by querying database
    const savedUser = await userdata.findOne({ email: email });
    if (!savedUser) {
      console.error('[POST /NewUser] ❌ User was not found in database after save!');
      return res.status(500).json({
        message: "Error creating user ❌",
        error: "User was not saved to database"
      });
    }

    console.log('[POST /NewUser] ✅ Verified user exists in database:', {
      email: savedUser.email,
      _id: savedUser._id,
      id: savedUser.id
    });

    res.status(201).json({
      message: "User created successfully ✅",
      user: {
        _id: savedUser._id,
        id: savedUser.id,
        email: savedUser.email,
        username: savedUser.username,
        accesstype: savedUser.accesstype
      }
    });
  } catch (error) {
    console.error('[POST /NewUser] ❌ Error processing request:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    res.status(500).json({
      message: "Error creating user ❌",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// POST: Handle new user from cloud (called by AWS Lambda after signup)
// This endpoint receives data from AWS Lambda signup and stores it in local MongoDB
// AWS sends: { id, username, email, classemail, tpoemail, accesstype, password, updatedAt }
router.post('/NewUser', handleNewUser);

// Export handler for use in server.js (for /NewUser route without /api prefix)
module.exports.handleNewUser = handleNewUser;

// GET: List all users
router.get('/users', async (req, res) => {
  try {
    handleJob();
    const users = await userdata.find();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET: Single user by id
router.get('/users/:id', async (req, res) => {
  try {
    handleJob();
    const user = await userdata.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST: Create user (alternative to /NewUser)
router.post('/users', async (req, res) => {
  try {
    handleJob();
    const newUser = new userdata(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(400).json({ error: 'Failed to create user', details: err.message });
  }
});

// PUT: Replace user
router.put('/users/:id', async (req, res) => {
  try {
    handleJob();
    const user = await userdata.findByIdAndReplace(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error replacing user:', err);
    res.status(400).json({ error: 'Failed to replace user', details: err.message });
  }
});

// PATCH: Push update to user (for arrays like skills, etc.)
router.patch('/users/:id/push', async (req, res) => {
  try {
    handleJob();
    const { field, value } = req.body;
    if (!field || value === undefined) {
      return res.status(400).json({ error: 'field and value are required' });
    }
    const user = await userdata.findByIdAndUpdate(
      req.params.id,
      { $push: { [field]: value } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error pushing to user:', err);
    res.status(400).json({ error: 'Failed to push update', details: err.message });
  }
});

// Export router as default
module.exports = router;

// Export handler for use in server.js (for /NewUser route without /api prefix)
// This must be after module.exports = router to properly attach to the exported object
module.exports.handleNewUser = handleNewUser;
