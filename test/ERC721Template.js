const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { signer, makeMerkle, appDeploy } = require('../components/app.js')

describe("ERC721Template", function () {
  
  async function mock() {
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
    const nft = await appDeploy(admin, "ERC721Template", paramERC721Template);

    return { nft,  nftParam : paramERC721Template, testUser }
  }
  
  async function getMaxTokenID(nft) {
    let maxTokenID = await nft.maxTokenID();
    console.log("        ✔", { maxTokenID : ethers.BigNumber.from(maxTokenID).toString() });
    return maxTokenID;
  }

  describe("get", function () {
    describe("get some states", function () {
      it("BaseURI should get ipfs url", async function() {
        const { nft, nftParam } = await loadFixture(mock);
        expect(await nft.baseURI()).to.be.eq(nftParam[6]);
      });
    });
  });

  describe("mint", function () {
    describe("user mint", function () {

      it("Should mint token by merkle tree.", async function () {
        const { nft, testUser } = await loadFixture(mock);

        const { bob } = await signer();
 
        await nft.connect(bob).merkleMint(testUser.sender, testUser.tokenID, "", testUser.proof);

        await expect(nft.connect(bob).merkleMint(testUser.sender, testUser.tokenID, "", testUser.proof)).to.be.revertedWith("Only Once");

        await expect(nft.connect(bob).merkleMint(testUser.sender, 222, "", testUser.proof)).to.be.revertedWith("Not Reserved");

        expect(await nft.ownerOf(testUser.tokenID)).to.be.eq(testUser.sender);
        await getMaxTokenID(nft);
      });


      it("Should mint token by self.", async function () {
        const { nft } = await loadFixture(mock);
        
        const { bob } = await signer();

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
        const { nft } = await loadFixture(mock);
        let tokenID  = 102; // 101 ~ 199
        
        const {operator, sam} = await signer();
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
