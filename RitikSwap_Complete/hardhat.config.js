require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,   // optimise for ~200 calls per function (typical DApp usage)
      },
    },
  },

  networks: {
    // Local development — runs with `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // Sepolia testnet — requires .env variables
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },

  // Verify on Etherscan after deployment (optional but looks great on GitHub)
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};
