# Bulk User Enrollment Script

## Overview
This script creates **500 test users** and automatically enrolls them in **5 specified courses**, creating proper order records in the database.

## Features
✅ **500 Unique Users** - Realistic UK-based names with professional formatting  
✅ **Unique Usernames** - Format: `uk_XXXX_N`, `pro_XXXX_N`, etc. (never exists in real world)  
✅ **Professional Emails** - Using Gmail, Yahoo, Outlook, Hotmail, ProtonMail  
✅ **Batch Processing** - Creates 50 users at a time for optimal performance  
✅ **Automatic Enrollment** - Each user enrolled in all 5 courses  
✅ **Complete Order Records** - Full order data with payment_info stored in DB  
✅ **Progress Tracking** - Real-time console output showing progress

## Course IDs
```
698fb312948a4a9fc03ed279
698e676a948a4a9fc03ec536
698e4765948a4a9fc03ec3fc
698dce30948a4a9fc03ec0ec
698d790d34e1b9d3090f3547
```

## Prerequisites
- Backend server running (or accessible)
- MongoDB connection configured in `.env`
- Ensure `.env` has:
  ```
  DIRECT_REGISTER_AUTH_USER=admin_equalmint
  DIRECT_REGISTER_AUTH_PASSWORD=equalmint$$804
  SERVER_URL=https://api.equalmint.com (or http://localhost:8000)
  DB_URI=mongodb+srv://...
  ```

## Running the Script

### Option 1: Using npm script (Recommended)
```bash
cd Backend
npm run bulk-enroll
```

### Option 2: Direct ts-node execution
```bash
cd Backend
npx ts-node --transpile-only scripts/bulkUserEnrollment.ts
```

## Expected Output
```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB

📚 Validating courses...
   ✅ Found course: Web Development Basics
   ✅ Found course: Advanced JavaScript
   ...

📊 Batch 1: Creating users 1-50...

👤 User 1/500: uk_aBcD_1 (alexander.smith1@gmail.com)
   ✅ Order created for course Web Development Basics
   ✅ Order created for course Advanced JavaScript
   ✅ Order created for course Python Fundamentals
   ...

✨ BULK ENROLLMENT COMPLETED ✨
==================================================
✅ Successfully created users: 500
❌ Failed to create users: 0
📚 Courses enrolled per user: 5
📝 Total orders created: 2500
==================================================

🔌 Disconnected from MongoDB
```

## What Gets Created

### Users (500 total)
- **Name**: Professional UK-based first and last names
- **Username**: Unique format (e.g., `uk_A1b2_0`, `pro_X9y8_42`)
- **Email**: `firstname.lastname@domain.com` with variation (gmail, yahoo, outlook, etc.)
- **Phone**: UK format (e.g., +447911234567)
- **Password**: `TempPassword123!@#` (marked as `testuser: true`, `isVerified: true`)
- **Marketplace Role**: Randomly assigned as `startup` or `contributor`

### Orders (2500 total = 500 users × 5 courses)
```javascript
{
  courseId: "...",
  userId: "...",
  courseName: "...",
  coursePrice: <number>,
  courseThumbnail: "...",
  instructorId: "...",
  instructorName: "...",
  status: "completed",
  payment_info: {
    paymentMethod: "free_enrollment" | "stripe",
    paymentStatus: "completed",
    amount: <coursePrice>,
    currency: "USD"
  },
  enrolledAt: <timestamp>,
  completedAt: <timestamp>
}
```

## Customization

### Change Number of Users
Edit line in `bulkUserEnrollment.ts`:
```typescript
const TOTAL_USERS = 500; // Change this number
```

### Change Courses
Edit line in `bulkUserEnrollment.ts`:
```typescript
const COURSE_IDS = [
  'your-course-id-1',
  'your-course-id-2',
  // ... more IDs
];
```

### Change Batch Size
Edit line in `bulkUserEnrollment.ts`:
```typescript
const BATCH_SIZE = 50; // Increase for faster processing, decrease for stability
```

## Performance Considerations
- **Current**: 50 users per batch, ~5 minutes for 500 users + enrollments
- **Batch Size 100**: ~3 minutes (faster but higher load)
- **Batch Size 25**: ~8 minutes (slower but lower stress)
- Database delays: Each user → 5 orders = ~2500 operations total

## Database Validation

### Verify Users Created
```javascript
db.users.countDocuments({ testuser: true, isVerified: true })
```

### Verify Orders Created
```javascript
db.orders.countDocuments({ status: "completed" })
```

### Check Specific User Enrollments
```javascript
db.orders.countDocuments({ userId: ObjectId("...") })
// Should return 5 (one per course)
```

## Troubleshooting

### Error: "Missing or invalid Authorization header"
- Check `.env` has correct `DIRECT_REGISTER_AUTH_USER` and `DIRECT_REGISTER_AUTH_PASSWORD`
- Verify server running: `npm run dev`

### Error: "Course not found"
- Verify course IDs exist in database
- Check MongoDB connection is working

### Error: "Failed to register user..."
- Email might already exist
- Username collision (rare but possible)
- Server might be down or unreachable

### MongoDB Connection Issues
- Ensure `.env` has correct `DB_URI`
- Check VPN if accessing cloud MongoDB
- Verify IP whitelist in MongoDB Atlas

## Cleanup (if needed)

### Remove Test Users
```javascript
db.users.deleteMany({ testuser: true })
db.orders.deleteMany({ userId: { $in: [test_user_ids] } })
```

## Support
For issues or modifications, check:
- [Backend/scripts/bulkUserEnrollment.ts](../scripts/bulkUserEnrollment.ts)
- [Backend/controllers/user.controller.ts](../controllers/user.controller.ts) - `directRegisterUser` 
- [Backend/controllers/enrollment.controller.ts](../controllers/enrollment.controller.ts)
