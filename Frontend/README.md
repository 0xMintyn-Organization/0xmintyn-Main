# UBI Platform - Frontend

A comprehensive Universal Basic Income (UBI) platform built with Next.js, React, and Solana blockchain integration.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Phantom Wallet** (for Solana interactions)

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd 0xmintyn-Main/Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.local.example .env.local
   ```
   
   Then edit `.env.local` with your configuration:
   - Backend API URL
   - Solana RPC endpoint
   - Other required environment variables

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

### For Regular Users

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build the application for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run type-check` | Run TypeScript type checking |

### For Administrators

**⚠️ Admin scripts require proper wallet setup and authority access**

| Command | Description |
|---------|-------------|
| `npm run admin:check-treasury` | Check current treasury balance |
| `npm run admin:fund-treasury` | Fund treasury (interactive) |
| `npm run admin:fund-treasury:1m` | Fund treasury with 1M tokens |
| `npm run admin:fund-treasury:500k` | Fund treasury with 500K tokens |
| `npm run admin:fund-treasury:100k` | Fund treasury with 100K tokens |
| `npm run admin:initialize` | Initialize UBI program on-chain |

> **Note:** See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for detailed admin instructions.

## 🏗️ Project Structure

```
Frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (userdashboard)/   # Protected user dashboard routes
│   │   ├── (login)/           # Authentication pages
│   │   └── test-ubi/          # UBI testing page
│   ├── components/            # React components
│   │   ├── admin/             # Admin-only components
│   │   ├── ui/                # Reusable UI components
│   │   └── ...
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── redux/                 # Redux store and slices
│   ├── services/              # API services
│   └── utils/                 # Utility functions
│       ├── ubiContract.ts     # UBI smart contract utilities
│       └── treasuryManager.ts # Treasury management
├── scripts/                   # Node.js scripts
│   ├── check-treasury.js      # Check treasury balance
│   ├── auto-fund-treasury.js  # Automated treasury funding
│   └── initialize-ubi-program.ts # Initialize UBI program
├── public/                    # Static assets
│   └── idl/                   # Solana program IDL files
└── package.json
```

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000
# or
NEXT_PUBLIC_API_URL=https://localhost:8000

# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_UBI_PROGRAM_ID=8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy
NEXT_PUBLIC_MINTYN_MINT=4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## 🎯 Key Features

- **User Registration & Authentication** - Secure user accounts with role-based access
- **UBI Registration** - Register for Universal Basic Income on Solana
- **Course Marketplace** - Educational content marketplace
- **Instructor Dashboard** - Tools for course creators
- **Admin Panel** - Treasury management and platform administration
- **Wallet Integration** - Phantom wallet support for Solana transactions

## 🔧 Development

### Running in Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run start
```

### Type Checking

```bash
npm run type-check
```

## 📚 Documentation

- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Complete guide for administrators
- **[UBI_INTEGRATION_SUMMARY.md](./UBI_INTEGRATION_SUMMARY.md)** - UBI smart contract integration details
- **[FUND_TREASURY_GUIDE.md](./FUND_TREASURY_GUIDE.md)** - Treasury funding instructions

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill the process using port 3000
   # On Windows:
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Module not found errors**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors**
   ```bash
   npm run type-check
   ```

4. **Wallet connection issues**
   - Ensure Phantom wallet is installed
   - Check that you're on the correct network (Devnet)
   - Clear browser cache and reload

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues or questions:
- Check the documentation files
- Review the admin guide for admin-specific issues
- Contact the development team

---

**Built with ❤️ for the UBI Platform**
