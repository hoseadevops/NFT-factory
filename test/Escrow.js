const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
  
const { mockDeploy, signer } = require('../components/app.js')

describe("Escrow", function () {

  describe("deposit to vault, and withdraw", function () {  

    it("Should deposit to vault.", async function () {
      const { vault, escrow, nft } = await loadFixture(mockDeploy);
      const { bob, sam } = await signer();

      await expect(nft.connect(bob).selfMint()).not.to.be.reverted;
      let tokenID1 = await nft.maxTokenID();

      await expect(nft.connect(bob).selfMint()).not.to.be.reverted;
      let tokenID2 = await nft.maxTokenID();


      expect(await nft.ownerOf(tokenID1)).to.be.eq(bob.address);
      expect(await nft.ownerOf(tokenID2)).to.be.eq(bob.address);
        
      await expect(nft.connect(bob)["safeTransferFrom(address,address,uint256)"](bob.address, escrow.address, tokenID1)).not.to.be.reverted;
      await expect(nft.connect(bob)["safeTransferFrom(address,address,uint256)"](bob.address, escrow.address, tokenID2)).to.be.revertedWith("Already holding");

      expect(await nft.ownerOf(tokenID1)).to.be.eq(vault.address);
      expect(await nft.ownerOf(tokenID2)).to.be.eq(bob.address);

      await expect(escrow.connect(sam).withdraw(tokenID1)).to.be.revertedWith("Only Owner");

      await expect(escrow.connect(bob).withdraw(tokenID1)).to.be.emit(escrow, 'Withdraw');
      expect(await nft.ownerOf(tokenID1)).to.be.eq(bob.address);

      await expect(nft.connect(bob)["safeTransferFrom(address,address,uint256)"](bob.address, escrow.address, tokenID2)).not.to.be.reverted;
      expect(await nft.ownerOf(tokenID2)).to.be.eq(vault.address);
    });


  });
});