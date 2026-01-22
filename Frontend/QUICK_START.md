# Quick Start Guide

Get the UBI Platform up and running in 5 minutes!

## 🚀 For Regular Users

### Step 1: Install Dependencies

```bash
cd 0xmintyn-Main/Frontend
npm install
```

### Step 2: Set Up Environment

```bash
# Copy the example environment file
cp env.local.example .env.local

# Edit .env.local with your settings
# Minimum required:
# NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 3: Run the App

```bash
npm run dev
```

### Step 4: Open Browser

Navigate to: **http://localhost:3000**

That's it! 🎉

---

## 👨‍💼 For Administrators

### Additional Setup

1. **Ensure wallet is configured:**
   ```bash
   # In WSL/Linux
   ls ~/.config/solana/my-mintyn-wallet.json
   ```

2. **Check treasury status:**
   ```bash
   npm run admin:check-treasury
   ```

3. **If treasury needs funding:**
   ```bash
   npm run admin:fund-treasury:1m
   ```

### First Time Setup

If this is the first time running the platform:

1. **Initialize UBI Program:**
   ```bash
   npm run admin:initialize
   ```

2. **Fund Treasury:**
   ```bash
   npm run admin:fund-treasury:1m
   ```

3. **Verify:**
   ```bash
   npm run admin:check-treasury
   ```

---

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for admin operations
- Review [UBI_INTEGRATION_SUMMARY.md](./UBI_INTEGRATION_SUMMARY.md) for smart contract details

---

## ❓ Need Help?

- **Can't start the app?** Check Node.js version: `node --version` (needs 18+)
- **Port 3000 in use?** Kill the process or use a different port
- **Module errors?** Run `npm install` again
- **Admin issues?** See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)

---

**Happy coding! 🚀**

