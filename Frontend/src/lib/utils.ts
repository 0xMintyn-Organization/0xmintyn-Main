import { clsx, type ClassValue } from "clsx"
import { FaHandshakeSimple, FaLaptopCode } from "react-icons/fa6";
import { FcBearish, FcGlobe, FcSalesPerformance } from "react-icons/fc";
import { IoRocket } from "react-icons/io5";
import { twMerge } from "tailwind-merge"
import { ActiveProposalsDetailType, CardDetailsType, ClaimHistoryItem, CommFeedDetailType, CommunityContribution, EduCardDetailsType, OpenOrdersType, OrderBookType, PopularCategoriesType, ProposalCardType, ProposalsSnapshotType, SellerType, SkillDetailType, SocialAccount, StakingInfo, SwapRateType, TradeHistoryType, UBIBalance, UBIDistributionData, User } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dashboard page
export const topSellersDetails: SellerType[] = [
  {name: 'CryptoArtistic123', rate: '1,234'},
  {name: 'DigitalGuru', rate: '987'},
  {name: 'BlockchainDev', rate: '765'},
]

export const popularCategoriesDetails: PopularCategoriesType[] = [
  {category: 'Digital Art', percentage: 45},
  {category: 'E-Books', percentage: 30},
  {category: 'Virtual Real Estate', percentage: 25},
]

export const swapRate: SwapRateType[] = [
  {currency: 'EQM/USD', swapRate: '$1.05', marginPercentage: '+2.94%'},
  {currency: 'EQM/ETH', swapRate: '0.00042', marginPercentage: '-0.71%'},
  {currency: 'EQM/BTC', swapRate: '0.000025', marginPercentage: '+1.63%'},
]

export const commFeedDetail: CommFeedDetailType[] = [
  {proImage: '/assets/images/dashboard/profile_images/user_1.jpg', description: `Alice just listed a new digital artwork: 'Neon Dreams'`},
  {proImage: '/assets/images/dashboard/profile_images/user_2.jpg', description: `Bob completed a new course: 'Blockchain Fundamentals'`},
  {proImage: '/assets/images/dashboard/profile_images/user_3.jpg', description: `Charlie completed a P2P transaction worth 1000 EQM`},
]

// Marketplace page

export const cardDetails: CardDetailsType[] = [
  {
      imagePath: '/assets/images/marketplace/category_card/digital_art.jpg',
      imageAltText: 'Digital Art',
      proileImage: '/assets/images/marketplace/category_card/digital_art.jpg',
      profileName: 'ArtisticVisions',
      title: 'Cosmic Dreamscape Digital Art',
      price: 150,
      description: 'A mesmerizing digital artwork depicting an therwordly landscape.',
  },
  {
      imagePath: '/assets/images/marketplace/category_card/wooden_puzle.jpg',
      imageAltText: 'Crafty Creations',
      proileImage: '/assets/images/marketplace/category_card/wooden_puzle.jpg',
      profileName: 'Crafty Creations',
      title: 'Handcrafted Wooden Puzzle',
      price: 75,
      description: 'Intricate wooden puzzle, handmade with sustainable materials.',
  },
  {
      imagePath: '/assets/images/marketplace/category_card/web_consultation.jpg',
      imageAltText: 'Tech Guru Web Consultation',
      proileImage: '/assets/images/marketplace/category_card/web_consultation.jpg',
      profileName: 'TechGuru',
      title: 'Web Development Consultation',
      price: 100,
      description: '1-hour consultation on web development best practices and strategies.',
  },
  {
      imagePath: '/assets/images/marketplace/category_card/crypto.jpg',
      imageAltText: 'Crypto Master',
      proileImage: '/assets/images/marketplace/category_card/crypto.jpg',
      profileName: 'CryptoMaster',
      title: 'Cryptocurrency Trading E-Book',
      price: 25,
      description: 'Comprehensive guide to cryptocurrency trading for beginners.',
  },
  {
      imagePath: '/assets/images/marketplace/category_card/graphic_design.jpg',
      imageAltText: 'Graphic Design Image',
      proileImage: '/assets/images/marketplace/category_card/graphic_design.jpg',
      profileName: 'DesignPro',
      title: 'Graphic Design Masterclass',
      price: 200,
      description: '1-hour online course covering all aspects of modern graphic design.',
  },
  {
      imagePath: '/assets/images/marketplace/category_card/portraitAI.jpg',
      imageAltText: 'Portrait Image',
      proileImage: '/assets/images/marketplace/category_card/portraitAI.jpg',
      profileName: 'Portrait Master',
      title: 'Custom Portrait Commission',
      price: 150,
      description: 'Personalized digital portrait based on your photo.',
  },
]

