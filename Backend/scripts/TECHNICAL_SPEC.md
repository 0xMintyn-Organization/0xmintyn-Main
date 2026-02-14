# Bulk User Enrollment - Technical Specification

## Script Location
```
Backend/scripts/bulkUserEnrollment.ts
```

## Execution Command
```bash
npm run bulk-enroll
```

## API Flow

### 1. User Registration (via Direct-Register API)
**Endpoint**: `POST /api/v1/user/register-direct`
**Auth**: Basic Auth (base64)
  - Username: `admin_equalmint`
  - Password: `equalmint$$804`

**Request Payload**:
```json
{
  "firstName": "Alexander",
  "lastName": "Smith",
  "email": "alexander.smith1@gmail.com",
  "username": "uk_a7z2_1",
  "password": "TempPassword123!@#",
  "contactNumber": "+447911234567",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "nationality": "United Kingdom",
  "marketplace_role": "startup" | "contributor"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User created successfully",
  "userId": "507f1f77bcf86cd799439011",
  "email": "alexander.smith1@gmail.com",
  "username": "uk_a7z2_1"
}
```

### 2. Order Creation (Direct Database)
**Model**: `OrderModel`
**Operation**: `await OrderModel.create(orderData)`

**Order Payload** (per course per user):
```json
{
  "courseId": "698fb312948a4a9fc03ed279",
  "userId": "507f1f77bcf86cd799439011",
  "courseName": "Web Development Fundamentals",
  "coursePrice": 49.99,
  "courseThumbnail": "https://example.com/thumb.jpg",
  "instructorId": "507f1f77bcf86cd799439012",
  "instructorName": "John Instructor",
  "status": "completed",
  "payment_info": {
    "paymentMethod": "stripe" | "free_enrollment",
    "paymentStatus": "completed",
    "amount": 49.99,
    "currency": "USD"
  },
  "enrolledAt": "2026-02-15T10:30:00.000Z",
  "completedAt": "2026-02-15T10:30:00.000Z"
}
```

## Data Generation Details

### Names (UK Professional Format)
**First Names** (20 options):
```
Alexander, Benjamin, Christopher, David, Edward,
Frederick, George, Henry, Isaac, James,
Katherine, Lucy, Margaret, Olivia, Patricia,
Sophia, Thomas, Victoria, William, Xavier
```

**Last Names** (30 options):
```
Smith, Johnson, Williams, Brown, Jones, Garcia,
Miller, Davis, Martinez, Taylor, Anderson, Thomas,
Moore, Jackson, Martin, Lee, White, Harris,
Thompson, Clark, Lewis, Walker, Hall, Allen,
Young, Hernandez, King, Wright, Lopez, Hill
```

**Example Names Generated**:
- Alexander Smith
- Lucy Johnson
- Thomas Williams
- Margaret Garcia

### Usernames (Professional Format with Randomization)
**Pattern**: `{PREFIX}_{RANDOM_4_CHARS}_{INDEX}`

**Prefixes** (8 options, rotated):
```
uk, pro, lead, elite, prime, core, nexus, apex
```

**RANDOM**: 4 random uppercase characters
**INDEX**: User creation index (0-499)

**Examples**:
```
uk_a7z2_0
pro_x9m4_1
lead_k3p8_42
elite_q5r9_99
prime_n2b7_250
core_w6j1_499
```

### Emails (Multiple Domains)
**Domains** (5 options, cycled):
```
gmail.com
yahoo.com
outlook.com
hotmail.com
protonmail.com
```

**Patterns** (3 variations, cycled):
```
1. {firstname}.{lastname}{index}@{domain}
   → alexander.smith1@gmail.com

2. {firstname}{index}@{domain}
   → alexander1@yahoo.com

3. {lastname}.{firstname_initial}@{domain}
   → smith.a@outlook.com
```

### Phone Numbers (UK Format)
**Pattern**: `+44{PREFIX}{4DIGITS}{4DIGITS}`

**Prefixes** (3 UK area codes):
```
07 (Mobile)
02 (London)
01 (Regional)
```

**Examples**:
```
+447911234567
+442071234567
+441234567890
```

### Dates of Birth
**Range**: 1980-2020 (ages 6-46)
**Format**: Random day/month within the year range
```
ExampleDOB: 1995-03-14T00:00:00.000Z (age ~31)
```

## Database Schema Impact

### Users Collection
**New Documents**: 500
**Fields Created**:
- `firstName`, `lastName` (string)
- `email` (string, unique indexed)
- `username` (string, unique indexed)
- `contactNumber` (string)
- `dateOfBirth` (date)
- `nationality` (string) = "United Kingdom"
- `age` (number) = calculated from DOB
- `password` (string, hashed)
- `role` (string) = "user" (default from direct-register)
- `marketplace_role` (string) = "startup" | "contributor" (random)
- `isVerified` (boolean) = true
- `testuser` (boolean) = true
- `createdAt`, `updatedAt` (timestamps)

