const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { deployERC721Template } = require('./common.js')

describe("ERC721Template", function () {
  
  async function getMaxTokenID(nft) {
    let maxTokenID = await nft.maxTokenID();
    console.log("        ✔", { maxTokenID : ethers.BigNumber.from(maxTokenID).toString() });
    return maxTokenID;
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

      it("Should mint token by self.", async function () {
        const { nft, config, proof, testUser, bob } = await loadFixture(deployERC721Template);
        await nft.connect(bob).selfMint("")
        let tokenID = await getMaxTokenID(nft);
        expect(await nft.ownerOf(tokenID)).to.be.eq(bob.address);
        await getMaxTokenID(nft);
      });

      it("Should mint token by owner.", async function () {
        const { nft, config, proof, testUser, bob, operator, sam} = await loadFixture(deployERC721Template);
        let tokenID  = 102; // 101 ~ 199
        await expect(nft.connect(operator).ownerMint(sam.address, tokenID, "")).to.be.revertedWith("Reserved");
      
        tokenID  = 88;
        await nft.connect(operator).ownerMint(sam.address, tokenID, "");
        expect(await nft.ownerOf(tokenID)).to.be.eq(sam.address);
        await getMaxTokenID(nft);

        tokenID  = 250;
        await nft.connect(operator).ownerMint(sam.address, tokenID, "");
        expect(await nft.ownerOf(tokenID)).to.be.eq(sam.address);
        await getMaxTokenID(nft);

        tokenID  = [300, 322, 388];
        await nft.connect(operator).ownerBatchMint(sam.address, tokenID, ["", "", ""]);
        expect(await nft.ownerOf(tokenID[2])).to.be.eq(sam.address);
        await getMaxTokenID(nft);
      });

    });
  });


});