// Education Hub page

export const eduCardDetails: EduCardDetailsType[] = [
  {
      imagePath: '/assets/images/marketplace/category_card/digital_art.jpg',
      imageAltText: 'Digital Art',
      title: 'Blockchain Fundamentals',
      description: 'Learn the basics of blockchain technology, cryptocurrencies, and decentralized systems.',
      buttonName: "Enroll Now",
  },
  {
      imagePath: '/assets/images/marketplace/category_card/wooden_puzle.jpg',
      imageAltText: 'Crafty Creations',
      title: 'Financial Literacy Workshop',
      description: 'Gain essential knowledge about personal finance, budgeting, and investment strategies.',
      buttonName: "Join Workshop",
  },
  {
      imagePath: '/assets/images/marketplace/category_card/web_consultation.jpg',
      imageAltText: 'Tech Guru Web Consultation',
      title: 'Coding Bootcamp',
      description: 'Dive into web development with this intensive coding program. Learn HTML, CSS, and JavaScript.',
      buttonName: "Start Coding",
  },
  {
      imagePath: '/assets/images/marketplace/category_card/crypto.jpg',
      imageAltText: 'Crypto Master',
      title: 'Entrepreneurship Masterclass',
      description: 'Discover the essentials of starting and running a successful business in the digital age.',
      buttonName: "Attend Masterclass",
  },
]

export const skillDetail: SkillDetailType[] = [
  {icon: FaLaptopCode, name: 'Blockchain'},
  {icon: FcSalesPerformance, name: 'Finance'},
  {icon: IoRocket, name: 'Entrepreneurship'},
  {icon: FcGlobe, name: 'Web Development'},
  {icon: FcBearish, name: 'Data Analysis'},
  {icon: FaHandshakeSimple, name: 'Leadership'},
  
]

// DAP Page

export const activeProposalsDetail: ActiveProposalsDetailType[] = [
  {
    title: 'Increase Block Size',
    description: 'Proposal to increase the block size from 1MB to 2MB to improve transaction throughput.',
    favor: 65,
    days: 2 
  },
  {
    title: 'Implement Token Burning Mechanism', 
    description: 'Proposal to implement a token burning mechanism to control inflation and increase token value.', 
    favor: 48, 
    days: 5 },
]

export const proposalsSnapshot: ProposalsSnapshotType[] = [
  {propsalSate: "Total Proposals", states: 124},
  {propsalSate: "Active Proposals", states: 7},
  {propsalSate: "Quorum", states: "65%"},
  {propsalSate: "Your Voting Power", states: "1.5%"},
]

export const proposalCard: ProposalCardType[] = [
  {
      title: "Increase Staking Rewards", 
      proStatus: "active", 
      description: "Proposal to increase staking rewards from 5% to 7% APY to incentivize long-term holding.",
      yesVal: 2500,
      noVal: 1200,
  },
  {
      title: "Implement Burning Mechanism", 
      proStatus: "active", 
      description: "Introduce a token burning mechanism to reduce total supply and potentially increase token value.",
      yesVal: 3000,
      noVal: 900,
  },
  {
      title: "Partnership with DeFi Platform", 
      proStatus: "active", 
      description: "Establish a strategic partnership with a leading DeFi platform to expland Equalmint ecosystem.",
      yesVal: 4200,
      noVal: 800,
  },
  {
      title: "Reduce Transaction Fees", 
      proStatus: "closed", 
      description: "Proposal to reduce transaction fees by 20% to encourage more frequent use of the platform.",
      yesVal: 5500,
      noVal: 2300,
  },
  {
      title: "Launch Community Grant Program", 
      proStatus: "active", 
      description: "Create a community grant program to fund innovative projects built on the Equalmint platform.",
      yesVal: 3800,
      noVal: 1100,
  },
]

