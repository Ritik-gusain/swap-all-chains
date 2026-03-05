/**
 * deploy.js
 * ──────────
 * Deploys RitikToken and TokenSwap contracts in sequence.
 *
 * Run locally:
 *   npx hardhat run scripts/deploy.js --network localhost
 *
 * Run on Sepolia testnet:
 *   npx hardhat run scripts/deploy.js --network sepolia
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  RitikSwap — Deployment Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── Step 1: Deploy RitikToken ────────────────────────────────────
  const INITIAL_SUPPLY = 1_000_000; // 1 million RTK tokens
  console.log(`[1/4] Deploying RitikToken (${INITIAL_SUPPLY.toLocaleString()} RTK)...`);

  const RitikToken = await ethers.getContractFactory("RitikToken");
  const token = await RitikToken.deploy(INITIAL_SUPPLY);
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log(`      ✅ RitikToken deployed at: ${tokenAddress}\n`);

  // ── Step 2: Deploy TokenSwap ─────────────────────────────────────
  const RATE = 1000n; // 1 ETH = 1000 RTK
  console.log(`[2/4] Deploying TokenSwap (rate: 1 ETH = ${RATE} RTK)...`);

  const TokenSwap = await ethers.getContractFactory("TokenSwap");
  const swap = await TokenSwap.deploy(tokenAddress, RATE);
  await swap.waitForDeployment();

  const swapAddress = await swap.getAddress();
  console.log(`      ✅ TokenSwap deployed at: ${swapAddress}\n`);

  // ── Step 3: Seed TokenSwap with tokens (buy-side liquidity) ──────
  const SEED_TOKENS = ethers.parseUnits("500000", 18); // 500k RTK
  console.log(`[3/4] Seeding TokenSwap with 500,000 RTK for buy-side liquidity...`);

  const approveTx = await token.approve(swapAddress, SEED_TOKENS);
  await approveTx.wait();

  // Transfer tokens directly (owner seeds the contract)
  const transferTx = await token.transfer(swapAddress, SEED_TOKENS);
  await transferTx.wait();
  console.log(`      ✅ 500,000 RTK transferred to TokenSwap\n`);

  // ── Step 4: Seed TokenSwap with ETH (sell-side liquidity) ────────
  const SEED_ETH = ethers.parseEther("1"); // 1 ETH
  console.log(`[4/4] Depositing 1 ETH into TokenSwap for sell-side liquidity...`);

  const depositTx = await swap.depositEth({ value: SEED_ETH });
  await depositTx.wait();
  console.log(`      ✅ 1 ETH deposited into TokenSwap\n`);

  // ── Summary ───────────────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Deployment Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  RitikToken (RTK) : ${tokenAddress}`);
  console.log(`  TokenSwap        : ${swapAddress}`);
  console.log(`  Exchange Rate    : 1 ETH = ${RATE} RTK`);
  console.log(`  Token Liquidity  : 500,000 RTK`);
  console.log(`  ETH Liquidity    : 1 ETH`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("  Save these addresses — you'll need them for the frontend.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
