// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const { getJson, appDeploy, signer, gasCalculate } = require('../components/app.js')

async function main() {
  
  const { merkleRoot } = getJson('./config.json');
  const { admin, operator } = await signer();
  // nft
  const paramERC721Template = [
      true,
      admin.address,
      operator.address,
      merkleRoot,
      "name",
      'symbol',
      'https://ipfs.io/ipfs/',
      101,
      199
    ]
    console.log(paramERC721Template);

    const gas = await gasCalculate(admin, "ERC721Template", ...paramERC721Template);

    console.log(gas);

    const nft = await appDeploy(admin, "ERC721Template", paramERC721Template);

    console.log(`nft deployed to ${nft.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