### Orders Collection
**New Documents**: 2500 (500 users × 5 courses)
**Fields Created**:
- `courseId`, `userId` (ObjectId, indexed)
- `courseName`, `instructorName` (string)
- `coursePrice` (number, from course doc)
- `status` (string) = "completed"
- `payment_info` (object with paymentMethod, paymentStatus, amount, currency)
- `enrolledAt`, `completedAt` (timestamps)

## Processing Details

### Batching
- **Batch Size**: 50 users
- **Total Batches**: 10 (for 500 users)
- **Delay Between Orders**: 50ms (prevents DB overload)
- **Processing Order**:
  1. Batch of 50 users created in parallel
  2. Each user then enrolled in 5 courses sequentially
  3. 50ms pause between each course enrollment
  4. Move to next batch of 50 users

### Rate Limiting
- **API Calls**: All made through standard HTTP (no throttling)
- **DB Operations**: 50 users registered, then 250 orders created per batch
- **Total Estimated Time**: 5-10 minutes for all 500 users + 2500 orders

## Error Handling

### Skipped Scenarios
- User registration fails → Logged, skipped, continues to next user
- Course not found → Skipped for that enrollment, continues
- User already enrolled → Detected and reported, not re-enrolled
- MongoDB duplicate key → Caught at registration stage

### Logged Events
- ✅ User creation success
- ✅ Order creation per course
- ❌ User registration failure (with reason)
- ✅ Course validation
- ⚠️ Already enrolled warning
- 💥 Fatal errors (connection, missing config)

## Validation Queries

### Check Created Users
```javascript
// Count
db.users.countDocuments({ testuser: true, isVerified: true })
// Should return: 500

// Sample
db.users.findOne({ testuser: true })
// Returns sample user document
```

### Check Created Orders
```javascript
// Total count
db.orders.countDocuments({ status: "completed" })
// Should return: >=2500

// By course
db.orders.countDocuments({ courseId: ObjectId("698fb312948a4a9fc03ed279") })
// Should return: 500 (one per user)

// By user
db.orders.countDocuments({ userId: ObjectId("507f1f77bcf86cd799439011") })
// Should return: 5 (one per course)
```

## Configuration Variables

Located in `Backend/.env`:
```
SERVER_URL=https://api.equalmint.com
DB_URI=mongodb+srv://...
DIRECT_REGISTER_AUTH_USER=admin_equalmint
DIRECT_REGISTER_AUTH_PASSWORD=equalmint$$804
```

## Customization Points

### Change User Count
File: `bulkUserEnrollment.ts`, Line: ~63
```typescript
const TOTAL_USERS = 500; // Change to desired number
```

### Change Courses
File: `bulkUserEnrollment.ts`, Line: ~28
```typescript
const COURSE_IDS = [
  'your-course-1',
  'your-course-2',
  // ...
];
```

### Change Batch Size
File: `bulkUserEnrollment.ts`, Line: ~61
```typescript
const BATCH_SIZE = 50; // Increase for speed, decrease for stability
```

### Change Name Pools
File: `bulkUserEnrollment.ts`, Lines: 29-45
```typescript
const FIRST_NAMES = [ /* Update array */ ];
const LAST_NAMES = [ /* Update array */ ];
```

### Change Domains
File: `bulkUserEnrollment.ts`, Line: 47
```typescript
const EMAIL_DOMAINS = ['gmail.com', 'custom.com', /* ... */ ];
```

## Success Criteria

✅ Script runs without fatal errors  
✅ 500 users created with unique emails and usernames  
✅ 2500 orders created (500 × 5)  
✅ All orders have status "completed"  
✅ All users marked as `testuser: true` and `isVerified: true`  
✅ Consol shows 0 failures (or minimal acceptable level)  
✅ Database documents are searchable and valid  

## Cleanup Commands

### Remove All Test Users
```javascript
db.users.deleteMany({ testuser: true })
```

### Remove All Test Orders
```javascript
db.orders.deleteMany({ 
  $expr: { 
    $in: [ "$userId", 
      db.users.find({ testuser: true }).map(d => d._id)
    ] 
  } 
})
```

### Keep Users but Remove Orders
```javascript
// First identify test user IDs
const testUserIds = db.users.find({ testuser: true }).map(d => d._id)

// Then delete their orders
db.orders.deleteMany({ userId: { $in: testUserIds } })
```

---

**Created**: February 15, 2026  
**Script Version**: 1.0  
**Database Target**: MongoDB + Mongoose  
**API Target**: Express Backend with Direct-Register API
