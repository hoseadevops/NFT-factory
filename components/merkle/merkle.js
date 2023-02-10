
const keccak256 = require('keccak256')
const { MerkleTree } = require('merkletreejs')

const { getJson } = require('../json.js')

function mockData() {
  return Object.entries(getJson("./components/merkle/data.json")).map((item) => {
    if(!item[2]) item[2] = ""
    return [item[0], item[1]+100, item[2]]
  });
}

// data [ [address, tokenID, uri ], ... ]
async function makeMerkle(data) {
  if (!data) data = mockData()  
  // merkle tree 
  const leaves = data.map(( item, _) => {
    return ethers.utils.solidityKeccak256(['address', 'uint256', 'string'], [item[0],  item[1], item[2]])
  })
  const tree = new MerkleTree(leaves, keccak256, { sort: true })
  const root = tree.getHexRoot()
      
  let testUser = data[10]
  const leaf = leaves[10]
  const proof = tree.getHexProof(leaf)
    
  testUser = {
    sender : testUser[0],
    tokenID : testUser[1],
    url : testUser[2],
    proof,
    leaf
  };
  
  return { root, testUser };
}

  module.exports = {
    mockData,
    makeMerkle
  }