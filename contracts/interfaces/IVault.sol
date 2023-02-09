// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IVault {
    
    function withdrawERC721(address nft, address to, uint256 tokenId) external;
    
    function batchWithdrawERC721(address nft, address[] calldata to, uint256[] calldata tokenIds) external;
}