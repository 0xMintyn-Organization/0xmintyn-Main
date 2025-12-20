# Exchange P2P Messenger (Order-Based) — Backend Spec

This document describes the backend APIs + data model needed to support **Exchange P2P order-based messaging**, modeled after the existing marketplace messenger (`marketplace/messages/*`) but with one critical change:

> **Roles are determined per order** (buyer/seller), not by global user role (`user.role`, `isSeller`, etc).

---

## Goals

- **Conversation key** = `p2pOrderId` (NOT “user A ↔ user B”).
- Support Binance-like P2P order chat:
  - buyer and seller can message inside the order
  - attachments (optional)
  - unread count
  - mark-read
  - pagination
- Backend must enforce authorization:
  - only **buyer** or **seller** of that order can read/write the order chat

---

## Recommended Data Model

### 1) `ExchangeP2POrder` (existing/new)

Minimum fields needed for messenger:

- `buyerId: ObjectId(User)`
- `sellerId: ObjectId(User)`
- `asset: string` (e.g. `OXM`)
- `fiat: string` (e.g. `PKR`, `USD`)
- `price: number`
- `amount: number`
- `paymentMethod: string` (e.g. `Easypaisa`, `JazzCash`, `Bank`)
- `status: 'created'|'accepted'|'paid'|'released'|'cancelled'|'disputed'|'expired'`
- `paymentWindowMinutes: number`
- timestamps

**Role derivation**

For any `order` and `currentUserId`:

- if `order.buyerId == currentUserId` → role = `buyer`
- else if `order.sellerId == currentUserId` → role = `seller`
- else → forbidden

### 2) `ExchangeP2PMessage` (new)

Fields:

- `p2pOrderId: ObjectId(ExchangeP2POrder)` **(required)**
- `senderId: ObjectId(User)` **(required)**
- `receiverId: ObjectId(User)` **(required)** (computed from order buyer/seller)
- `message: string` (max 2000)
- `attachments: [{ filename, originalName, fileUrl, fileSize, mimeType, uploadedAt }]`
- `isRead: boolean` (default false)
- `readAt?: Date`
- soft delete flags (optional): `senderDeleted`, `receiverDeleted`
- timestamps

Indexes:

- `{ p2pOrderId: 1, createdAt: -1 }`
- `{ receiverId: 1, isRead: 1, createdAt: -1 }`

---

## API Design (suggested)

All routes require:

- `updateAccessTokenMiddleware`
- `isAthenticated`

Base path:

- `/api/v1/exchange/messages`

### 1) Send message inside an order

**POST** `/api/v1/exchange/messages/send`

Content-Type: `multipart/form-data` (like marketplace messages)

Body:

- `p2pOrderId` (string)
- `message` (string, optional if attachments exist)
- `attachments[]` (files, up to 5)

Rules:

- Validate `p2pOrderId` exists
- Verify sender is either buyer or seller of that order
- Compute `receiverId` as the other party (buyer ↔ seller)
- Store message, attachments
- Return populated sender/receiver + order summary

### 2) Get messages for a specific order (thread)

**GET** `/api/v1/exchange/messages/order/:p2pOrderId?page=1&limit=50`

Rules:

- Only buyer/seller can access
- Return messages sorted ascending (client can reverse)

### 3) List “conversations” (orders with last message + unread)

**GET** `/api/v1/exchange/messages/conversations?page=1&limit=20&status=active`

Return shape:

- `conversations: [{ p2pOrderId, counterpartyUser, role, orderSummary, lastMessage, unreadCount }]`
- pagination

Implementation idea:

- query all orders where `buyerId == me OR sellerId == me`
- for each order fetch last message + unread count (or aggregate pipeline)

### 4) Unread count (total)

**GET** `/api/v1/exchange/messages/unread-count`

Rules:

- Count messages where `receiverId == me` and `isRead == false` and message belongs to orders I’m part of

### 5) Mark message as read

**PATCH** `/api/v1/exchange/messages/:messageId/read`

Rules:

- Only receiver can mark read

### 6) Delete message (soft)

**DELETE** `/api/v1/exchange/messages/:messageId`

Same pattern as marketplace:

- mark `senderDeleted` or `receiverDeleted`
- hard delete if both deleted (optional)

---

## Frontend Expectations

Frontend will open messenger via:

- `/exchange/messages?order=<p2pOrderId>`

Backend must support:

- fetching the order chat thread
- returning role per order (buyer/seller) so UI can show correct actions

---

## Realtime (optional, later)

If you want Binance-like “instant” feel:

- use Socket.IO namespace `exchange:p2p`
- events:
  - `p2p:message:new` (room = `order:<p2pOrderId>`)
  - `p2p:order:updated` (paid/released/disputed)

---

## Security Notes (important)

- Never decide permissions based on global `user.role` or `isSeller` for exchange chat.
- Permissions must be derived from the **order** relationship.
- Validate uploads: max size per file (e.g. 10MB), whitelist mime types.
- Add rate limits per order (anti-spam).


