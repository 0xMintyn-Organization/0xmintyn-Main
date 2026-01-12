# Complete Backend Analysis

## 📋 **Overview**
The backend is built with **Node.js**, **Express**, **TypeScript**, and **MongoDB** (Mongoose). It's a comprehensive UBI (Universal Basic Income) platform with blockchain integration, marketplace, governance, and education features.

---

## 🏗️ **Architecture**

### **Tech Stack**
- **Runtime**: Node.js 18.x
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Blockchain**: Solana (devnet/mainnet)
- **Authentication**: JWT (Access + Refresh tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Caching**: Redis (ioredis)
- **Real-time**: Socket.io
- **Rate Limiting**: express-rate-limit

### **Project Structure**
```
Backend/
├── app.ts                    # Express app configuration
├── server.ts                 # Server entry point
├── socketServer.ts           # Socket.io server
├── config/                   # Configuration files
├── controllers/              # Business logic
├── models/                   # MongoDB schemas
├── routes/                   # API route definitions
├── middleware/               # Custom middleware
├── utils/                    # Utility functions
├── services/                 # Service layer
├── mails/                    # Email templates
└── uploads/                  # File storage
```

---

## 🔌 **API Routes Structure**

### **Base URL**: `/api/v1`

### **1. User Management** (`/api/v1/user`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /activate-user` - Activate account with code
- `POST /activate-link` - Activate account via link
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `GET /logout` - Logout user
- `GET /users` - Get all users
- `GET /refreshtoken` - Refresh access token
- `GET /me` - Get current user info
- `GET /instructor-stats/:instructorId` - Get instructor statistics
- `PUT /update-user-info` - Update profile
- `PUT /update-username` - Update username
- `PUT /change-password` - Change password
- `POST /social-auth` - Social authentication
- `PUT /update-user-avatar` - Update avatar
- `PUT /update-user-banner` - Update banner
- `POST /apply-instructor` - Apply for instructor role
- `PUT /toggle-seller-status` - Toggle seller status
- `PUT /update-social-account` - Update social account
- `DELETE /remove-social-account` - Remove social account
- `PUT /update-wallet-address` - Update wallet address
- `DELETE /remove-wallet-address` - Remove wallet address

### **2. Course Management** (`/api/v1/course`)
- Course CRUD operations
- Course enrollment
- Course content management

### **3. Marketplace** (`/api/v1/marketplace`)
- **Products**: `/products` - Product CRUD
- **Services**: `/services` - Service CRUD
- **Sellers**: `/sellers` - Seller management
- **Search**: `/search` - Marketplace search
- **Purchase**: `/purchase` - Purchase operations
- **Orders**: `/orders` - Order management
- **Messages**: `/messages` - Marketplace messaging
- **Offers**: `/offers` - Offer management
- **Reviews**: `/reviews` - Review management

### **4. Governance** (`/api/v1/proposal`, `/api/v1/vote`)
- Proposal creation and management
- Voting system
- Governance operations

### **5. Other Routes**
- `/api/v1/upload` - File uploads
- `/api/v1/stream` - Video streaming
- `/api/v1/analytics` - Analytics
- `/api/v1/role` - Role management
- `/api/v1/enrollment` - Course enrollment
- `/api/v1/certificate` - Certificate generation
- `/api/v1/bookmark` - Bookmarks
- `/api/v1/review` - Reviews
- `/api/v1/note` - Course notes
- `/api/v1/instructor` - Instructor operations
- `/api/v1/admin` - Admin operations
- `/api/v1/dashboard` - Dashboard data
- `/api/v1/influencer` - Influencer operations
- `/api/v1/auth0` - Auth0 integration

---

## 📊 **Database Models**

### **1. User Model** (`user.mode.ts`)
**Fields:**
- Personal Info: firstName, lastName, dateOfBirth, nationality, age, email, username, contactNumber, bio
- Authentication: password (hashed), role (user/instructor/admin/influencer)
- Profile: avatar, banner, instructorHeadline, instructorBio, instructorStatus
- Wallet: walletAddress, walletProvider, walletPrivateKey, walletConnectedAt
- Social: socialAccounts[] (platform, username, isVerified)
- Purchases: purchasedProducts[], purchasedServices[], purchasedItems[]
- Flags: isVerified, isSeller

**Methods:**
- `comparePassword()` - Compare password
- `SignAccessToken()` - Generate JWT access token
- `SignRefreshToken()` - Generate JWT refresh token

### **2. Course Model** (`course.model.ts`)
- Course information and content

### **3. Marketplace Models**
- **MarketplaceProduct** - Digital products
- **MarketplaceService** - Services
- **MarketplaceSeller** - Seller profiles
- **MarketplaceOrder** - Orders
- **MarketplaceReview** - Reviews
- **MarketplaceMessage** - Messages
- **MarketplaceOffer** - Offers

### **4. Governance Models**
- **Proposal** - Governance proposals
- **Vote** - Voting records

### **5. Other Models**
- **Order** - Course orders
- **Review** - Course reviews
- **Note** - Course notes
- **Bookmark** - Bookmarks

---

## 🔐 **Authentication & Authorization**

### **Authentication Middleware**
- `isAuthenticated` - JWT token verification
- `updateAccessTokenMiddleware` - Refresh token handling
- Cookie-based authentication (access_token, refresh_token)

### **Authorization**
- `authorizeRoles(...roles)` - Role-based access control
- `authorizeSeller` - Seller-specific access

### **Token Management**
- **Access Token**: 1 hour expiry
- **Refresh Token**: 3 days expiry
- Stored in HTTP-only cookies

---

## ⛓️ **Blockchain Integration**

### **Solana Integration**
- **Network**: Devnet (default) / Mainnet
- **RPC URL**: Configurable via `SOLANA_RPC_URL`
- **Token**: Mintyn (0XM) - `4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL`

### **Key Utilities**
1. **mintynPayment.ts**
   - Token balance checking
   - Token transfers with fee split (5% admin, 95% recipient)
   - Transaction signing and submission

2. **escrowContract.ts**
   - Escrow program integration
   - Release and refund operations
   - Admin keypair management

3. **Wallet Management**
   - Wallet address validation
   - Wallet connection tracking
   - Private key storage (encrypted)

---

## 🛡️ **Security Features**

1. **Rate Limiting**
   - General: 1000 requests per 15 minutes
   - Auth endpoints: 200 requests per 15 minutes
   - Disabled in development

2. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Minimum 6 characters

3. **CORS**
   - Configured for specific origins
   - Credentials enabled

4. **Input Validation**
   - Email regex validation
   - Solana address validation
   - Required field checks

---

## 📁 **File Upload System**

### **Multer Configuration**
- **Images**: `multerConfig.ts` - Avatar, banner, product images
- **Videos**: `multerVideo.ts` - Course videos
- **Storage**: `uploads/` directory
  - `uploads/images/` - Images
  - `uploads/videos/` - Videos
  - `uploads/files/` - Other files

---

## 📧 **Email System**

### **Templates** (`mails/`)
- `activatiomail.ejs` - Account activation
- `resetPassword.ejs` - Password reset

### **Features**
- SMTP configuration
- Activation codes
- Password reset links

---

## 🔄 **Real-time Features**

### **Socket.io** (`socketServer.ts`)
- Real-time messaging
- Notification system
- Live updates

---

## 🗄️ **Caching**

### **Redis** (`utils/redis.ts`)
- Session management
- Token caching
- Performance optimization

---

## 📈 **Analytics**

### **Analytics Controller**
- User analytics
- Course analytics
- Marketplace analytics
- Dashboard statistics

---

## 🎯 **Key Features**

### **1. User Management**
- ✅ Registration with email verification
- ✅ Social authentication (Auth0)
- ✅ Profile management
- ✅ Wallet integration
- ✅ Role-based access (user/instructor/admin/influencer)
- ✅ Seller status toggle

### **2. Course System**
- ✅ Course creation and management
- ✅ Video streaming
- ✅ Enrollment system
- ✅ Notes and bookmarks
- ✅ Reviews and ratings
- ✅ Certificates

### **3. Marketplace**
- ✅ Product and service listings
- ✅ Seller profiles
- ✅ Order management
- ✅ Escrow system
- ✅ Reviews and ratings
- ✅ Messaging system
- ✅ Offers and negotiations

### **4. Governance**
- ✅ Proposal creation
- ✅ Voting system
- ✅ Token-based governance

### **5. UBI System**
- ✅ User registration on blockchain
- ✅ UBI claims
- ✅ Treasury management
- ✅ Token distribution

---

## ❌ **Missing Features**

### **1. User Preferences/Settings API**
- ❌ No endpoint to save user preferences
- ❌ No model for user settings
- ❌ No API for notification preferences
- ❌ No API for privacy settings
- ❌ No API for payment preferences

### **2. Data Export**
- ❌ No GDPR data export endpoint
- ❌ No account deletion endpoint

### **3. 2FA Implementation**
- ❌ No two-factor authentication setup
- ❌ No authenticator app integration

### **4. Account Recovery**
- ❌ No recovery email management
- ❌ No recovery phone management
- ❌ No backup codes generation

---

## 🔧 **Environment Variables**

### **Required**
- `DB_URI` - MongoDB connection string
- `ACCESS_TOKEN` - JWT access token secret
- `REFRESH_TOKEN` - JWT refresh token secret
- `CLIENT_URL` - Frontend URL
- `PORT` - Server port (default: 8000)

### **Optional**
- `SOLANA_NETWORK` - devnet/mainnet (default: devnet)
- `SOLANA_RPC_URL` - Custom RPC URL
- `ADMIN_WALLET_ADDRESS` - Admin wallet for fees
- `ADMIN_SEED_PHRASE` - Admin seed phrase
- `NODE_ENV` - development/production

---

## 📝 **API Response Format**

### **Success Response**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## 🚀 **Deployment**

### **Build Process**
```bash
npm run build    # Compile TypeScript
npm start        # Run production server
```

### **Development**
```bash
npm run dev      # Run with ts-node-dev (hot reload)
```

---

## 📊 **Database Schema Summary**

### **User Schema**
- Personal information
- Authentication
- Wallet integration
- Social accounts
- Purchase history
- Role and permissions

### **Marketplace Schemas**
- Products, Services, Sellers
- Orders, Reviews, Messages
- Offers and negotiations

### **Course Schemas**
- Courses, Enrollments
- Notes, Bookmarks, Reviews
- Certificates

### **Governance Schemas**
- Proposals
- Votes

---

## 🔍 **Key Observations**

### **Strengths**
1. ✅ Comprehensive feature set
2. ✅ Well-structured codebase
3. ✅ Blockchain integration
4. ✅ Security measures in place
5. ✅ Real-time capabilities
6. ✅ File upload system
7. ✅ Email system

### **Areas for Improvement**
1. ⚠️ Missing user preferences API
2. ⚠️ No data export functionality
3. ⚠️ No 2FA implementation
4. ⚠️ Limited error handling in some areas
5. ⚠️ No API documentation (Swagger/OpenAPI)
6. ⚠️ No unit tests visible

---

## 📌 **Recommendations**

1. **Add User Preferences API**
   - Create UserPreferences model
   - Add GET/PUT endpoints for preferences
   - Store notification, privacy, payment preferences

2. **Implement Data Export**
   - GDPR-compliant data export
   - Account deletion with data removal

3. **Add 2FA**
   - TOTP-based 2FA
   - SMS/Email verification

4. **Add API Documentation**
   - Swagger/OpenAPI documentation
   - API endpoint documentation

5. **Add Testing**
   - Unit tests
   - Integration tests
   - E2E tests

---

**Last Updated**: Complete backend analysis
**Total Routes**: 20+ route groups
**Total Models**: 15+ models
**Total Controllers**: 25+ controllers

