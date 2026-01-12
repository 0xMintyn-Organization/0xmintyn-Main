# Service Purchase & Order Tracking - Deep Analysis

## 📋 Table of Contents
1. [Service Purchase Flow](#service-purchase-flow)
2. [Order Creation & Management](#order-creation--management)
3. [Order Tracking System](#order-tracking-system)
4. [Payment Processing](#payment-processing)
5. [Delivery & Revision Workflow](#delivery--revision-workflow)
6. [Status Management](#status-management)
7. [Frontend Components](#frontend-components)
8. [Backend APIs](#backend-apis)
9. [Data Models](#data-models)
10. [Key Differences: Services vs Products](#key-differences-services-vs-products)

---

## 1. Service Purchase Flow

### 1.1 Purchase Methods

#### **Method A: Direct Service Package Purchase** (Not Yet Implemented)
- **Current Status**: ❌ Not implemented
- **Location**: `PurchaseModal.tsx` (lines 36-43)
- **Behavior**: Shows error message "Service purchases are not yet integrated with blockchain payment"
- **Future**: Should integrate blockchain payment similar to products

#### **Method B: Custom Offer Acceptance** (✅ Implemented)
- **Flow**: 
  1. Buyer initiates conversation with seller
  2. Seller creates custom offer via messaging system
  3. Buyer accepts offer
  4. Order automatically created with `paymentStatus: 'pending'`
- **Location**: `marketplaceOffer.controller.ts` → `acceptOffer()` (lines 175-343)
- **Key Steps**:
  ```typescript
  1. Validate offer (status, expiration)
  2. Mark offer as 'accepted'
  3. Calculate platform fee (10%)
  4. Create order with status 'processing'
  5. Update user's purchasedItems
  6. Update seller stats
  ```

### 1.2 Order Creation from Offer

**File**: `Backend/controllers/marketplace/marketplaceOffer.controller.ts`

**Process**:
```typescript
acceptOffer() {
  // 1. Validate offer
  - Check buyer is authenticated
  - Verify offer is pending and not expired
  - Ensure buyer is the offer recipient
  
  // 2. Accept offer
  - Set offer.status = 'accepted'
  - Set offer.acceptedAt = now
  
  // 3. Calculate fees
  - platformFee = 10% of offer.price
  - sellerNetAmount = offer.price - platformFee
  
  // 4. Create order
  - orderStatus: 'processing' (starts immediately)
  - paymentStatus: 'pending' (payment not yet processed)
  - estimatedDeliveryDate: calculated from deliveryTime string
  - statusHistory: initial entry with timestamp
  
  // 5. Update related entities
  - Add to user.purchasedItems
  - Increment seller.totalSales
  - Increment service.orderCount and inQueueCount
}
```

**Order Data Structure**:
```typescript
{
  buyerId: ObjectId,
  sellerId: ObjectId (MarketplaceSeller._id),
  offerId: ObjectId,
  items: [{
    itemId: serviceId,
    itemType: 'service',
    itemTitle: string,
    itemPrice: offer.price,
    packageDetails: {
      packageName: offer.offerTitle,
      features: offer.deliverables,
      deliveryTime: offer.deliveryTime,
      revisions: offer.revisions
    }
  }],
  orderTotal: offer.price,
  currency: '0XM',
  paymentStatus: 'pending',
  orderStatus: 'processing',
  estimatedDeliveryDate: Date,
  startedAt: Date,
  statusHistory: [{ status, timestamp, note }]
}
```

---

## 2. Order Creation & Management

### 2.1 Direct Order Creation (Services)

**File**: `Backend/controllers/marketplace/marketplaceOrder.controller.ts`
**Function**: `createMarketplaceOrder()` (lines 67-356)

**Key Logic**:
```typescript
// Check if order contains only products
const isProductOnlyOrder = orderItems.every(item => item.itemType === 'product');

if (isProductOnlyOrder) {
  // Products: Require blockchain payment immediately
  - Validate wallet addresses
  - Process signed transaction
  - Set paymentStatus: 'completed'
  - Set orderStatus: 'completed'
} else {
  // Services: Create with pending payment
  - paymentStatus: 'pending'
  - orderStatus: 'pending'
  - No blockchain payment required at creation
}
```

**Service Order Creation**:
```typescript
{
  buyerId: userId,
  sellerId: sellerId,
  items: orderItems,
  orderTotal: totalAmount,
  currency: '0XM',
  paymentStatus: 'pending',  // ⚠️ Payment not processed
  orderStatus: 'pending',     // ⚠️ Not yet confirmed
  shippingAddress: {...},
  notes: string,
  isActive: true
}
```

### 2.2 Order Number Generation

**Location**: `MarketplaceOrder.model.ts` (lines 458-469)

**Process**:
```typescript
pre('save' middleware) {
  if (isNew && !orderNumber) {
    const count = await MarketplaceOrderModel.countDocuments();
    orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
}
```

**Format**: `ORD-{timestamp}-{sequential_number}`
**Example**: `ORD-1703123456789-0001`

---

## 3. Order Tracking System

### 3.1 Status History

**Model Field**: `statusHistory` (array of objects)
```typescript
statusHistory: [{
  status: string,        // Order status at this point
  timestamp: Date,        // When status changed
  note?: string          // Optional note/description
}]
```

**Automatic Updates**:
- Order creation: Initial entry added
- Status changes: New entry added via `$push`
- Delivery: Entry with delivery note
- Revision requests: Entry with revision reason
- Completion: Entry with completion note

### 3.2 Status Timeline Component

**File**: `Frontend/src/components/Marketplace/OrderStatusTimeline.tsx`

**Features**:
- Visual timeline with status dots
- Color-coded status indicators
- Timestamp display for each status
- Notes display for status changes
- Special handling for cancelled orders

**Status Flow**:
```
pending → confirmed → processing → delivered → completed
         ↓
      cancelled
```

**Visual States**:
- **Past**: Green checkmark, grayed out
- **Current**: Highlighted with ring, "Current" badge
- **Future**: Grayed out, "Pending" text

### 3.3 Order Status Values

**Order Status Enum**:
```typescript
'pending' | 'confirmed' | 'processing' | 'delivered' | 
'revision_requested' | 'completed' | 'cancelled' | 'refunded'
```

**Payment Status Enum**:
```typescript
'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
```

---

## 4. Payment Processing

### 4.1 Current Payment Status for Services

**⚠️ CRITICAL**: Services currently have **NO blockchain payment integration**

**Current State**:
- `paymentStatus: 'pending'` when order created
- No payment processing on order creation
- Payment remains pending throughout order lifecycle
- Payment only marked as 'completed' when buyer accepts delivery

**Location**: `marketplaceOrder.controller.ts` (lines 296-350)

### 4.2 Payment Flow Comparison

| Aspect | Products | Services |
|--------|----------|----------|
| **Payment at Order Creation** | ✅ Required (blockchain) | ❌ Not required |
| **Payment Method** | `mintyn` (0XM tokens) | `pending` |
| **Payment Status** | `completed` immediately | `pending` until delivery accepted |
| **Transaction Signature** | ✅ Stored | ❌ Not stored |
| **Fee Split** | ✅ 5% admin, 95% seller | ❌ Not calculated |
| **Payment Release** | Immediate | On delivery acceptance |

### 4.3 Payment Completion for Services

**Trigger**: Buyer accepts delivery
**Location**: `acceptDelivery()` (lines 1143-1206)

```typescript
acceptDelivery() {
  // Update order
  orderStatus: 'completed'
  paymentStatus: 'completed'  // ⚠️ Payment released without actual payment
  completedAt: Date.now()
  
  // Update seller stats
  - Increment totalSales
  - Add to totalEarnings
}
```

**⚠️ ISSUE**: Payment is marked as completed without actual blockchain transaction!

---

## 5. Delivery & Revision Workflow

### 5.1 Delivery Process

**File**: `Backend/controllers/marketplace/marketplaceOrder.controller.ts`
**Function**: `deliverOrder()` (lines 839-927)

**Seller Actions**:
1. Upload delivery files (optional, max 10 files)
2. Add delivery message (optional)
3. Submit delivery

**Backend Process**:
```typescript
deliverOrder() {
  // 1. Validate
  - Check seller is authenticated
  - Verify order belongs to seller
  - Ensure orderStatus is 'processing'
  
  // 2. Handle file uploads
  - Process multipart/form-data
  - Store files in /uploads directory
  - Create deliveryFiles array
  
  // 3. Update order
  orderStatus: 'delivered'
  deliveryDate: Date.now()
  deliveryMessage: string
  deliveryFiles: [{ filename, originalName, fileUrl, fileSize, mimeType, uploadedAt }]
  statusHistory: push new entry
  
  // 4. Update seller stats
  - Increment totalSales
}
```

**File Upload**:
- **Route**: `POST /marketplace/orders/:orderId/deliver`
- **Middleware**: `upload.array("deliveryFiles", 10)`
- **Storage**: Local filesystem (`/uploads`)
- **Max Files**: 10 per delivery

### 5.2 Revision Request Workflow

**File**: `Backend/controllers/marketplace/marketplaceOrder.controller.ts`
**Function**: `requestRevision()` (lines 1032-1139)

**Buyer Actions**:
1. Request revision on delivered order
2. Provide revision reason
3. List requested changes
4. Submit request

**Backend Process**:
```typescript
requestRevision() {
  // 1. Validate
  - Check buyer is authenticated
  - Verify order belongs to buyer
  - Ensure orderStatus is 'delivered' or 'revision_requested'
  - Check revisionCount < maxRevisions (default: 3)
  
  // 2. Handle existing revision requests
  - Clear stale/incomplete requests
  - Reject if pending request exists
  
  // 3. Create revision request
  revisionRequest: {
    requestedAt: Date.now()
    requestedBy: buyerId
    revisionReason: string
    revisionDetails: string
    requestedChanges: string[]
    status: 'pending'
  }
  
  // 4. Update order
  orderStatus: 'revision_requested'
  revisionCount: increment
  statusHistory: push new entry
}
```

**Revision Limits**:
- **Default maxRevisions**: 3
- **Tracking**: `revisionCount` field
- **Enforcement**: Prevents requests if limit reached

### 5.3 Seller Response to Revision

**File**: `Backend/controllers/marketplace/marketplaceOrder.controller.ts`
**Function**: `respondToRevision()` (lines 1208-1302)

**Seller Actions**:
1. Accept or reject revision request
2. Upload revision files (if accepting)
3. Add response message

**Backend Process**:
```typescript
respondToRevision() {
  // 1. Validate
  - Check seller is authenticated
  - Verify order belongs to seller
  - Ensure orderStatus is 'revision_requested'
  - Verify revisionRequest.status is 'pending'
  
  // 2. Handle file uploads (if accepting)
  - Process revision files
  - Store in revisionRequest.revisionFiles
  
  // 3. Update based on action
  if (action === 'accept') {
    revisionRequest.status: 'completed'
    orderStatus: 'delivered'  // Re-delivered
    statusHistory: push entry
  } else if (action === 'reject') {
    revisionRequest.status: 'rejected'
    statusHistory: push entry
  }
}
```

**Revision States**:
- `pending`: Buyer requested, seller hasn't responded
- `in_progress`: Seller is working on it (not explicitly set)
- `completed`: Seller completed and re-delivered
- `rejected`: Seller rejected the request

### 5.4 Delivery Acceptance

**File**: `Backend/controllers/marketplace/marketplaceOrder.controller.ts`
**Function**: `acceptDelivery()` (lines 1143-1206)

**Buyer Actions**:
1. Review delivered files
2. Accept delivery
3. Order marked as completed

**Backend Process**:
```typescript
acceptDelivery() {
  // 1. Validate
  - Check buyer is authenticated
  - Verify order belongs to buyer
  - Ensure orderStatus is 'delivered' or 'revision_requested'
  
  // 2. Update order
  orderStatus: 'completed'
  paymentStatus: 'completed'  // ⚠️ Payment released
  completedAt: Date.now()
  statusHistory: push entry
  
  // 3. Update seller stats
  - Call updateSellerStatsAfterOrder()
  - Increment totalSales
  - Add to totalEarnings
}
```

---

## 6. Status Management

### 6.1 Status Update Function

**File**: `Backend/controllers/marketplace/marketplaceOrder.controller.ts`
**Function**: `updateOrderStatus()` (lines 494-552)

**Capabilities**:
- Update `orderStatus`
- Update `paymentStatus`
- Add notes
- Permission check (buyer or seller only)

**Process**:
```typescript
updateOrderStatus() {
  // 1. Validate permissions
  - Check user is buyer OR seller
  - Verify order exists and is active
  
  // 2. Update status
  - Update orderStatus if provided
  - Update paymentStatus if provided
  - Update notes if provided
  
  // 3. Handle completion
  if (orderStatus === 'completed') {
    - Update seller stats
  }
}
```

### 6.2 Status Transitions

**Valid Transitions**:

**Normal Flow**:
```
pending → confirmed → processing → delivered → completed
```

**With Revisions**:
```
processing → delivered → revision_requested → delivered → completed
```

**Cancellation**:
```
pending/confirmed → cancelled
```

**Refund**:
```
completed → refunded
```

### 6.3 Status History Tracking

**Automatic Entries**:
- Order creation: `{ status: 'processing', timestamp, note: 'Order created from accepted offer...' }`
- Delivery: `{ status: 'delivered', timestamp, note: 'Order delivered by seller' }`
- Revision request: `{ status: 'revision_requested', timestamp, note: 'Revision requested: {reason}' }`
- Completion: `{ status: 'completed', timestamp, note: 'Delivery accepted by buyer' }`

**Manual Entries**: Can be added via `updateOrderStatus()` with notes

---

## 7. Frontend Components

### 7.1 Buyer Orders Page

**File**: `Frontend/src/app/(userdashboard)/marketplace/orders/buyer/page.tsx`

**Features**:
- Order list with filtering (all, confirmed, processing, delivered, revision_requested, completed, cancelled)
- Search functionality
- Status badges with colors
- Order details modal
- Delivery file download
- Revision request interface
- Delivery acceptance button
- Pagination

**Key Functions**:
- `fetchOrders()`: Fetches orders from `/marketplace/orders/buyer`
- `getRemainingTime()`: Calculates time until estimated delivery
- Status filtering and search

### 7.2 Seller Orders Page

**File**: `Frontend/src/app/(userdashboard)/marketplace/orders/seller/page.tsx`

**Features**:
- Order list for seller's services/products
- Status filtering
- Delivery modal
- Revision response interface
- Order statistics

### 7.3 Order Status Timeline

**File**: `Frontend/src/components/Marketplace/OrderStatusTimeline.tsx`

**Features**:
- Visual timeline with status dots
- Color-coded status indicators
- Timestamp display
- Notes display
- Special handling for cancelled orders

**Status Flow Display**:
```
[Pending] → [Confirmed] → [Processing] → [Completed]
   ✓           ✓             ● (current)      ○
```

### 7.4 Delivery Modal

**File**: `Frontend/src/components/Marketplace/DeliveryModal.tsx`

**Features**:
- File upload (multiple files)
- Delivery message input
- Upload progress indicator
- File preview
- File removal

**API Call**:
```typescript
POST /marketplace/orders/:orderId/deliver
Content-Type: multipart/form-data
Body: {
  deliveryMessage: string,
  deliveryFiles: File[]
}
```

---

## 8. Backend APIs

### 8.1 Order Endpoints

**Base Route**: `/api/v1/marketplace/orders`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/create` | Create new order | Buyer |
| GET | `/buyer` | Get buyer's orders | Buyer |
| GET | `/seller` | Get seller's orders | Seller |
| GET | `/:orderId` | Get order details | Buyer/Seller |
| PUT | `/:orderId/status` | Update order status | Buyer/Seller |
| POST | `/:orderId/deliver` | Deliver order (files) | Seller |
| GET | `/:orderId/files` | Get delivery files | Buyer |
| GET | `/:orderId/files/:fileId/download` | Download file | Buyer |
| POST | `/:orderId/revision` | Request revision | Buyer |
| POST | `/:orderId/revision/respond` | Respond to revision | Seller |
| POST | `/:orderId/accept` | Accept delivery | Buyer |
| DELETE | `/:orderId/cancel` | Cancel order | Buyer |
| GET | `/purchased` | Get purchased items | Buyer |
| GET | `/statistics` | Get order statistics | Buyer/Seller |

### 8.2 Offer Endpoints

**Base Route**: `/api/v1/marketplace/offers`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/create` | Create custom offer | Seller |
| POST | `/:offerId/accept` | Accept offer → Create order | Buyer |
| POST | `/:offerId/reject` | Reject offer | Buyer |
| POST | `/:offerId/cancel` | Cancel offer | Seller |
| GET | `/conversation/:conversationId` | Get conversation offers | Buyer/Seller |
| GET | `/sent` | Get sent offers | Seller |
| GET | `/received` | Get received offers | Buyer |

---

## 9. Data Models

### 9.1 MarketplaceOrder Model

**File**: `Backend/models/marketplace/MarketplaceOrder.model.ts`

**Key Fields**:
```typescript
{
  orderNumber: string (unique),
  buyerId: ObjectId (ref: User),
  sellerId: ObjectId (ref: MarketplaceSeller),
  offerId?: ObjectId (ref: MarketplaceOffer),
  items: [{
    itemId: ObjectId,
    itemType: 'product' | 'service',
    itemTitle: string,
    itemPrice: number,
    quantity: number,
    totalPrice: number,
    packageDetails?: {  // For services
      packageName: string,
      features: string[],
      deliveryTime: string,
      revisions: number
    },
    fileDetails?: {  // For products
      fileName: string,
      fileSize: string,
      fileFormat: string,
      downloadCount: number,
      maxDownloads: number
    }
  }],
  orderTotal: number,
  currency: string (default: '0XM'),
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled',
  paymentMethod?: string,
  paymentDetails?: {
    amount: number,
    fees: number,
    netAmount: number,
    transactionSignature?: string,  // For blockchain payments
    sellerAmount?: number,
    adminAmount?: number
  },
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'delivered' | 
               'revision_requested' | 'completed' | 'cancelled' | 'refunded',
  deliveryDate?: Date,
  deliveryMessage?: string,
  deliveryFiles?: [{
    filename: string,
    originalName: string,
    fileUrl: string,
    fileSize: number,
    mimeType: string,
    uploadedAt: Date
  }],
  estimatedDeliveryDate?: Date,
  startedAt?: Date,
  completedAt?: Date,
  revisionRequest?: {
    requestedAt: Date,
    requestedBy: ObjectId,
    revisionReason: string,
    revisionDetails: string,
    requestedChanges: string[],
    status: 'pending' | 'in_progress' | 'completed' | 'rejected',
    respondedAt?: Date,
    responseMessage?: string,
    revisionFiles?: [{...}]  // Same structure as deliveryFiles
  },
  revisionCount: number (default: 0),
  maxRevisions: number (default: 3),
  statusHistory?: [{
    status: string,
    timestamp: Date,
    note?: string
  }],
  isActive: boolean (default: true)
}
```

### 9.2 MarketplaceOffer Model

**Key Fields**:
```typescript
{
  conversationId: ObjectId,
  sellerId: ObjectId (ref: User),
  buyerId: ObjectId (ref: User),
  serviceId?: ObjectId,
  productId?: ObjectId,
  offerTitle: string,
  offerDescription: string,
  deliverables: string[],
  price: number,
  deliveryTime: string,
  revisions: number,
  additionalTerms?: string,
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired',
  expiresAt: Date,
  acceptedAt?: Date,
  rejectedAt?: Date,
  cancelledAt?: Date
}
```

---

## 10. Key Differences: Services vs Products

### 10.1 Payment Processing

| Feature | Products | Services |
|---------|----------|----------|
| **Payment at Order Creation** | ✅ Required (blockchain) | ❌ Not required |
| **Payment Method** | `mintyn` (0XM) | `pending` |
| **Transaction Signature** | ✅ Stored | ❌ Not stored |
| **Fee Split** | ✅ 5% admin, 95% seller | ❌ Not calculated |
| **Payment Release** | Immediate | On delivery acceptance |

### 10.2 Order Status Flow

**Products**:
```
Order Created → paymentStatus: 'completed' → orderStatus: 'completed'
(Instant access, no delivery needed)
```

**Services**:
```
Order Created → paymentStatus: 'pending' → orderStatus: 'processing' 
→ Seller Delivers → orderStatus: 'delivered' 
→ Buyer Accepts → paymentStatus: 'completed' → orderStatus: 'completed'
```

### 10.3 Delivery Requirements

**Products**:
- No delivery needed
- Instant access to files
- Download tracking

**Services**:
- Delivery required
- File uploads by seller
- Revision requests possible
- Delivery acceptance by buyer

### 10.4 Order Items Structure

**Products**:
```typescript
items: [{
  fileDetails: {
    fileName: string,
    fileSize: string,
    fileFormat: string,
    downloadCount: number,
    maxDownloads: number
  }
}]
```

**Services**:
```typescript
items: [{
  packageDetails: {
    packageName: string,
    features: string[],
    deliveryTime: string,
    revisions: number
  }
}]
```

---

## 🔴 Critical Issues & Recommendations

### Issue 1: No Payment Processing for Services
**Problem**: Services are created with `paymentStatus: 'pending'` and payment is never actually processed. Payment is marked as 'completed' when delivery is accepted, but no actual blockchain transaction occurs.

**Impact**: 
- Sellers don't receive payment
- Platform doesn't collect fees
- No transaction record

**Recommendation**: 
- Integrate blockchain payment similar to products
- Process payment when order is created OR when delivery is accepted
- Store transaction signature
- Implement fee split (5% admin, 95% seller)

### Issue 2: Payment Status Inconsistency
**Problem**: Payment is marked as 'completed' without actual payment processing.

**Recommendation**: 
- Add actual payment processing before marking as completed
- Or change payment flow to process payment on delivery acceptance

### Issue 3: No Escrow System
**Problem**: No funds are held in escrow during service delivery period.

**Recommendation**: 
- Implement escrow system
- Hold funds until delivery is accepted
- Release funds to seller on acceptance
- Refund to buyer if order is cancelled

### Issue 4: Missing Payment Integration in PurchaseModal
**Problem**: `PurchaseModal.tsx` shows error for service purchases instead of processing payment.

**Recommendation**: 
- Implement service purchase flow similar to products
- Add blockchain payment integration
- Update UI to support service purchases

---

## 📊 Statistics & Tracking

### Order Statistics API
**Endpoint**: `GET /marketplace/orders/statistics`

**Returns**:
```typescript
{
  buyer: {
    totalOrders: number,
    totalSpent: number,
    completedOrders: number
  },
  seller: {
    totalOrders: number,
    totalEarnings: number,
    completedOrders: number
  },
  period: '7d' | '30d' | '90d' | '1y'
}
```

### Seller Stats Updates
**Location**: `updateSellerStatsAfterOrder()` (lines 14-64)

**Updates**:
- `MarketplaceSeller.totalEarnings`: Incremented by orderTotal
- `MarketplaceSeller.totalSales`: Incremented by 1
- `MarketplaceService.orderCount`: Incremented
- `MarketplaceService.inQueueCount`: Incremented (for services)

---

## 🔄 Complete Service Order Lifecycle

```
1. Buyer initiates conversation
   ↓
2. Seller creates custom offer
   ↓
3. Buyer accepts offer
   ↓
4. Order created (paymentStatus: 'pending', orderStatus: 'processing')
   ↓
5. Seller works on service
   ↓
6. Seller delivers (uploads files, adds message)
   ↓
7. Order status: 'delivered'
   ↓
8a. Buyer accepts → Order status: 'completed', paymentStatus: 'completed'
   OR
8b. Buyer requests revision → Order status: 'revision_requested'
      ↓
   9. Seller responds (accept/reject)
      ↓
   10a. Accept → Re-deliver → Order status: 'delivered'
   10b. Reject → Order status: 'revision_requested' (buyer can request again)
      ↓
   11. Buyer accepts → Order status: 'completed', paymentStatus: 'completed'
```

---

## 📝 Summary

**Service Purchase Flow**:
- Currently only via custom offer acceptance
- No direct purchase (blockchain payment not integrated)
- Order created with pending payment

**Order Tracking**:
- Comprehensive status history
- Visual timeline component
- Status transitions tracked
- Delivery and revision workflow

**Payment**:
- ⚠️ **CRITICAL**: No actual payment processing
- Payment marked as completed without transaction
- No fee split implemented
- No escrow system

**Recommendations**:
1. Integrate blockchain payment for services
2. Implement escrow system
3. Add payment processing on order creation or delivery acceptance
4. Store transaction signatures
5. Implement fee split (5% admin, 95% seller)
6. Update PurchaseModal to support service purchases