// Exchange Page
export const orderBook: OrderBookType[] = [
  {priceUSD: 1.10, amountEQM: 54.80},
  {priceUSD: 1.09, amountEQM: 119.26,},
  {priceUSD: 1.08, amountEQM: 74.91,},
  {priceUSD: 1.07, amountEQM: 127.56,},
  {priceUSD: 1.06, amountEQM: 61.04,},
  {priceUSD: 1.06, amountEQM: 67.70, },
  {priceUSD: 1.04, amountEQM: 114.16, },
  {priceUSD: 1.03, amountEQM: 67.21, },
  {priceUSD: 1.02, amountEQM: 63.49, },
  {priceUSD: 1.01, amountEQM: 116.16, },
]

export const openOrders: OpenOrdersType[] = [
  {
    date: '7/27/2024 09: 08:08 AM',
    pair: 'EQM/USD',
    type: 'Stop',
    side: 'Sell',
    price: 1.08,
    amount: 96.29,
    xValue: 86.16,
    action: "Cancel",
  },
  {
    date: '7/27/2024 09: 08:08 AM',
    pair: 'EQM/USD',
    type: 'Stop',
    side: 'Sell',
    price: 1.00,
    amount: 96.29,
    xValue: 14.47,
    action: "Cancel",
  },
  {
    date: '7/27/2024 09: 08:08 AM',
    pair: 'EQM/USD',
    type: 'Limit',
    side: 'Buy',
    price: 1.00,
    amount: 96.29,
    xValue: 49.21,
    action: "Cancel",
  },
  {
    date: '7/27/2024 09: 08:08 AM',
    pair: 'EQM/USD',
    type: 'Limit',
    side: 'Sell',
    price: 1.06,
    amount: 96.29,
    xValue: 34.29,
    action: "Cancel",
  },
  {
    date: '7/27/2024 09: 08:08 AM',
    pair: 'EQM/USD',
    type: 'Stop',
    side: 'Sell',
    price: 1.01,
    amount: 96.29,
    xValue: 86.10,
    action: "Cancel",
  },
]

export const tradeHistory: TradeHistoryType[] = [
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Buy',
    price: 1.00,
    amount: 52.95,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Buy',
    price: 1.09,
    amount: 146.38,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Buy',
    price: 1.03,
    amount: 100.69,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Buy',
    price: 1.03,
    amount: 88.71,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Buy',
    price: 1.03,
    amount: 145.77,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Sell',
    price: 1.08,
    amount: 63.38,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Buy',
    price: 1.05,
    amount: 12.13,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Buy',
    price: 1.06,
    amount: 64.27,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Buy',
    price: 1.01,
    amount: 18.54,
  },
  {
    date: '7/27/2024, 9:01;08 AM',
    pair: 'EQM/USD',
    side: 'Sell',
    price: 1.00,
    amount: 145.60,
  },
]

// My Profile Page - Profile Information
export const userData: User = {
  id: "121",
  username: "johndoe",
  profilePicture: "/assets/images/myprofile/profile.jpg",
  bannerImage: "/assets/images/myprofile/banner.jpg",
  personalDetails: {
    name: "John Doe",
    email: "john@email.com",
    country: "Germany",
    dateOfBirth: '12-12-2012',
  },
  referralCode: '001',
  referralStats: {
    totalReferrals: 7,
    pendingRewards: 45,
    totalEarned: 53,
  }
}

