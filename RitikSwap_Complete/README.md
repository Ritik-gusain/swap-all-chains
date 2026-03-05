# ⚡ RitikSwap — ETH ↔ ERC-20 Token Exchange DApp

A decentralised exchange (DEX) smart contract built with Solidity and Hardhat.  
Users can swap ETH for ERC-20 tokens (and vice versa) at a fixed exchange rate,  
directly from their MetaMask wallet — no intermediary required.

> **Built by [Ritik Gusain](https://github.com/Ritik-gusain)**  
> Cyfrin Updraft Certified · 323 LeetCode Problems Solved · BCA Final Year, IITM Delhi

---

## 📌 What This Project Demonstrates

| Concept | Where |
|---|---|
| ERC-20 token standard (from scratch) | `contracts/RitikToken.sol` |
| Smart contract security patterns | CEI pattern, reentrancy guard, custom errors |
| ETH ↔ Token swap logic | `contracts/TokenSwap.sol` |
| Liquidity management | `depositEth`, `withdrawEth`, `withdrawTokens` |
| Owner access control | `onlyOwner` modifier, `transferOwnership` |
| Event logging | `TokensBought`, `TokensSold`, `RateUpdated` |
| Full test coverage | `test/TokenSwap.test.js` — 20+ test cases |
| Professional deployment script | `scripts/deploy.js` with console logging |

---

## 🏗️ Architecture

```
User (MetaMask)
      │
      │  ETH  ──────────────────────► TokenSwap.sol
      │                                    │
      │  ◄──────────────────────  RTK      │  holds token liquidity
      │                                    │  holds ETH liquidity
      │  RTK  ──────────────────────►      │
      │                                    │
      │  ◄──────────────────────  ETH      │
                                           │
                               RitikToken.sol (ERC-20)
```

**Exchange rate**: `1 ETH = 1000 RTK` (configurable by owner)

---

## 🔐 Security Patterns Used

### 1. Checks-Effects-Interactions (CEI)
Every state-changing function follows this order:
```
1. CHECK  — validate inputs (revert early, save gas)
2. EFFECT — update contract state
3. INTERACT — make external calls last
```

### 2. Manual Reentrancy Guard
```solidity
modifier nonReentrant() {
    if (_lockStatus == 2) revert ReentrantCall();
    _lockStatus = 2;   // lock
    _;
    _lockStatus = 1;   // unlock
}
```
Prevents attackers from re-entering `sellTokens()` before the ETH balance updates.

### 3. Custom Errors (Gas Efficient)
```solidity
error InsufficientTokenLiquidity(uint256 requested, uint256 available);
error NotOwner();
error ZeroAmount();
// ... etc
```
Costs ~50% less gas than `require("string message")`.

### 4. Safe ETH Transfer
```solidity
(bool success, ) = payable(msg.sender).call{value: amount}("");
if (!success) revert EthTransferFailed();
```
Uses `.call()` instead of deprecated `.transfer()` or `.send()`.

---

## 📁 Project Structure

```
ritikswap/
├── contracts/
│   ├── TokenSwap.sol      # Main DEX contract
│   └── RitikToken.sol     # ERC-20 token (RTK) — built from scratch
├── scripts/
│   └── deploy.js          # Deployment script (local + Sepolia)
├── test/
│   └── TokenSwap.test.js  # Full test suite (20+ cases)
├── .env.example           # Environment variable template
├── hardhat.config.js      # Hardhat configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repo
git clone https://github.com/Ritik-gusain/ritikswap.git
cd ritikswap

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your values in .env
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy Locally

```bash
# Terminal 1 — start local Hardhat node
npm run node

# Terminal 2 — deploy contracts
npm run deploy:local
```

### Deploy to Sepolia Testnet

1. Get free Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com)
2. Fill in `.env` with your Alchemy RPC URL and MetaMask private key
3. Run:

```bash
npm run deploy:sepolia
```

---

## 🔄 How It Works

### Buying Tokens (ETH → RTK)

```
User sends 1 ETH  →  receives 1000 RTK
User sends 0.5 ETH →  receives 500 RTK
```

```solidity
function buyTokens() external payable {
    uint256 tokenAmount = msg.value * rate / 1 ether;
    token.transfer(msg.sender, tokenAmount);
    emit TokensBought(msg.sender, msg.value, tokenAmount);
}
```

### Selling Tokens (RTK → ETH)

```
User sends 1000 RTK  →  receives 1 ETH
User sends 500 RTK   →  receives 0.5 ETH
```

```solidity
// Step 1: Approve the contract first
token.approve(swapAddress, amount);

// Step 2: Sell tokens
function sellTokens(uint256 tokenAmount) external {
    uint256 ethAmount = tokenAmount * 1 ether / rate;
    token.transferFrom(msg.sender, address(this), tokenAmount);
    payable(msg.sender).call{value: ethAmount}("");
    emit TokensSold(msg.sender, tokenAmount, ethAmount);
}
```

---

## 📊 Contract Functions Reference

### User Functions
| Function | Description |
|---|---|
| `buyTokens()` | Send ETH, receive RTK tokens |
| `sellTokens(uint256)` | Send RTK tokens, receive ETH |
| `previewBuy(uint256)` | Preview tokens received for a given ETH amount |
| `previewSell(uint256)` | Preview ETH received for a given token amount |

### View Functions
| Function | Returns |
|---|---|
| `tokenLiquidity()` | RTK token balance of the contract |
| `ethLiquidity()` | ETH balance of the contract |
| `rate()` | Current exchange rate (tokens per 1 ETH) |
| `owner()` | Current contract owner address |

### Owner-Only Functions
| Function | Description |
|---|---|
| `setRate(uint256)` | Update the exchange rate |
| `depositEth()` | Add ETH liquidity (payable) |
| `withdrawEth(uint256)` | Remove ETH from contract |
| `withdrawTokens(uint256)` | Remove tokens from contract |
| `transferOwnership(address)` | Transfer contract ownership |

---

## 🧪 Test Coverage

```
  RitikToken
    ✓ should mint the correct initial supply to the deployer
    ✓ should have correct name, symbol, and decimals
    ✓ should allow token transfers between accounts
    ✓ should revert transfer if sender has insufficient balance

  TokenSwap — Deployment
    ✓ should set the correct rate
    ✓ should have the correct token liquidity after seeding
    ✓ should have the correct ETH liquidity after seeding

  TokenSwap — buyTokens()
    ✓ should give the buyer the correct number of tokens
    ✓ should increase the contract ETH balance
    ✓ should emit TokensBought event with correct args
    ✓ should revert if no ETH is sent
    ✓ should revert if contract has insufficient token liquidity

  TokenSwap — sellTokens()
    ✓ should return correct ETH for tokens sold
    ✓ should emit TokensSold event with correct args
    ✓ should revert if tokenAmount is zero
    ✓ should revert if seller has not approved the contract

  TokenSwap — previewBuy() / previewSell()
    ✓ previewBuy should return correct token amount
    ✓ previewSell should return correct ETH amount

  TokenSwap — Owner functions
    ✓ should allow owner to update rate
    ✓ should emit RateUpdated when rate changes
    ✓ should revert setRate if called by non-owner
    ✓ should allow owner to withdraw ETH
    ✓ should allow owner to withdraw tokens
    ✓ should allow owner to transfer ownership
```

---

## 🛣️ Roadmap

- [x] Core swap contract (ETH ↔ ERC-20)
- [x] ERC-20 token built from scratch
- [x] Full test suite
- [x] Deployment scripts
- [ ] Frontend (React + Ethers.js) — *in progress*
- [ ] Dynamic AMM pricing (constant product formula: x·y=k)
- [ ] Multi-token support
- [ ] Liquidity provider rewards

---

## 📚 What I Learned

Building this project gave me hands-on experience with:

- How the ERC-20 standard actually works at the code level
- Why the Checks-Effects-Interactions pattern exists (reentrancy attacks)
- The difference between `.transfer()`, `.send()`, and `.call()` for ETH
- How exchange rate arithmetic works in fixed-point Solidity math
- Writing professional Hardhat tests with fixtures and event assertions
- How DEXes like Uniswap handle liquidity at a fundamental level

---

## 📄 License

MIT — feel free to fork, learn from, and build on this.

---

*This project was built as part of my blockchain development portfolio.*  
*Certified via [Cyfrin Updraft — Blockchain Basics](https://profiles.cyfrin.io/u/ritik21/achievements/blockchain-basics)*
