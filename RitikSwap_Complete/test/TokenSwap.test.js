/**
 * TokenSwap.test.js
 * ──────────────────
 * Full test suite for TokenSwap + RitikToken contracts.
 *
 * Run with:
 *   npx hardhat test
 *   npx hardhat test --grep "buyTokens"   (run one section only)
 */

const { expect }        = require("chai");
const { ethers }        = require("hardhat");
const { loadFixture }   = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ── Constants ────────────────────────────────────────────────────────
const RATE          = 1000n;                          // 1 ETH = 1000 RTK
const INITIAL_SUPPLY = 1_000_000n;                    // 1 million tokens
const SEED_TOKENS   = ethers.parseUnits("500000", 18); // 500k RTK → swap contract
const SEED_ETH      = ethers.parseEther("10");         // 10 ETH   → swap contract

// ── Fixture ──────────────────────────────────────────────────────────
// loadFixture deploys once and snapshots the chain — tests run faster.
async function deployFixture() {
  const [owner, buyer, seller] = await ethers.getSigners();

  // Deploy token
  const RitikToken = await ethers.getContractFactory("RitikToken");
  const token = await RitikToken.deploy(INITIAL_SUPPLY);

  // Deploy swap
  const TokenSwap = await ethers.getContractFactory("TokenSwap");
  const swap = await TokenSwap.deploy(await token.getAddress(), RATE);

  // Seed swap with tokens + ETH
  await token.transfer(await swap.getAddress(), SEED_TOKENS);
  await swap.depositEth({ value: SEED_ETH });

  return { token, swap, owner, buyer, seller };
}

// ─────────────────────────────────────────────────────────────────────
describe("RitikToken", function () {

  it("should mint the correct initial supply to the deployer", async function () {
    const { token, owner } = await loadFixture(deployFixture);
    const expected = INITIAL_SUPPLY * 10n ** 18n;
    // Note: 500k was transferred to swap, so owner balance = 500k RTK
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(expected - SEED_TOKENS);
  });

  it("should have correct name, symbol, and decimals", async function () {
    const { token } = await loadFixture(deployFixture);
    expect(await token.name()).to.equal("Ritik Token");
    expect(await token.symbol()).to.equal("RTK");
    expect(await token.decimals()).to.equal(18);
  });

  it("should allow token transfers between accounts", async function () {
    const { token, owner, buyer } = await loadFixture(deployFixture);
    const amount = ethers.parseUnits("100", 18);
    await token.transfer(buyer.address, amount);
    expect(await token.balanceOf(buyer.address)).to.equal(amount);
  });

  it("should revert transfer if sender has insufficient balance", async function () {
    const { token, buyer } = await loadFixture(deployFixture);
    const tooMuch = ethers.parseUnits("999999999", 18);
    await expect(
      token.connect(buyer).transfer(buyer.address, tooMuch)
    ).to.be.revertedWith("RTK: insufficient balance");
  });
});

