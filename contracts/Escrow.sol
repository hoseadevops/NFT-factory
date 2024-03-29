// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import './interfaces/IVault.sol';

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Escrow is 
    Pausable,
    AccessControl,
    IERC721Receiver
{
    using Address for address;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IERC721 public nft;
    IVault public vault;

    // user => tokenID
    mapping(address => uint256 ) public ledger;

    event Deposit(address indexed sender, address indexed from, uint256 tokenID);
    event Withdraw(address indexed sender, address indexed to, uint256 tokenID);

    modifier onlyNFT(address token) {
        require(token.isContract(), "Only CA");
        require(token == address(nft), "nonSupport");
        _;
    }

    modifier whenNotHold(address from) {
        require(ledger[from] == 0, "Already holding");
        _;
    }

    modifier onlyOwner(address from, uint256 tokenID) {
        _onlyOwner(from, tokenID);
        _;
    }

    function _onlyOwner(address from, uint256 tokenID) internal view {
        require(ledger[from] != 0 && ledger[from] == tokenID, "Only Owner");
    }

    constructor(
        address admin,
        address operator,
        IERC721 token
    ) {
        nft = token;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
    }

    function updateVault(IVault pool) external onlyRole(OPERATOR_ROLE) {
        vault = pool;
    }

    function pause() public onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    function deposit(uint256 tokenID) external whenNotPaused() whenNotHold(msg.sender) {
        require(tokenID > 0, "tokenID can not be zero");
        recordLedger(msg.sender, tokenID);
        IERC721(nft).safeTransferFrom(msg.sender, address(vault), tokenID);
        emit Deposit(msg.sender, msg.sender, tokenID);
    }

    function withdraw(uint256 tokenID) external whenNotPaused() onlyOwner(msg.sender, tokenID) {
        recordLedger(msg.sender, 0);
        IVault(vault).withdrawERC721(address(nft), msg.sender, tokenID);
        emit Withdraw(msg.sender, msg.sender, tokenID);
    }

    function onERC721Received (
        address sender,
        address from,
        uint256 tokenID,
        bytes memory
    ) public virtual override whenNotPaused() onlyNFT(msg.sender) whenNotHold(from) returns (bytes4) {
        require(tokenID > 0, "tokenID can not be zero");
        recordLedger(from, tokenID);
        IERC721(nft).safeTransferFrom(address(this), address(vault), tokenID);
        emit Deposit(sender, from, tokenID);
        return this.onERC721Received.selector;
    }

    function recordLedger(address owner, uint256 tokenID) internal {
        ledger[owner] = tokenID;
    }

    function EmergencyWithdrawVault (
        address[] calldata to,
        uint256[] calldata tokenID
    ) onlyRole(DEFAULT_ADMIN_ROLE) external {
        
        require(tokenID.length == to.length, "Array length must equal. ");

        for( uint256 i = 0; i < tokenID.length; i++ ) {
            _onlyOwner(to[i], tokenID[i]);
            recordLedger(to[i], 0);
            emit Withdraw(msg.sender, to[i], tokenID[i]);
        }

        IVault(vault).batchWithdrawERC721(address(nft), to, tokenID);
    }

    function EmergencyWithdraw (
        address token,
        address to,
        uint256[] calldata tokenID
    ) onlyRole(DEFAULT_ADMIN_ROLE) external {
        for (uint256 i = 0; i < tokenID.length; i++) {
            IERC721(token).safeTransferFrom(address(this), to, tokenID[i]);
        }
    }
}