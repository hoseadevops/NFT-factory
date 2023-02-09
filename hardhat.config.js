require("@nomicfoundation/hardhat-toolbox");
const { getJson } = require('./components/common.js')

const appConfig = getJson('./config.json');

const { ALCHEMY_API_KEY, GOERLI_PRIVATE_KEY1, GOERLI_PRIVATE_KEY2, ETHERSCAN_API_KEY } = appConfig;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity : "0.8.17",
  // solidity: {
  //   compilers: [
  //     {
  //       version: "0.8.17",
  //       settings: {
  //           viaIR: true,
  //           optimizer: {
  //               enabled: true,
  //               runs: 1000000,
  //           },
  //       },
  //     }
  //   ],
  // }
  networks: {
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY1, GOERLI_PRIVATE_KEY2, GOERLI_PRIVATE_KEY1, GOERLI_PRIVATE_KEY2],
      gasMultiplier: 1.3,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  }
};
