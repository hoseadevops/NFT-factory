const {
  time, 
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
  
const fs = require('fs');
const keccak256 = require('keccak256')
const { MerkleTree } = require('merkletreejs')

function getJson(fileDir) {
  const json = JSON.parse(fs.readFileSync(fileDir, { encoding: 'utf8' }))
  if (typeof json !== 'object') throw new Error('Invalid JSON')
  return json
}

async function player() {
  return Object.entries(getJson("./components/player.json"));
}

async function initUsers() {
  const [admin, operator, bob, sam ]  = await ethers.getSigners(); 
  return { admin, operator, bob, sam }; 
}

async function mockMerkle() {
  // mock player
  let players = await player();   
    
  // merkle tree 
  const leaves = players.map(( player, _) => {
    // to  tokenID(101 ~ 199)   uri
    return ethers.utils.solidityKeccak256(['address', 'uint256', 'string'], [player[0],  player[1]+100, ""]);
  })
  const tree = new MerkleTree(leaves, keccak256, { sort: true })
  const root = tree.getHexRoot()
    
  let testUser = players[10];
  const leaf = ethers.utils.solidityKeccak256(['address', 'uint256', 'string'], [testUser[0], testUser[1]+100, ""]);
  const proof = tree.getHexProof(leaf)
  
  let user = {
    user : testUser[0],
    tokenID : testUser[1] + 100,
    proof
  };

  return { root, user };
}

async function deployERC721Template(admin, operator, root) {

  // construct nft
  let config = {
    name : "name",
    symbol : 'symbol',
    prefixURI : 'https://ipfs.io/ipfs/',
    min : 101,
    max : 199,
    root,
    isClaimable : true
  }

  const ERC721Template = await ethers.getContractFactory("ERC721Template");
  const nft = await ERC721Template.connect(admin).deploy (
    config.isClaimable,
    admin.address, 
    operator.address, 
    config.root,
    config.name, 
    config.symbol, 
    config.prefixURI,
    config.min,
    config.max
  );

  return { nft, config };
}

async function deployEscrow(admin, operator, nft) {
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy (
    admin.address,
    operator.address,
    nft.address
  );
  return { escrow, nft };
}

async function deployVault(admin, operator, escrow) {
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy (
    admin.address,
    operator.address,
    escrow.address
  );

  return { vault, escrow };
}

async function mockDeploy() {
  const { owner, admin, operator, bob, sam, tom } = await initUsers();
  const { root, user } = await mockMerkle();
  const { nft, config } = await deployERC721Template(admin, operator, root);
  const { escrow } = await deployEscrow(admin, operator, nft);
  const { vault } = await deployVault(admin, operator, escrow);

  await escrow.connect(operator).updateVault(vault.address);

  return { vault, escrow, nft, config, user } 
}



module.exports = {
    getJson,
    mockMerkle,
    deployERC721Template,
    deployEscrow,
    deployVault,
    initUsers, 
    mockDeploy
}


