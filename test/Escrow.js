const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  
  const { deployERC721Template } = require('./common.js')

  describe("Escrow", function () {

    async function deployEscrow() {
        const [owner, admin, operator, bob, sam, tom] = await ethers.getSigners();
    
        const Escrow = await ethers.getContractFactory("Escrow");
        const escrow = await Escrow.deploy (
          admin.address,
          operator.address,
          deployERC721Template.nft.address
        );
        
        return { escrow, deployERC721Template, bob, admin, operator };
      }

  });