# P2P Trade Component Documentation

## Overview

The P2P Trade component is a Binance-style peer-to-peer trading interface integrated into the sidebar. It allows users to buy and sell multiple crypto assets (USDT, BTC, ETH, etc.) directly with other users.

## Component Structure

```
P2PTrade (Main Component)
├── P2PTradeSidebar (Sidebar Wrapper)
├── OfferCard (Individual Offer Display)
└── TradeModal (Trade Confirmation Dialog)
```

## Files

1. **`P2PTrade.tsx`** - Main component with Buy/Sell tabs, search, filter, and offer listing
2. **`OfferCard.tsx`** - Individual offer card component
3. **`TradeModal.tsx`** - Trade confirmation modal with validation
4. **`P2PTradeSidebar.tsx`** - Sidebar integration wrapper

## Features

### ✅ Implemented

- **Buy/Sell Tabs**: Seamless switching between buying and selling supported assets
- **Market Listings**: Display of available P2P offers with trader information
- **Search & Filter**: Search by trader name or payment method
- **Sorting**: Sort by price, rating, or number of trades (ascending/descending)
- **Real-time Calculations**: Price calculations, trade limits, balance checks
- **Trade Confirmation**: Modal with validation and payment method selection
- **Responsive Design**: Optimized for sidebar with compact layout
- **Dark Mode Support**: Full dark mode compatibility
- **Loading States**: Processing indicators during trade execution
- **Error Handling**: Comprehensive validation and error messages

### 🎨 UI/UX Features

- **Binance-inspired Design**: Clean, professional interface
- **Smooth Animations**: Transitions for modals, buttons, and hover effects
- **Color Coding**: Green for buy, red for sell
- **Trader Verification**: Visual indicators for verified traders
- **Online Status**: Real-time online/offline indicators
- **Payment Method Badges**: Quick view of accepted payment methods
- **Balance Display**: Compact balance overview (selected asset + USD/USDT)

## Mock Data Structure

### P2POffer Interface

```typescript
interface P2POffer {
  id: string;
  traderName: string;
  traderAvatar?: string;
  traderRating: number;
  completedTrades: number;
  completionRate: number;
  price: number;
  available: number; // Available amount in selected asset
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  side: 'buy' | 'sell';
  timeLimit: number; // Minutes
  isVerified: boolean;
  isOnline: boolean;
  asset: string;
}
```

### UserBalance Interface

```typescript
type UserBalance = Record<string, number>;
```

## State Management

The component uses React Hooks for local state management:

- `useState` for component state (tabs, search, filters, selected offer)
- `useMemo` for filtered and sorted offers (performance optimization)
- `useEffect` for modal state reset

## API Integration (Future)

### Replace Mock Data

**Current Location**: `P2PTrade.tsx` lines 20-120

**Replace with**:
```typescript
// Replace mockBuyOffers and mockSellOffers with API calls
const { data: buyOffers } = useGetP2PBuyOffersQuery();
const { data: sellOffers } = useGetP2PSellOffersQuery();
```

### API Endpoints Needed

1. **GET** `/api/v1/p2p/offers/buy` - Get buy offers
2. **GET** `/api/v1/p2p/offers/sell` - Get sell offers
3. **GET** `/api/v1/p2p/balance` - Get user balance
4. **POST** `/api/v1/p2p/trade` - Execute trade
5. **GET** `/api/v1/p2p/offers/search` - Search offers

### Trade Execution

**Current Location**: `P2PTrade.tsx` `handleTradeConfirm` function (line 150)

**Replace with**:
```typescript
const handleTradeConfirm = async (amount: number) => {
  // Replace mock API call with:
  const response = await createP2PTrade({
    offerId: selectedOffer.id,
    amount,
    side: activeTab,
    paymentMethod: selectedPaymentMethod,
  });
  
  // Handle response
  if (response.success) {
    toast.success('Trade executed successfully!');
    // Refresh offers and balance
    refetchOffers();
    refetchBalance();
  }
};
```

## Component Props

### P2PTrade
No props - self-contained component

### OfferCard
```typescript
interface OfferCardProps {
  offer: P2POffer;
  onTradeClick: () => void;
}
```

### TradeModal
```typescript
interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: P2POffer;
  side: 'buy' | 'sell';
  userBalance: UserBalance;
  onConfirm: (amount: number) => Promise<void>;
  isProcessing: boolean;
}
```

## Validation Rules

### Amount Validation
- Must be greater than 0
- Must be within offer's min/max limits
- Must not exceed available offer amount
- Must not exceed user's balance

### Payment Method
- Must select a payment method from offer's accepted methods

## Styling

### Color Scheme
- **Buy**: Green gradient (`from-green-600 to-emerald-600`)
- **Sell**: Red gradient (`from-red-600 to-rose-600`)
- **Neutral**: Gray/Zinc for backgrounds

### Responsive Breakpoints
- **Sidebar**: Optimized for 288px width (w-72)
- **Mobile**: Component adapts to smaller screens
- **Tablet**: Maintains sidebar layout

## Performance Optimizations

1. **Memoized Filtering**: `useMemo` for filtered/sorted offers
2. **Lazy Loading**: Offers loaded on demand
3. **Virtual Scrolling**: Consider for large offer lists (future enhancement)

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper labels for screen readers
- **Focus Management**: Proper focus handling in modals
- **Color Contrast**: WCAG AA compliant

## Testing Checklist

- [ ] Buy/Sell tab switching
- [ ] Search functionality
- [ ] Sort by price/rating/trades
- [ ] Sort order toggle
- [ ] Offer card click opens modal
- [ ] Amount validation
- [ ] Payment method selection
- [ ] Balance validation
- [ ] Trade confirmation
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Dark mode

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live offer updates
2. **Advanced Filters**: Filter by payment method, verification status
3. **Trade History**: View past trades
4. **Favorites**: Save favorite traders
5. **Notifications**: Trade status notifications
6. **Multi-currency**: Support for more currencies
7. **Escrow System**: Secure trade escrow
8. **Dispute Resolution**: Trade dispute handling

## Integration Notes

The component is integrated into the sidebar via `P2PTradeSidebar.tsx` and added to `SidebarContent.tsx`. It appears as a collapsible section at the bottom of the sidebar navigation.

## Dependencies

- `@/components/ui/*` - shadcn/ui components
- `lucide-react` - Icons
- `sonner` - Toast notifications
- React Hooks (useState, useEffect, useMemo)

---

**Last Updated**: 2024
**Version**: 1.0.0

