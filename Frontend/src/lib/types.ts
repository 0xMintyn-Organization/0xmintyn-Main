import { IconType } from "react-icons";

// Dashboard Page
export interface SellerType {
  name: string;
  rate: string;
}

export interface PopularCategoriesType {
  category: string;
  percentage: number;
}

export interface SwapRateType {
  currency: string;
  swapRate: string;
  marginPercentage: string;
}

export interface CommFeedDetailType {
  proImage: string;
  description: string;
}

// Marketplace Page

export interface CardDetailsType {
  imagePath: string;
  imageAltText: string;
  proileImage: string;
  profileName: string;
  title: string;
  price: number;
  description: string;
}

// Education Hub Page

export interface EduCardDetailsType {
  imagePath: string;
  imageAltText: string;
  title: string;
  description: string;
  buttonName: string;
}

export interface SkillDetailType {
  icon: IconType;
  name: string;
}

// DAP Page
export interface ActiveProposalsDetailType {
  title: string;
  description: string;
  favor: number;
  days: number;
}

export interface ProposalsSnapshotType {
  propsalSate: string;
  states: number | string;
}

export interface ProposalCardType {
  title: string;
  proStatus: string;
  description: string;
  yesVal: number;
  noVal: number;
}

export interface OrderBookType {
  priceUSD: number;
  amountEQM: number;
}

export interface OpenOrdersType {
  date: string;
  pair: string;
  type: string;
  side: string;
  price: number;
  amount: number;
  xValue: number;
  action: string;
}

export interface TradeHistoryType {
  date: string;
  pair: string;
  side: string;
  price: number;
  amount: number;
}

// My Profile Page - Profile Information
export interface User {
  id: string;
  username: string;
  profilePicture: string;
  bannerImage: string;
  personalDetails: {
    name: string;
    email: string;
    country: string;
    bio?: string;
    dateOfBirth?: string;
  };
  referralCode: string;
  referralStats: {
    totalReferrals: number;
    pendingRewards: number;
    totalEarned: number;
  };
}

// My Profile Page - UBI & Financials
export interface UBIBalance {
  currentBalance: number;
  lifetimeEarnings: number;
  pendingClaims: number;
}

export interface ClaimHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: "Claimed" | "Pending" | "Expired";
  transactionHash?: string;
}

export interface StakingInfo {
  totalStaked: number;
  currentYield: number;
  annualPercentageYield: number;
  pendingRewards: number;
}

export interface UBIDistributionData {
  monthlyAllocations: Array<{
    month: string;
    allocation: number;
    claimed: number;
  }>;
  upcomingAllocations: Array<{
    date: string;
    expectedAmount: number;
  }>;
}

// My Profile Page - Social & Community
export interface SocialAccount {
  platform: 'Twitter' | 'Discord' | 'Telegram' | 'Lens' | 'Farcaster';
  username: string;
  profileUrl: string;
  isVerified: boolean;
  iconName: string;
}

export interface CommunityContribution {
  id: string;
  type: 'Post' | 'Comment' | 'Share' | 'Like';
  content: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
  platform: 'Twitter' | 'Discord' | 'Telegram' | 'Lens' | 'Farcaster' | 'Internal';
}
