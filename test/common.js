const {
  time, 
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
  
const fs = require('fs');
const keccak256 = require('keccak256')
const { MerkleTree } = require('merkletreejs')

async function player() {
  const json = JSON.parse(fs.readFileSync('./test/player.json', { encoding: 'utf8' }))
  if (typeof json !== 'object') throw new Error('Invalid JSON')
  return Object.entries(json);
}

async function initUsers() {
  const [owner, admin, operator, bob, sam, tom ]  = await ethers.getSigners(); 
  return { owner, admin, operator, bob, sam, tom };
}

async function deployERC721Template() {
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

  // construct nft
  let config = {
    name : "name",
    symbol : 'symbol',
    prefixURI : 'https://ipfs.io/ipfs/',
    min : 101,
    max : 199 
  }
  
  const { admin, operator } = await initUsers();

  const ERC721Template = await ethers.getContractFactory("ERC721Template");
  const nft = await ERC721Template.deploy (
    true,
    admin.address, 
    operator.address, 
    root, 
    config.name, 
    config.symbol, 
    config.prefixURI,
    config.min,
    config.max
  );
  let user = {
    user : testUser[0],
    tokenID : testUser[1] + 100,
    proof
  };
  return { nft, config, user };
}

async function deployEscrow() {
  const { admin, operator } = await initUsers();
  const { nft, config, user} = await deployERC721Template();
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy (
    admin.address,
    operator.address,
    nft.address
  );
  return { escrow, nft, config, user };
}

async function deployVault() {
  const { admin, operator } = await initUsers();
  const { escrow, nft, config, user } = await deployEscrow();
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy (
    admin.address,
    operator.address,
    escrow.address
  );

  await escrow.connect(operator).updateVault(vault.address);

  return { vault, escrow, nft, config, user };
}

module.exports = {
    deployERC721Template,
    deployEscrow,
    deployVault,
    initUsers
}

