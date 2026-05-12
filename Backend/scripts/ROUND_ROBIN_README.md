# Round-Robin User Enrollment Script

## What It Does

Creates **500 users** and enrolls each one in **just ONE course** using a **round-robin pattern**:

```
User 1 → Course 1
User 2 → Course 2
User 3 → Course 3
User 4 → Course 4
User 5 → Course 5
User 6 → Course 1  (pattern repeats)
User 7 → Course 2
User 8 → Course 3
... and so on
```

## Result After Running
- ✅ **500 total users created**
- ✅ **100 users in Course 1** (positions: 1, 6, 11, 16, ...)
- ✅ **100 users in Course 2** (positions: 2, 7, 12, 17, ...)
- ✅ **100 users in Course 3** (positions: 3, 8, 13, 18, ...)
- ✅ **100 users in Course 4** (positions: 4, 9, 14, 19, ...)
- ✅ **100 users in Course 5** (positions: 5, 10, 15, 20, ...)

## 🚀 How to Run

### Terminal 1: Start Backend
```bash
cd Backend
npm run dev
```

### Terminal 2: Run the Script
```bash
cd Backend
npm run round-robin
```

## 🎯 Live API
```
http://localhost:8000/api/v1/register-direct
```
✅ Script hits the **live API** (not local)

## 📊 Expected Output

```
🚀 Starting Bulk User Creation (Round-Robin Enrollment)

📚 Course Assignment Pattern:
   User 1 → Course 1
   User 2 → Course 2
   User 3 → Course 3
   User 4 → Course 4
   User 5 → Course 5
   User 6 → Course 1
   User 7 → Course 2 ... and so on

🎯 Target: 500 users (100 per course)

📍 API: http://localhost:8000/api/v1/user/register-direct

======================================================================

📊 Batch 1: Creating users 1-50...
   ✅ User 1: uk_a7z2_0 → Course A (alexander.smith0@gmail.com)
   ✅ User 2: pro_x9m4_1 → Course B (benjamin.johnson1@yahoo.com)
   ✅ User 3: lead_k3p8_2 → Course C (lucy.williams2@outlook.com)
   ✅ User 4: elite_q5r9_3 → Course D (david.brown3@hotmail.com)
   ✅ User 5: prime_n2b7_4 → Course E (sophia.jones4@protonmail.com)
   ✅ User 6: core_w6j1_5 → Course A (margaret.garcia5@gmail.com)
   ... continues ...

======================================================================
✨ BULK USER CREATION COMPLETED ✨
======================================================================

✅ Successfully created: 500 users
❌ Failed to create: 0 users

📚 COURSE ENROLLMENT BREAKDOWN:
   Course 1: 100 users (698fb312948a4a9fc03ed279)
   Course 2: 100 users (698e676a948a4a9fc03ec536)
   Course 3: 100 users (698e4765948a4a9fc03ec3fc)
   Course 4: 100 users (698dce30948a4a9fc03ec0ec)
   Course 5: 100 users (698d790d34e1b9d3090f3547)

🎯 Total users enrolled: 500
======================================================================
```

## ⚙️ Key Differences from `bulk-enroll`

| Feature | bulk-enroll | round-robin |
|---------|------------|------------|
| **Users Created** | 500 | 500 |
| **Courses per User** | 5 (all) | 1 (round-robin) |
| **Total Orders** | 2500 | 500 |
| **Enrollment Pattern** | Each user in all 5 | 1→C1, 2→C2, ..., 6→C1 |
| **Users per Course** | 500 | 100 |

## 🔧 Customization

### Change Number of Users
Edit line in `bulkUserRoundRobin.ts`:
```typescript
const TOTAL_USERS = 500; // Change this
```

### Change Batch Size
Edit line in `bulkUserRoundRobin.ts`:
```typescript
const BATCH_SIZE = 50; // Smaller = safer, larger = faster
```

### Change Courses
Edit line in `bulkUserRoundRobin.ts`:
```typescript
const COURSE_IDS = [
  'your-course-1-id',
  'your-course-2-id',
  // ...
];
```

## ⏱️ Estimated Time
**5-10 minutes** for 500 users via live API

## 📝 Script Location
```
Backend/scripts/bulkUserRoundRobin.ts
```

## ✅ Verify It Worked

Check MongoDB:
```javascript
// Total users
db.users.countDocuments({ testuser: true })
// Should return: 500

// Users in ONE course (via orders)
db.orders.countDocuments({ courseId: ObjectId("698fb312948a4a9fc03ed279") })
// Should return: 100

// Verify one user only in one course
db.orders.countDocuments({ userId: ObjectId("<user_id>") })
// Should return: 1 (only ONE course)
```

---

**Ready to go!** Just run `npm run round-robin` 🚀
