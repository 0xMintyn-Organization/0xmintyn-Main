// Browser Console Script to Initialize UBI Program
// Copy and paste this ENTIRE script into your browser console

(async () => {
  try {
    console.log("🚀 Starting UBI Program Initialization...");
    
    // Check if Phantom is installed
    if (!window.solana || !window.solana.isPhantom) {
      alert("❌ Please install Phantom wallet!");
      return;
    }
    
    // Connect if not connected
    if (!window.solana.isConnected) {
      console.log("📱 Connecting to Phantom...");
      await window.solana.connect();
    }
    
    const authorityAddress = window.solana.publicKey.toString();
    console.log("✅ Connected wallet:", authorityAddress);
    
    // Import Solana libraries (these should be available in Next.js)
    const { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } = await import('@solana/web3.js');
    const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } = await import('@solana/spl-token');
    
    // Constants
    const RPC_URL = "https://api.devnet.solana.com";
    const NETWORK = "devnet";
    const UBI_PROGRAM_ID = new PublicKey("8zQxTardZ5YbTwxJJf3hkV4jzRa8EGfwBCrMd9tEajJy");
    const MINTYN_MINT = new PublicKey("4iZQd3BBciErC9PGxxkTDtraZujEHjRCmRexRm9AwipL");
    const UBI_PROGRAM_SEED = Buffer.from("ubi_program");
    const TREASURY_SEED = Buffer.from("treasury");
    
    const connection = new Connection(RPC_URL, "confirmed");
    const authorityPublicKey = new PublicKey(authorityAddress);
    
    // Check if already initialized
    const [ubiProgram] = PublicKey.findProgramAddressSync([UBI_PROGRAM_SEED], UBI_PROGRAM_ID);
    const accountInfo = await connection.getAccountInfo(ubiProgram);
    if (accountInfo !== null && accountInfo.data.length > 0) {
      alert("⚠️ UBI Program is already initialized!");
      console.log("✅ Program already initialized at:", ubiProgram.toString());
      return;
    }
    
    console.log("📋 Deriving PDA addresses...");
    const [treasury] = PublicKey.findProgramAddressSync(
      [UBI_PROGRAM_SEED, TREASURY_SEED],
      UBI_PROGRAM_ID
    );
    
    console.log("  UBI Program PDA:", ubiProgram.toString());
    console.log("  Treasury PDA:", treasury.toString());
    
    // Get authority's token account
    const authorityTokenAccount = await getAssociatedTokenAddress(MINTYN_MINT, authorityPublicKey);
    
    // Check if authority token account exists
    let createAuthorityTokenAccountIx = null;
    try {
      await getAccount(connection, authorityTokenAccount);
      console.log("✅ Authority token account exists");
    } catch {
      console.log("📝 Creating authority token account...");
      createAuthorityTokenAccountIx = createAssociatedTokenAccountInstruction(
        authorityPublicKey,
        authorityTokenAccount,
        authorityPublicKey,
        MINTYN_MINT
      );
    }
    
    // Load IDL from public folder
    console.log("📥 Loading IDL...");
    const idlResponse = await fetch('/idl/ubi_smart_contract.json');
    if (!idlResponse.ok) {
      throw new Error("Failed to load IDL file. Make sure /public/idl/ubi_smart_contract.json exists.");
    }
    const idl = await idlResponse.json();
    
    // Find initialize instruction
    const initializeIx = idl.instructions?.find((ix) => ix.name === "initialize");
    if (!initializeIx) {
      throw new Error("initialize instruction not found in IDL");
    }
    
    // Get discriminator
    const discriminator = Buffer.from(initializeIx.discriminator);
    console.log("✅ Discriminator loaded");
    
    // Build accounts array
    const accountMetas = initializeIx.accounts.map((acc) => {
      let pubkey;
      switch (acc.name) {
        case "authority": pubkey = authorityPublicKey; break;
        case "mintyn_mint": pubkey = MINTYN_MINT; break;
        case "authority_token_account": pubkey = authorityTokenAccount; break;
        case "ubi_program": pubkey = ubiProgram; break;
        case "treasury": pubkey = treasury; break;
        case "token_program": pubkey = TOKEN_PROGRAM_ID; break;
        case "system_program": pubkey = SystemProgram.programId; break;
        default: throw new Error(`Unknown account: ${acc.name}`);
      }
      return {
        pubkey,
        isSigner: acc.signer || false,
        isWritable: acc.writable || false,
      };
    });
    
    console.log("✅ Accounts prepared:", accountMetas.length, "accounts");
    
    // Build instruction
    const initializeInstruction = new TransactionInstruction({
      programId: UBI_PROGRAM_ID,
      keys: accountMetas,
      data: discriminator,
    });
    
    // Create transaction
    const transaction = new Transaction();
    if (createAuthorityTokenAccountIx) {
      transaction.add(createAuthorityTokenAccountIx);
    }
    transaction.add(initializeInstruction);
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authorityPublicKey;
    
    console.log("📤 Signing transaction...");
    const signedTx = await window.solana.signTransaction(transaction);
    
    console.log("📡 Sending transaction...");
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
    });
    
    console.log("📝 Transaction sent:", signature);
    console.log("⏳ Waiting for confirmation...");
    
    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed");
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    console.log("✅ UBI Program initialized successfully!");
    console.log("Transaction signature:", signature);
    console.log("View on Solana Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=${NETWORK}`);
    
    alert("✅ SUCCESS!\n\nUBI Program initialized!\n\nTransaction: " + signature + "\n\nUsers can now claim UBI tokens!");
    
    // Reload page after 2 seconds
    setTimeout(() => {
      console.log("🔄 Reloading page...");
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error("❌ Error:", error);
    alert("❌ Error: " + error.message);
  }
})();

