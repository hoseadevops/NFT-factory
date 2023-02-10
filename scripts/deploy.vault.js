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

  if( deployed['Escrow'] === undefined ) {
      throw new Error('deploy escrow first.')
  }

  // vault
  const paramVault = [
    admin.address,
    operator.address,
    deployed['Escrow']
  ]
  
  const gas = await gasCalculate(admin, "Vault", ...paramVault);

  const vault = await appDeploy(admin, 'Vault', paramVault);

  console.log(
      `nft deployed to ${vault.address}`,
      paramVault,
      gas
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
