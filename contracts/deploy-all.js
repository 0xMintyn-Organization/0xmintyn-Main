const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const PROGRAMS = [
  {
    name: 'UBI Program',
    path: './mintyn-ubi-distribution',
    deployScript: 'npm run deploy:' + NETWORK.replace('-beta', ''),
    priority: 1
  },
  {
    name: 'Marketplace Program',
    path: './mintyn-marketplace',
    deployScript: 'npm run deploy:' + NETWORK.replace('-beta', ''),
    priority: 2
  },
  {
    name: 'Governance Program',
    path: './mintyn-governance',
    deployScript: 'npm run deploy:' + NETWORK.replace('-beta', ''),
    priority: 3
  },
  {
    name: 'P2P Exchange Program',
    path: './mintyn-p2p-exchange',
    deployScript: 'npm run deploy:' + NETWORK.replace('-beta', ''),
    priority: 4
  }
];

function executeCommand(command, cwd) {
  try {
    console.log(`\n🔧 Executing: ${command}`);
    console.log(`📁 Directory: ${cwd}`);
    
    const result = execSync(command, {
      cwd,
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    return { success: true, result };
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    return { success: false, error };
  }
}

async function deployProgram(program) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Deploying ${program.name}...`);
  console.log(`${'='.repeat(60)}`);
  
  const programPath = path.resolve(program.path);
  
  if (!fs.existsSync(programPath)) {
    console.error(`❌ Program directory not found: ${programPath}`);
    return false;
  }
  
  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  const installResult = executeCommand('npm install', programPath);
  if (!installResult.success) {
    console.error(`❌ Failed to install dependencies for ${program.name}`);
    return false;
  }
  
  // Build program
  console.log('\n🔨 Building program...');
  const buildResult = executeCommand('npm run build', programPath);
  if (!buildResult.success) {
    console.error(`❌ Failed to build ${program.name}`);
    return false;
  }
  
  // Deploy program
  console.log('\n🚀 Deploying program...');
  const deployResult = executeCommand(program.deployScript, programPath);
  if (!deployResult.success) {
    console.error(`❌ Failed to deploy ${program.name}`);
    return false;
  }
  
  console.log(`\n✅ ${program.name} deployed successfully!`);
  return true;
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                     MINTYN PROTOCOL DEPLOYMENT                ║
║                                                               ║
║  🌐 Network: ${NETWORK.toUpperCase().padEnd(49)} ║
║  📅 Date: ${new Date().toISOString().padEnd(52)} ║
║  🎯 Programs: ${PROGRAMS.length} programs to deploy${' '.repeat(34)} ║
╚═══════════════════════════════════════════════════════════════╝
  `);
  
  // Check Solana CLI and wallet
  console.log('\n🔍 Pre-deployment checks...');
  
  try {
    execSync('solana --version', { stdio: 'pipe' });
    console.log('✅ Solana CLI is installed');
  } catch (error) {
    console.error('❌ Solana CLI not found. Please install Solana CLI first.');
    process.exit(1);
  }
  
  try {
    const config = execSync('solana config get', { encoding: 'utf8' });
    console.log('✅ Solana configuration:');
    console.log(config);
  } catch (error) {
    console.error('❌ Failed to get Solana configuration');
    process.exit(1);
  }
  
  try {
    const balance = execSync('solana balance', { encoding: 'utf8' });
    console.log(`✅ Wallet balance: ${balance.trim()}`);
    
    const balanceValue = parseFloat(balance);
    if (balanceValue < 5) {
      console.warn('⚠️  Low SOL balance. You may need more SOL for deployment.');
      console.log('💡 Request airdrop: solana airdrop 5');
    }
  } catch (error) {
    console.error('❌ Failed to check wallet balance');
    process.exit(1);
  }
  
  // Sort programs by priority
  const sortedPrograms = PROGRAMS.sort((a, b) => a.priority - b.priority);
  
  console.log('\n📋 Deployment Order:');
  sortedPrograms.forEach((program, index) => {
    console.log(`  ${index + 1}. ${program.name}`);
  });
  
  // Deploy programs
  const deploymentResults = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (const program of sortedPrograms) {
    const startTime = Date.now();
    const success = await deployProgram(program);
    const duration = Date.now() - startTime;
    
    deploymentResults.push({
      name: program.name,
      success,
      duration: Math.round(duration / 1000)
    });
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
      console.error(`\n❌ ${program.name} deployment failed. Continuing with next program...`);
    }
    
    // Add delay between deployments
    if (program !== sortedPrograms[sortedPrograms.length - 1]) {
      console.log('\n⏳ Waiting 5 seconds before next deployment...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Final summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎉 DEPLOYMENT SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Network: ${NETWORK}`);
  console.log(`Total Programs: ${PROGRAMS.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📊 Success Rate: ${Math.round((successCount / PROGRAMS.length) * 100)}%`);
  
  console.log(`\n📋 Detailed Results:`);
  deploymentResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const duration = `${result.duration}s`;
    console.log(`  ${index + 1}. ${status} ${result.name} (${duration})`);
  });
  
  if (successCount === PROGRAMS.length) {
    console.log(`\n🎉 All programs deployed successfully!`);
    console.log(`\n🔧 Next Steps:`);
    console.log(`1. Update frontend environment variables with new program IDs`);
    console.log(`2. Test all program interactions`);
    console.log(`3. Set up monitoring and alerting`);
    console.log(`4. Update documentation with new addresses`);
    console.log(`5. Notify team of successful deployment`);
  } else if (successCount > 0) {
    console.log(`\n⚠️  Partial deployment completed.`);
    console.log(`✅ ${successCount} programs deployed successfully`);
    console.log(`❌ ${failureCount} programs failed`);
    console.log(`\n🔧 Please review failed deployments and retry if necessary.`);
  } else {
    console.log(`\n❌ All deployments failed.`);
    console.log(`\n🔧 Please check:`);
    console.log(`1. SOL balance is sufficient`);
    console.log(`2. Network connectivity`);
    console.log(`3. Program code compilation`);
    console.log(`4. Solana CLI configuration`);
  }
  
  // Save deployment results
  const resultsPath = path.join(__dirname, `deployment-results-${NETWORK}-${Date.now()}.json`);
  const deploymentData = {
    network: NETWORK,
    timestamp: new Date().toISOString(),
    totalPrograms: PROGRAMS.length,
    successCount,
    failureCount,
    results: deploymentResults
  };
  
  fs.writeFileSync(resultsPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n💾 Deployment results saved to: ${resultsPath}`);
  
  process.exit(failureCount > 0 ? 1 : 0);
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Deployment script failed:', error);
    process.exit(1);
  });
}

module.exports = { main };














