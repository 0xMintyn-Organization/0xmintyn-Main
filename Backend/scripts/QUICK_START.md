# 🚀 Quick Start: Bulk User Enrollment

## 1️⃣ Ensure Backend Server is Running

Open a terminal in `Backend/` folder and run:
```bash
npm run dev
```

Wait for: `✅ Server started at http://localhost:8000`

## 2️⃣ Run the Bulk Enrollment Script

In a **different terminal**, navigate to `Backend/` and run:
```bash
npm run bulk-enroll
```

## 3️⃣ Monitor Progress

The script will:
1. ✅ Connect to MongoDB
2. ✅ Validate 5 courses exist
3. ✅ Create 500 users in batches (50 at a time)
4. ✅ Enroll each user in all 5 courses
5. ✅ Create order records for everything

**Total Operations**: 500 users + 2500 orders (enrollments)
**Estimated Time**: 5-10 minutes depending on server speed

## 📊 Sample Output

```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB

📚 Validating courses...
   ✅ Found course: Web Development Fundamentals
   ✅ Found course: Advanced JavaScript Patterns
   ✅ Found course: Python Mastery
   ✅ Found course: React Advanced
   ✅ Found course: Database Design

📋 Using 5 courses for enrollment

📊 Batch 1: Creating users 1-50...

👤 User 1/500: uk_a7z2_1 (alexander.smith1@gmail.com)
   ✅ Order created for course Web Development Fundamentals
   ✅ Order created for course Advanced JavaScript Patterns
   ✅ Order created for course Python Mastery
   ✅ Order created for course React Advanced
   ✅ Order created for course Database Design

👤 User 2/500: pro_x9m4_2 (benjamin.johnson2@yahoo.com)
   ✅ Order created for course Web Development Fundamentals
   ... continues ...

✨ BULK ENROLLMENT COMPLETED ✨
==================================================
✅ Successfully created users: 500
❌ Failed to create users: 0
📚 Courses enrolled per user: 5
📝 Total orders created: 2500
==================================================

🔌 Disconnected from MongoDB
```

## 📝 What Gets Created

### Users (500 total)
| Field | Example |
|-------|---------|
| Name | Alexander Smith, Lucy Johnson, etc. |
| Username | `uk_a7z2_1`, `pro_x9m4_42`, `lead_k3p8_99` |
| Email | alexander.smith1@gmail.com, lucy.johnson2@yahoo.com |
| Phone | +447911234567 (UK format) |
| Password | TempPassword123!@# (all same, for testing) |
| Status | Verified ✅, Test User ✅ |
| Role | Randomly startup or contributor |

### Orders/Enrollments (2500 total)
- One enrollment per user per course
- Status: ALL `completed`
- Created with full payment info:
  ```json
  {
    "payment_info": {
      "paymentMethod": "stripe" or "free_enrollment",
      "paymentStatus": "completed",
      "amount": 0 or course_price,
      "currency": "USD"
    },
    "enrolledAt": "2026-02-15T...",
    "completedAt": "2026-02-15T..."
  }
  ```

## ❓ FAQ

**Q: Can I stop the script mid-way?**  
A: Yes, press `Ctrl+C`. It processes in batches, so you'll have partial data. You can re-run it and it will skip already-enrolled users.

**Q: Will it create duplicate users?**  
A: No. Usernames are guaranteed unique with the format `prefix_RANDOMCODE_INDEX`. Emails are also unique per format.

**Q: How do I verify it worked?**  
A: 
- Open MongoDB compass
- Check `users` collection: should have 500 new docs with `testuser: true`
- Check `orders` collection: should have 2500 new docs with `status: "completed"`

**Q: Can I use real course IDs?**  
A: Yes! The script uses whatever course IDs are in the list. Just verify they exist first.

**Q: Isn't everyone getting the same password?**  
A: Yes - `TempPassword123!@#` - perfect for testing/demo purposes. If you want unique passwords, edit the script (around line 180).

## 🔧 Troubleshooting

**Error: "Cannot find module 'mongoose'"**
```bash
# In Backend folder:
npm install
```

**Error: "Direct register API is not configured"**
- Fix: Verify `.env` has these variables:
  ```
  DIRECT_REGISTER_AUTH_USER=admin_equalmint
  DIRECT_REGISTER_AUTH_PASSWORD=equalmint$$804
  ```

**Error: "Failed to create user... email already registered"**
- This is normal if re-running script. Script will skip and create remaining users.

**Error: "No valid courses found"**
- Verify the 5 course IDs exist in MongoDB
- Or update the course IDs in `bulkUserEnrollment.ts` line 28

---

**Need to modify the script?** See [BULK_ENROLLMENT_README.md](BULK_ENROLLMENT_README.md) for advanced options.
