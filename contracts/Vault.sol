// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract Vault is
    Pausable,
    AccessControl,
    ERC721Holder
{
    using Address for address;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE");

    modifier onlyEOA(address to) {
        _onlyEOA(to);
        _;
    }

    function _onlyEOA(address to) view internal {
        require(!to.isContract(), "Only EOA can receive nft.");
    }

    constructor (
        address admin,
        address operator,
        address withdraw
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, operator);
        _grantRole(WITHDRAW_ROLE, withdraw);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function withdrawERC721(address nft, address to, uint256 tokenID) external onlyRole(WITHDRAW_ROLE) onlyEOA(to) whenNotPaused() {
        IERC721(nft).safeTransferFrom(address(this), to, tokenID);
    }
    
    function batchWithdrawERC721(address nft, address[] calldata to, uint256[] calldata tokenID) external onlyRole(WITHDRAW_ROLE) whenNotPaused() {
        
        require(tokenID.length == to.length, "Array length must equal. ");

        for (uint256 i = 0; i < tokenID.length; i++) {
            _onlyEOA(to[i]);
            IERC721(nft).safeTransferFrom(address(this), to[i], tokenID[i]);
        }
    }
}