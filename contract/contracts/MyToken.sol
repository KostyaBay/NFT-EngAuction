// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {

    address public addOwner;

    constructor(address initialOwner)
    ERC721("DuckToken", "DCK")
    Ownable(initialOwner)
    {
        addOwner = initialOwner;
    }

    function safeMint(address to, uint256 tokenId, string memory uri)
    public
    onlyOwner
    {
        require(tokenId <= 3, "Token ID must be 3");
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function getBalance(address owner) public view returns (uint256) {
        return ERC721.balanceOf(owner);
    }

    function getOwner(uint256 tokenId) public view returns (address) {
        return ERC721.ownerOf(tokenId);
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function setApprovalForAll(address operator, bool approved)
    public
    override(ERC721, IERC721)
    {
        _setApprovalForAll(addOwner, operator, approved);
    }
}