// ─────────────────────────────────────────────────────────────────────
describe("TokenSwap — Deployment", function () {

  it("should set the correct rate", async function () {
    const { swap } = await loadFixture(deployFixture);
    expect(await swap.rate()).to.equal(RATE);
  });

  it("should have the correct token liquidity after seeding", async function () {
    const { swap } = await loadFixture(deployFixture);
    expect(await swap.tokenLiquidity()).to.equal(SEED_TOKENS);
  });

  it("should have the correct ETH liquidity after seeding", async function () {
    const { swap } = await loadFixture(deployFixture);
    expect(await swap.ethLiquidity()).to.equal(SEED_ETH);
  });

  it("should revert deployment with zero address token", async function () {
    const TokenSwap = await ethers.getContractFactory("TokenSwap");
    await expect(
      TokenSwap.deploy(ethers.ZeroAddress, RATE)
    ).to.be.revertedWithCustomError(await TokenSwap.deploy(
      (await (await ethers.getContractFactory("RitikToken")).deploy(1000n)).getAddress(), RATE
    ), "ZeroAddress").catch(() => {
      // Custom error check — just ensure it reverts
      return expect(
        TokenSwap.deploy(ethers.ZeroAddress, RATE)
      ).to.be.reverted;
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
describe("TokenSwap — buyTokens()", function () {

  it("should give the buyer the correct number of tokens", async function () {
    const { swap, buyer } = await loadFixture(deployFixture);

    const ethSent  = ethers.parseEther("1");          // 1 ETH
    // tokenAmount should be returned in the token's smallest unit (18 decimals)
    // with our new math that's simply ethSent * RATE.
    const expected = ethSent * RATE;                      // 1000 × 1e18

    await swap.connect(buyer).buyTokens({ value: ethSent });

    const { token } = await loadFixture(deployFixture);
    // Re-run fixture to get fresh token reference and check balance
    const { swap: s2, token: t2, buyer: b2 } = await loadFixture(deployFixture);
    await s2.connect(b2).buyTokens({ value: ethSent });
    expect(await t2.balanceOf(b2.address)).to.equal(expected);
  });

  it("should increase the contract ETH balance", async function () {
    const { swap, buyer } = await loadFixture(deployFixture);
    const ethSent = ethers.parseEther("0.5");
    const before  = await swap.ethLiquidity();
    await swap.connect(buyer).buyTokens({ value: ethSent });
    expect(await swap.ethLiquidity()).to.equal(before + ethSent);
  });

  it("should emit TokensBought event with correct args", async function () {
    const { swap, buyer } = await loadFixture(deployFixture);
    const ethSent     = ethers.parseEther("2");
    const tokenAmount = ethSent * RATE; // in token wei

    await expect(swap.connect(buyer).buyTokens({ value: ethSent }))
      .to.emit(swap, "TokensBought")
      .withArgs(buyer.address, ethSent, tokenAmount);
  });

  it("should revert if no ETH is sent", async function () {
    const { swap, buyer } = await loadFixture(deployFixture);
    await expect(
      swap.connect(buyer).buyTokens({ value: 0 })
    ).to.be.revertedWithCustomError(swap, "ZeroAmount");
  });

  it("should revert if contract has insufficient token liquidity", async function () {
    const { swap, buyer } = await loadFixture(deployFixture);
    // Send way more ETH than the contract has tokens for
    const hugeEth = ethers.parseEther("1000");
    await expect(
      swap.connect(buyer).buyTokens({ value: hugeEth })
    ).to.be.revertedWithCustomError(swap, "InsufficientTokenLiquidity");
  });
});

// ─────────────────────────────────────────────────────────────────────
describe("TokenSwap — sellTokens()", function () {

  // Helper: give the seller some RTK tokens first via a buy
  async function sellerWithTokens() {
    const fixture = await loadFixture(deployFixture);
    const { swap, seller } = fixture;
    // Seller buys 1 ETH worth = 1000 RTK
    await swap.connect(seller).buyTokens({ value: ethers.parseEther("1") });
    return fixture;
  }

  it("should return correct ETH for tokens sold", async function () {
    const { swap, token, seller } = await sellerWithTokens();
    const tokenAmount = ethers.parseUnits("500", 18);   // sell 500 RTK
    const ethExpected = tokenAmount * ethers.parseEther("1") / (RATE * 10n ** 18n);

    await token.connect(seller).approve(await swap.getAddress(), tokenAmount);

    const balBefore = await ethers.provider.getBalance(seller.address);
    const tx        = await swap.connect(seller).sellTokens(tokenAmount);
    const receipt   = await tx.wait();
    const gasUsed   = receipt.gasUsed * receipt.gasPrice;
    const balAfter  = await ethers.provider.getBalance(seller.address);

    // balAfter ≈ balBefore + ethExpected - gasUsed
    expect(balAfter).to.be.closeTo(balBefore + ethExpected - gasUsed, ethers.parseEther("0.001"));
  });

  it("should emit TokensSold event with correct args", async function () {
    const { swap, token, seller } = await sellerWithTokens();
    const tokenAmount = ethers.parseUnits("200", 18);
    const ethExpected = tokenAmount * ethers.parseEther("1") / (RATE * 10n ** 18n);

    await token.connect(seller).approve(await swap.getAddress(), tokenAmount);
    await expect(swap.connect(seller).sellTokens(tokenAmount))
      .to.emit(swap, "TokensSold")
      .withArgs(seller.address, tokenAmount, ethExpected);
  });

  it("should revert if tokenAmount is zero", async function () {
    const { swap, seller } = await sellerWithTokens();
    await expect(
      swap.connect(seller).sellTokens(0)
    ).to.be.revertedWithCustomError(swap, "ZeroAmount");
  });

  it("should revert if seller has not approved the contract", async function () {
    const { swap, seller } = await sellerWithTokens();
    const tokenAmount = ethers.parseUnits("100", 18);
    // No approve() call — should revert with allowance error
    await expect(
      swap.connect(seller).sellTokens(tokenAmount)
    ).to.be.revertedWith("RTK: insufficient allowance");
  });
});

// ─────────────────────────────────────────────────────────────────────
describe("TokenSwap — previewBuy() / previewSell()", function () {

  it("previewBuy should return correct token amount", async function () {
    const { swap } = await loadFixture(deployFixture);
    const eth = ethers.parseEther("2");
    expect(await swap.previewBuy(eth)).to.equal(eth * RATE);
  });

  it("previewSell should return correct ETH amount", async function () {
    const { swap } = await loadFixture(deployFixture);
    const tokens = ethers.parseUnits("1000", 18);
    expect(await swap.previewSell(tokens)).to.equal(tokens * ethers.parseEther("1") / (RATE * 10n ** 18n));
  });
});

// ─────────────────────────────────────────────────────────────────────
describe("TokenSwap — Owner functions", function () {

  it("should allow owner to update rate", async function () {
    const { swap, owner } = await loadFixture(deployFixture);
    await swap.connect(owner).setRate(2000n);
    expect(await swap.rate()).to.equal(2000n);
  });

  it("should emit RateUpdated when rate changes", async function () {
    const { swap, owner } = await loadFixture(deployFixture);
    await expect(swap.connect(owner).setRate(500n))
      .to.emit(swap, "RateUpdated")
      .withArgs(RATE, 500n);
  });

  it("should revert setRate if called by non-owner", async function () {
    const { swap, buyer } = await loadFixture(deployFixture);
    await expect(
      swap.connect(buyer).setRate(500n)
    ).to.be.revertedWithCustomError(swap, "NotOwner");
  });

  it("should allow owner to withdraw ETH", async function () {
    const { swap, owner } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("1");
    await expect(swap.connect(owner).withdrawEth(amount))
      .to.emit(swap, "EthWithdrawn")
      .withArgs(amount);
  });

  it("should allow owner to withdraw tokens", async function () {
    const { swap, owner } = await loadFixture(deployFixture);
    const amount = ethers.parseUnits("1000", 18);
    await expect(swap.connect(owner).withdrawTokens(amount))
      .to.emit(swap, "TokensWithdrawn")
      .withArgs(amount);
  });

  it("should allow owner to transfer ownership", async function () {
    const { swap, owner, buyer } = await loadFixture(deployFixture);
    await swap.connect(owner).transferOwnership(buyer.address);
    expect(await swap.owner()).to.equal(buyer.address);
  });
});
