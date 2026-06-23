# Backend Code Refactoring Guide

## Overview
The large `server.js` file (1802 lines) has been refactored into a modular structure for better maintainability.

## New Folder Structure

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── constants.js         # API URLs, PORT, AI services config
├── middleware/
│   ├── handleJob.js         # Job tracking middleware
│   └── corsConfig.js        # CORS configuration
├── routes/
│   ├── statusRoutes.js      # Server status & health endpoints
│   ├── userRoutes.js        # User management endpoints
│   ├── messageRoutes.js     # Message endpoints
│   ├── driveRoutes.js       # Drive CRUD endpoints
│   ├── resourceRoutes.js    # Resource endpoints
│   ├── tpoRoutes.js         # TPO events & attendance
│   ├── emailUrlRoutes.js    # Email-URL mapping endpoints
│   ├── aiRoutes.js          # AI service endpoints
│   ├── recruiterRoutes.js   # Recruiter management endpoints
│   ├── resumeRoutes.js      # Resume builder endpoints
│   ├── driveAiRoutes.js     # Drive AI check endpoints
│   └── syncRoutes.js       # Fog sync endpoints
├── utils/
│   └── cronSync.js         # Cron job for cloud sync
├── Models/                  # (Existing - unchanged)
└── server.js               # Main entry point (now only 52 lines!)

```

## Route Organization

### Status Routes (`/`)
- `GET /status` - Server health check
- `GET /do-task` - Task trigger

### User Routes (`/api`)
- `PATCH /api/accounts/:_id` - Update user account
- `POST /api/tpo/getdataa/:email` - Get TPO data
- `POST /api/tpo/getdata/studentt/:email` - Get students by class
- `POST /api/tpo/getdata/student/profilee/:email` - Get student profile
- `POST /api/NewUser` - Create user from cloud
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Replace user
- `PATCH /api/users/:id/push` - Push update to user

### Message Routes (`/api`)
- `PATCH /api/message/:_id` - Update message
- `POST /api/message` - Create message
- `POST /api/message/gett/:email` - Get messages by email
- `GET /api/message/get/perticular/:useremail/:nextemail` - Get conversation

### Drive Routes (`/api`)
- `POST /api/drivedataa` - Get all drives
- `PUT /api/drivedata/:id` - Update drive
- `POST /api/drivedata` - Create drive

### Resource Routes (`/api`)
- `POST /api/resoucess` - Get all resources
- `POST /api/resouces` - Create resource
- `PUT /api/resouces/:id` - Update resource

### TPO Routes (`/api`)
- `POST /api/tpoeventss` - Get all TPO events
- `POST /api/tpoevents` - Create TPO event
- `PUT /api/tpoevents/:id` - Update TPO event
- `DELETE /api/tpoevents/:id` - Delete TPO event
- `POST /api/attendance` - Mark attendance

### EmailUrl Routes (`/api`)
- `POST /api/emailurls/list` - List all email-urls
- `POST /api/emailurls/get` - Get email-url by email
- `POST /api/emailurls` - Create email-url
- `PUT /api/emailurls/:id` - Replace email-url

### AI Routes (`/api`)
- `POST /api/ai/resume/score` - Score resume
- `POST /api/ai/resume/improve` - Improve resume section
- `POST /api/ai/predict/placement` - Predict placement probability
- `POST /api/ai/match/skills` - Match skills

### Recruiter Routes (`/api`)
- `POST /api/recruiter/create` - Create recruiter
- `POST /api/admin/recruiters/test` - Test endpoint
- `POST /api/admin/recruiters` - Get all recruiters
- `POST /api/recruiter/approve/:id` - Approve recruiter
- `DELETE /api/admin/recruiter/:id` - Delete recruiter
- `POST /api/recruiter/login` - Recruiter login
- `GET /api/recruiter/students` - Get students for recruiter
- `POST /api/recruiter/drive/create` - Create drive (by recruiter)
- `POST /api/admin/drive/approve/:id` - Approve drive
- `POST /api/admin/drives/test` - Test endpoint
- `POST /api/admin/drives/pending` - Get pending drives
- `POST /api/recruiter/students/export` - Export students to Excel

### Resume Routes (`/api`)
- `POST /api/resume/save/:studentId` - Save/update resume
- `GET /api/resume/:studentId` - Get resume
- `POST /api/resume/pdf/:studentId` - Update PDF URL

### Drive AI Routes (`/api`)
- `POST /api/drive/ai-check` - Check student-drive match

### Sync Routes (`/`)
- `POST /fogsynctable1` - Sync Drive data
- `POST /fogsynctable2` - Sync TPO Event data
- `POST /fogsynctable3` - Sync Resource data
- `POST /fogsynctable4` - Sync Message data
- `POST /fogsynctable5` - Sync Attendance data
- `POST /fogsynctable6` - Sync EmailUrl data

## Configuration Files

### `config/database.js`
- Handles MongoDB connection
- Exports `connectDB()` function

### `config/constants.js`
- `FOG_API` - Fog server URL
- `PORT` - Server port (5000)
- `AI_SERVICES` - AI service URLs
- `AWS_API_GATEWAY` - AWS Lambda endpoint
- `SYNC_API_ENDPOINT` - Sync endpoint URL

### `middleware/handleJob.js`
- `handleJob()` - Track active jobs
- `getActiveJobs()` - Get current job count

### `middleware/corsConfig.js`
- CORS configuration middleware

### `utils/cronSync.js`
- Cron job that runs every minute
- Syncs unsynced data to cloud (AWS Lambda)

## Benefits

1. **Maintainability**: Code is organized by feature
2. **Scalability**: Easy to add new routes/features
3. **Readability**: Each file has a single responsibility
4. **Testability**: Routes can be tested independently
5. **Collaboration**: Multiple developers can work on different features

## Migration Notes

- All existing endpoints remain the same
- No frontend changes required
- All functionality preserved
- Old `server.js` can be kept as backup

## Running the Server

The server starts the same way:
```bash
node backend/server.js
```

Or with nodemon:
```bash
nodemon backend/server.js
```

## Adding New Routes

1. Create route file in `backend/routes/`
2. Import models and middleware
3. Define routes using `router.get/post/put/delete`
4. Export router: `module.exports = router;`
5. Import in `server.js`: `const newRoutes = require("./routes/newRoutes");`
6. Mount in `server.js`: `app.use("/api", newRoutes);`

## Example: Adding a New Feature

```javascript
// backend/routes/exampleRoutes.js
const express = require("express");
const router = express.Router();
const { handleJob } = require("../middleware/handleJob");

router.get("/example", async (req, res) => {
  handleJob();
  res.json({ message: "Example endpoint" });
});

module.exports = router;
```

Then in `server.js`:
```javascript
const exampleRoutes = require("./routes/exampleRoutes");
app.use("/api", exampleRoutes);
```
