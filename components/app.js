const { deploy, gasCalculate } = require('./deploy.js')
const { makeMerkle } = require('./merkle/merkle.js')
const { getJson } = require('./json.js')

async function signer() {
  const [ admin, operator, bob, sam ]  = await ethers.getSigners(); 
  return { admin, operator, bob, sam }; 
}

async function appDeploy(signer, contract, param) {
  return await deploy(signer, contract,  ...param);
}

async function mockDeploy() {
  const { admin, operator } = await signer();
  const { root, testUser } = await makeMerkle();
  
  // nft
  const paramERC721Template = [
    true,
    admin.address,
    operator.address,
    root,
    "name",
    'symbol',
    'https://ipfs.io/ipfs/',
    101,
    199
  ]

  const nft = await appDeploy(admin, 'ERC721Template', paramERC721Template);

  // escrow
  const paramEscrow = [
    admin.address,
    operator.address,
    nft.address
  ]
  const escrow = await appDeploy(admin, 'Escrow', paramEscrow);
  

  // vault
  const paramVault = [
    admin.address,
    operator.address,
    escrow.address
  ]

  const vault = await appDeploy(admin, 'Vault', paramVault);

  // config connection
  await escrow.connect(operator).updateVault(vault.address);

  return {
    vault, escrow, nft, 
    nftParam : paramERC721Template, 
    testUser
  }
}

module.exports = {
    getJson,
    makeMerkle,
    deploy,
    appDeploy,
    signer, 
    mockDeploy,
    gasCalculate
}


