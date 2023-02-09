// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const { getJson, mockMerkle, deployERC721Template, initUsers } = require('../components/common.js')

async function main() {
  
  const { merkleRoot } = getJson('./config.json');
  const { admin, operator, bob, sam } = await initUsers();
  const { nft, config } = await deployERC721Template(admin, operator, merkleRoot);

  console.log(
    `nft deployed to ${nft.address}`,
    config
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
