// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const { getDeployed, appDeploy, signer, gasCalculate } = require('../components/app.js')

async function main() {

  const deployed = getDeployed();

  const { admin, operator } = await signer();

  if( deployed['ERC721Template'] === undefined ) {
      throw new Error('deploy nft first.')
  }

  // escrow
  const paramEscrow = [
    admin.address,
    operator.address,
    deployed['ERC721Template']
  ]
  
  console.log(paramEscrow);

  const gas = await gasCalculate(admin, "Escrow", ...paramEscrow);

  console.log(gas);

  const escrow = await appDeploy(admin, 'Escrow', paramEscrow);

  console.log(`nft deployed to ${escrow.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
