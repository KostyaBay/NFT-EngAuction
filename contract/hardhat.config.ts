import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

import * as dotenv from "dotenv";
dotenv.config();

const SEPOLIA_PRIVATE_KEY="YOUR_PRIVATE_KEY";
const ALCHEMY_API_KEY="YOUR_ALCHEMY_API_KEY";
const ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY";
// function privateKey() {
//   return process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
// }

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      initialDate: "1970-01-01T00:00:00Z",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      initialDate: "1970-01-01T00:00:00Z",
      gasMultiplier: 1.2,
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY]
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: `${ETHERSCAN_API_KEY}`
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  },
  typechain: {
    outDir: "generated-types",
    target: "ethers-v6",
  },
};

export default config;