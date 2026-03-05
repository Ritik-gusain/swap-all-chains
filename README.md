# 🚀 Swap All Chains — Multi-Chain Token Swap DApp

A decentralized exchange (DEX) application that enables seamless token swaps across multiple blockchain networks. Built with Solidity smart contracts and a modern web interface, supporting Ethereum, Arbitrum, Optimism, Polygon, and more.

> **Built by [Ritik Gusain](https://github.com/Ritik-gusain)**  
> Cyfrin Updraft Certified · 323 LeetCode Problems Solved · BCA Final Year, IITM Delhi

---

## 🌟 Features

- **Multi-Chain Support**: Swap tokens across Ethereum, Arbitrum, Optimism, Polygon, and Base
- **Direct Wallet Integration**: Connect MetaMask and swap directly from your wallet
- **Fixed Exchange Rates**: Predictable 1 ETH = 1000 RTK conversion rate
- **No Intermediaries**: Peer-to-peer swaps with smart contract escrow
- **Security First**: Implements CEI pattern, reentrancy guards, and custom errors
- **Full Test Coverage**: Comprehensive test suite with 20+ test cases

---

## 📁 Project Structure

```
swap-all-chains/
├── ritikswap_index.html          # Main DApp frontend interface
├── RitikSwap_Complete/           # Hardhat development environment
│   ├── contracts/                # Solidity smart contracts
│   │   ├── RitikToken.sol       # ERC-20 token implementation
│   │   └── TokenSwap.sol        # DEX swap contract
│   ├── scripts/                 # Deployment scripts
│   ├── test/                    # Test suites
│   ├── hardhat.config.js        # Hardhat configuration
│   └── package.json             # Dependencies
└── README.md                    # This file
```

---

## 🏗️ Architecture

```
User (MetaMask) ──► Frontend (HTML/JS)
                        │
                        ▼
                Multiple Blockchains
                ┌─────────────────┐
                │   Ethereum      │
                │   Arbitrum      │
                │   Optimism      │
                │   Polygon       │
                │   Base          │
                └─────────────────┘
                        │
                        ▼
                TokenSwap Contracts
                        │
                        ▼
                ERC-20 Tokens (RTK)
```

**Exchange Rate**: 1 ETH = 1000 RTK (owner configurable)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (recommended: 22.10.0+ for Hardhat)
- [MetaMask](https://metamask.io/) browser extension
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ritik-gusain/swap-all-chains.git
cd swap-all-chains

# Install dependencies
cd RitikSwap_Complete
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your RPC URLs and private key
```

### Local Development

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Start local Hardhat node
npm run node

# Deploy to localhost (in new terminal)
npm run deploy:local
```

### Production Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Or deploy to mainnet (configure in hardhat.config.js)
npx hardhat run scripts/deploy.js --network mainnet
```

### Run the DApp

```bash
# From project root, serve the frontend
python -m http.server 8000
# Open http://localhost:8000/ritikswap_index.html
```

---

## 🔐 Security Features

### Smart Contract Security
- **Checks-Effects-Interactions (CEI)**: Proper execution order in all functions
- **Reentrancy Protection**: Manual guards against reentrancy attacks
- **Custom Errors**: Gas-efficient error handling
- **Access Control**: Owner-only functions for rate updates and withdrawals
- **Safe ETH Transfers**: Uses `.call()` for secure ETH transfers

### Frontend Security
- **Wallet Connection**: Secure MetaMask integration
- **Input Validation**: Client-side validation before transactions
- **Network Detection**: Automatic chain detection and switching

---

## 📊 Supported Networks & Tokens

| Network | Chain ID | Native Token | Supported Tokens |
|---------|----------|--------------|------------------|
| Ethereum | 1 | ETH | USDC, USDT, WBTC |
| Arbitrum | 42161 | ETH | USDC, USDT, ARB |
| Optimism | 10 | ETH | USDC, OP |
| Polygon | 137 | MATIC | USDC, USDT |
| Base | 8453 | ETH | USDC |

---

## 🧪 Testing

```bash
cd RitikSwap_Complete
npm run test          # Run all tests
npm run coverage      # Generate coverage report
```

**Test Coverage**: 20+ test cases covering:
- Token deployment and transfers
- Swap functionality (buy/sell)
- Owner functions (rate updates, withdrawals)
- Security edge cases
- Event emissions

---

## 📜 Smart Contracts

### RitikToken.sol
- Full ERC-20 implementation from scratch
- 1 million initial supply
- Standard transfer, approve, transferFrom functions

### TokenSwap.sol
- DEX contract for ETH ↔ RTK swaps
- Liquidity management (ETH and token pools)
- Owner controls for rate adjustment
- Event logging for all transactions

---

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live balance and rate display
- **Transaction History**: View past swaps
- **Multi-Network**: Switch between supported chains
- **Gas Estimation**: Automatic gas price calculation

---

## 🔧 Configuration

### Environment Variables (.env)
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Hardhat Networks
Configure additional networks in `hardhat.config.js`:
```javascript
networks: {
  arbitrum: {
    url: "https://arb1.arbitrum.io/rpc",
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

---

## 📈 Deployment Addresses

After deployment, update these addresses in `ritikswap_index.html`:

```javascript
const CONTRACT_ADDRESSES = {
  ethereum: {
    tokenSwap: "0x...",
    ritikToken: "0x..."
  },
  arbitrum: {
    // ...
  }
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [OpenZeppelin](https://openzeppelin.com/) - Smart contract standards
- [MetaMask](https://metamask.io/) - Web3 wallet
- [Cyfrin Updraft](https://updraft.cyfrin.io/) - Smart contract security training

---

## 📞 Support

For questions or issues:
- Open an [issue](https://github.com/Ritik-gusain/swap-all-chains/issues) on GitHub
- Connect on [LinkedIn](https://linkedin.com/in/ritik-gusain)

---

**⭐ Star this repo if you find it helpful!**</content>
<parameter name="filePath">c:\Users\HP\Downloads\files\README.md