// My Profile Page - UBI & Financials
export const ubiBalance: UBIBalance = {
  currentBalance: 1000,
  lifetimeEarnings: 2500,
  pendingClaims: 200,
}

export const claimHistory: ClaimHistoryItem[] = [
  {
    id: 'u001',
    date: '07 Jan 2025',
    amount: 200,
    status: "Claimed",
    transactionHash: "0x123abc456def789ghi",
  },
  {
    id: 'u002',
    date: '15 Jan 2025',
    amount: 150,
    status: "Pending",
    transactionHash: "0x987zyx654wvu321tsr",
  },
  {
    id: 'u003',
    date: '22 Jan 2025',
    amount: 300,
    status: "Expired",
    transactionHash: "0x456mno789pqr123stu",
  },
  {
    id: 'u004',
    date: '28 Jan 2025',
    amount: 500,
    status: "Claimed",
    transactionHash: "0xabc123def456ghi789",
  }
]

export const stakingInfo: StakingInfo = {
  totalStaked: 150,
  currentYield: 7,
  annualPercentageYield: 3,
  pendingRewards: 40,
}

export const ubiDistributionData: UBIDistributionData = {
  monthlyAllocations: [
    { month: "January 2025", allocation: 500, claimed: 450 },
    { month: "February 2025", allocation: 600, claimed: 500 },
    { month: "March 2025", allocation: 550, claimed: 300 }
  ],
  upcomingAllocations: [
    { date: "April 1, 2025", expectedAmount: 600 },
    { date: "May 1, 2025", expectedAmount: 650 }
  ]
};

// My Profile Page - Social & Community
export const mockSocialAccounts: SocialAccount[] = [
  {
    platform: 'Twitter',
    username: 'user_example',
    profileUrl: 'https://twitter.com/user_example',
    isVerified: true,
    iconName: 'twitter'
  },
  {
    platform: 'Discord',
    username: 'user#1234',
    profileUrl: 'https://discord.com',
    isVerified: true,
    iconName: 'discord'
  },
  {
    platform: 'Telegram',
    username: 'user_tg',
    profileUrl: 'https://t.me/user_tg',
    isVerified: false,
    iconName: 'telegram'
  },
  {
    platform: 'Lens',
    username: 'user.lens',
    profileUrl: 'https://lens.xyz/user.lens',
    isVerified: true,
    iconName: 'lens'
  },
  {
    platform: 'Farcaster',
    username: 'user.far',
    profileUrl: 'https://farcaster.xyz/user.far',
    isVerified: false,
    iconName: 'farcaster'
  }
];

export const mockContributions: CommunityContribution[] = [
  {
    id: '1',
    type: 'Post',
    content: 'Just completed my first successful UBI claim! The process was smooth and the team was very helpful. #UBI #CryptoForGood',
    date: '2025-03-05T14:30:00Z',
    likes: 24,
    comments: 5,
    shares: 3,
    platform: 'Twitter'
  },
  {
    id: '2',
    type: 'Comment',
    content: "I've been staking for about 3 months now and the returns have been really consistent. Highly recommend!",
    date: '2025-03-03T10:15:00Z',
    likes: 12,
    comments: 2,
    shares: 0,
    platform: 'Discord'
  },
  {
    id: '3',
    type: 'Post',
    content: 'Excited to join this community! Looking forward to learning more about UBI distribution and how I can contribute.',
    date: '2025-03-01T18:45:00Z',
    likes: 35,
    comments: 8,
    shares: 5,
    platform: 'Lens'
  },
  {
    id: '4',
    type: 'Share',
    content: 'Check out this awesome guide on maximizing your UBI benefits! 🚀',
    date: '2025-02-28T09:20:00Z',
    likes: 18,
    comments: 3,
    shares: 7,
    platform: 'Farcaster'
  },
  {
    id: '5',
    type: 'Post',
    content: 'Just published my research on UBI distribution models. Would love to get feedback from the community!',
    date: '2025-02-25T16:10:00Z',
    likes: 42,
    comments: 15,
    shares: 10,
    platform: 'Internal'
  }
];

