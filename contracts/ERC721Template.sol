// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

error InvalidProof();

contract ERC721Template is 
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Pausable,
    AccessControl
{
    
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bool public isCanClaim;

    string public baseURI;

    uint256 public maxTokenID;

    bytes32 public merkleRoot;

    // include boundary (uninterrupted tokenID)
    uint256 public merkleReservedMinTokenID;
    uint256 public merkleReservedMaxTokenID;

    function isReservedTokenID(uint256 tokenID) internal view returns(bool) {
        return (tokenID >= merkleReservedMinTokenID && tokenID <= merkleReservedMaxTokenID);
    }

    modifier whenReserved(uint256 tokenID) {
        require(isReservedTokenID(tokenID), "Not Reserved");
        _;
    }

    function updateMaxTokenID(uint256 tokenID) internal {
        if(!isReservedTokenID(tokenID) && tokenID > maxTokenID)
            maxTokenID = tokenID;
    }

    mapping( address => bool ) public reserved;

    constructor (
        bool claim,
        address admin,
        address operator,
        bytes32 merkleTreeRoot,
        string memory name,
        string memory symbol,
        string memory prefixURI,
        uint256 reservedMinTokenID,
        uint256 reservedMaxTokenID
    ) ERC721(name, symbol) {
        baseURI = prefixURI;
        isCanClaim = claim;
        merkleRoot = merkleTreeRoot;
        merkleReservedMinTokenID = reservedMinTokenID;
        merkleReservedMaxTokenID = reservedMaxTokenID;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, operator);
        _grantRole(MINTER_ROLE, operator);
    }

    modifier onlyClaimable(){
        require(isCanClaim, "Only Claimable");
         _;     
    }

    modifier onlyOnce(address to) {
        require(!reserved[to], "Only Once");
         _;
    }

    function updateBaseURI ( string memory prefixURI ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = prefixURI;
    }
    function updateIsCanClaim(bool claim ) external onlyRole(PAUSER_ROLE) {
        isCanClaim = claim;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // merkle mint（tokenID of reserved）
    // Owner can mint tokenID of reserved
    function merkleMint (
        address to, 
        uint256 tokenID, 
        string memory uri, 
        bytes32[] calldata merkleProof
    ) external whenNotPaused() whenReserved(tokenID) onlyOnce(to) onlyClaimable() {
        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(to, tokenID, uri));
        if (!MerkleProof.verify(merkleProof, merkleRoot, node)) revert InvalidProof();
        // mint
        reserved[to] = true;
        _safeMint(to, tokenID);
        _setTokenURI(tokenID, uri);
    }

    // self mint
    function selfMint (
        string memory uri
    ) external whenNotPaused() onlyClaimable() {
        uint256 tokenID = maxTokenID + 1;
        if(isReservedTokenID(tokenID)) {
            tokenID = merkleReservedMaxTokenID + 1;
        }
         _safeMint(msg.sender, tokenID);
        _setTokenURI(tokenID, uri);
    }

    // (MINTER_ROLE) mint
    // Owner can mint any tokenID of unused（It could be to the TokenID of reserved
    function ownerMint (
        address to, 
        uint256 tokenID, 
        string memory uri
    ) external whenNotPaused() onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenID);
        _setTokenURI(tokenID, uri);
    }

    // (MINTER_ROLE) mint（batch）
    function ownerBatchMint (
        address to, 
        uint256[] calldata TokenIDs, 
        string[] memory uris
    ) external whenNotPaused() onlyRole(MINTER_ROLE) {
        require(TokenIDs.length == uris.length, "Array length must equal. ");
        
        for (uint256 i = 0; i < TokenIDs.length; i++) {
            _safeMint(to, TokenIDs[i]);
            _setTokenURI(TokenIDs[i], uris[i]);
        }
    }

    function _beforeTokenTransfer (
        address from, 
        address to, 
        uint256 tokenID, 
        uint256 batchSize
    ) internal whenNotPaused override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenID, batchSize);
    }

    function _afterTokenTransfer (
        address from, 
        address to, 
        uint256 firstTokenID, 
        uint256 batchSize
    ) internal virtual override(ERC721) {
        // minting
        if( from == address(0)) {
            updateMaxTokenID(firstTokenID);
        }
        super._afterTokenTransfer(from, to, firstTokenID, batchSize);
    }

    // The following functions are overrides required by Solidity.
    function _burn (
        uint256 tokenID
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenID);
    }

    function tokenURI (
        uint256 tokenID
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenID);
    }

    function supportsInterface (
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
