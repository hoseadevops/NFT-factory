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
  const [owner, admin, operator, bob, sam, tom] = await ethers.getSigners();

  const ERC721Template = await ethers.getContractFactory("ERC721Template");
  const nft = await ERC721Template.deploy (
    admin.address, 
    operator.address, 
    root, 
    config.name, 
    config.symbol, 
    config.prefixURI,
    config.min,
    config.max
  );  
  return { nft, config, proof, testUser, bob, operator, sam, tom, root, owner, admin};
}

module.exports = { 
    deployERC721Template 
}

