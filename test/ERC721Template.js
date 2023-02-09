const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { mockDeploy, initUsers } = require('../components/common.js')

describe("ERC721Template", function () {
  
  async function getMaxTokenID(nft) {
    let maxTokenID = await nft.maxTokenID();
    console.log("        ✔", { maxTokenID : ethers.BigNumber.from(maxTokenID).toString() });
    return maxTokenID;
  }

  describe("get", function () {
    describe("get some states", function () {

      it("BaseURI should get ipfs url", async function() {
        const { nft, config } = await loadFixture(mockDeploy);
        expect(await nft.baseURI()).to.be.eq(config.prefixURI);
      });    
    });
  });

  describe("mint", function () {
    describe("user mint", function () {

      it("Should mint token by merkle tree.", async function () {
        const { nft, user } = await loadFixture(mockDeploy);

        const { bob } = await initUsers();
 
        await nft.connect(bob).merkleMint(user.user, user.tokenID, "", user.proof);

        await expect(nft.connect(bob).merkleMint(user.user, user.tokenID, "", user.proof)).to.be.revertedWith("Only Once");

        await expect(nft.connect(bob).merkleMint(user.user, 222, "", user.proof)).to.be.revertedWith("Not Reserved");

        expect(await nft.ownerOf(user.tokenID)).to.be.eq(user.user);
        await getMaxTokenID(nft);
      });


      it("Should mint token by self.", async function () {
        const { nft } = await loadFixture(mockDeploy);
        
        const { bob } = await initUsers();

        await nft.connect(bob).selfMint("")
        let tokenID = await getMaxTokenID(nft);
        expect(await nft.ownerOf(tokenID)).to.be.eq(bob.address);

        await nft.connect(bob).selfMint("")
        tokenID = await getMaxTokenID(nft);
        expect(await nft.ownerOf(tokenID)).to.be.eq(bob.address);

        await nft.connect(bob).selfMint("")
        tokenID = await getMaxTokenID(nft);
        expect(await nft.ownerOf(tokenID)).to.be.eq(bob.address);

      });


      it("Should mint token by owner.", async function () {
        const { nft } = await loadFixture(mockDeploy);
        let tokenID  = 102; // 101 ~ 199
        
        const {operator, sam} = await initUsers();
        await nft.connect(operator).ownerMint(sam.address, tokenID, "");

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
