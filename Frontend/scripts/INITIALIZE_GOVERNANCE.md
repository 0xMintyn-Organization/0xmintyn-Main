# Initialize Governance Program

## Method 1: Using Anchor CLI (Recommended)

The simplest way to initialize the governance program is using Anchor's CLI from the contract directory:

```bash
cd 0xmintyn_Blockchain_Development/Smart_Contract/governance
anchor run initialize
```

This uses Anchor's generated types and avoids IDL issues.

## Method 2: Using the Test File

You can also run the initialization test:

```bash
cd 0xmintyn_Blockchain_Development/Smart_Contract/governance
anchor test --skip-local-validator --skip-build
```

This will run the initialization test which sets up the governance program.

## Method 3: Manual Initialization Script

If you need to initialize from the frontend directory, use:

```bash
cd 0xmintyn-Main/Frontend
npm run admin:initialize-governance
```

**Note:** Make sure the contract is built first:
```bash
cd 0xmintyn_Blockchain_Development/Smart_Contract/governance
anchor build
```

## Program ID

The governance program ID is: `4gzdxgRx6423EPk4xqHTVYtT2jkbuquB7L6pgUq87iYG`

## After Initialization

1. Fund the treasury with Mintyn tokens for proposal rewards
2. Users can create proposals (requires 5+ Mintyn tokens)
3. Users can vote on proposals (free)
4. Admin can accept proposals (sends 100 tokens to creator)

