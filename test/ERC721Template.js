const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const fs = require('fs');
const keccak256 = require('keccak256')
const { MerkleTree } = require('merkletreejs')

describe("ERC721Template", function () {
  
  async function player() {
    const json = JSON.parse(fs.readFileSync('./test/player.json', { encoding: 'utf8' }))
    if (typeof json !== 'object') throw new Error('Invalid JSON')
    return Object.entries(json);
  }

  async function getMaxTokenID(nft) {
    let maxTokenID = await nft.maxTokenID();
    console.log("        ✔", { tokenID : ethers.BigNumber.from(maxTokenID).toString() });
    return maxTokenID;
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

  describe("get", function () {
    describe("get some states", function () {

      it("BaseURI should get ipfs url", async function() {
        const { nft, config } = await loadFixture(deployERC721Template);
        expect(await nft.baseURI()).to.be.eq(config.prefixURI);
      });    
    });
  });

  describe("mint", function () {
    describe("user mint", function () {
      it("Should mint token by merkle tree.", async function () {
        const { nft, config, proof, testUser, bob } = await loadFixture(deployERC721Template);

        let test = {
          user : testUser[0],
          tokenID : testUser[1] + 100,
          proof
        };
        await nft.connect(bob).merkleMint(
          test.user,
          test.tokenID,
          "",
          test.proof
        )
        expect(await nft.ownerOf(test.tokenID)).to.be.eq(test.user);

        await getMaxTokenID(nft);
      });

      it("Should mint token by merkle self.", async function () {
        const { nft, config, proof, testUser, bob } = await loadFixture(deployERC721Template);
        await nft.connect(bob).selfMint("")
      
        let tokenID = await getMaxTokenID(nft);

        expect(await nft.ownerOf(tokenID)).to.be.eq(bob.address);
      });

      it("Should mint token by merkle owner.", async function () {
        const { nft, config, proof, testUser, bob, operator, sam} = await loadFixture(deployERC721Template);
        let tokenID  = 102;
        await expect(nft.connect(operator).ownerMint(sam.address, tokenID, "")).to.be.revertedWith("Reserved");
      
        tokenID  = 88;
        await nft.connect(operator).ownerMint(sam.address, tokenID, "");
        expect(await nft.ownerOf(tokenID)).to.be.eq(sam.address);

        await getMaxTokenID(nft);

        tokenID  = 250;
        await nft.connect(operator).ownerMint(sam.address, tokenID, "");
        expect(await nft.ownerOf(tokenID)).to.be.eq(sam.address);
        await getMaxTokenID(nft);
      });

    });
  });


});
