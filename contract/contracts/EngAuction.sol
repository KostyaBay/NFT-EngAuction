// SPDX-License_Identifier: MIT
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@solarity/solidity-lib/libs/data-structures/SparseMerkleTree.sol";
import {PoseidonSMT} from "./PoseidonSMT.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {TypeCaster} from "@solarity/solidity-lib/libs/utils/TypeCaster.sol";
import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

contract EngAuction is PoseidonSMT, Initializable{

    using TypeCaster for *; // TypeCaster library for type conversions.
    using VerifierHelper for address; // VerifierHelper library for zk-SNARK proof verification.

    struct NFT {
        address addressNFT;
        uint256 tokenID;
    }

    NFT public nft;

    struct Auction {
        address addressAu;
        bool status;
        uint256 depAmount;
    }

    Auction public auction;

    // constructor which set the starting parameters of auction
    constructor() {
        auction = Auction(address(this), false, 0);
    }

    event Launch();
    event Deposit();
    event Bid(uint256 maxBid, bytes32 maxNullifier);
    event Withdraw(uint maxBid, bytes32 maxNullifier);

    uint256 public endAt;
    uint256 public maxBid;
    bytes32 public maxNullifier;

    function setAddressNFT(
        address _addressNFT,
        uint256 _tokenId
    ) public {
        nft = NFT(_addressNFT, _tokenId);
    }

    function getAddressNFT(
    ) public view returns (address, uint256) { 
        return (nft.addressNFT, nft.tokenID); 
    }

    function getAuctionInfo(
    ) public view returns (address, bool, uint256, uint256) { 
        return (auction.addressAu, auction.status, auction.depAmount, endAt); 
    }

    //the required number of participants
    uint256 public participantAmount = 0;
    //the current number of participants
    uint256 public currentPAmount = 0;

    // seller can start the auction
    function launchAuction(
        uint256 _depAmount, 
        uint256 _timestamp, 
        address _owner,
        uint256 _participantAmount
        ) payable external initializer(){

        require(msg.sender == _owner, "Only owner of NFT can to launch auction!");
        require(_timestamp >= block.timestamp + 5 minutes, "The duration of the auction should be at least 5 minutes.");

        auction.depAmount = _depAmount;
        auction.status = true; //changes status of auction on open
        participantAmount = _participantAmount;
      
        IERC721(nft.addressNFT).setApprovalForAll(auction.addressAu, true); //grants the ability to transfer the ownership of NFT
        IERC721(nft.addressNFT).transferFrom(_owner, auction.addressAu, nft.tokenID); //transfers the ownership of NFT from owner to contract
        endAt = block.timestamp + _timestamp;

        __PoseidonSMT_init(80);

        emit Launch();
    }

    // map of commitments for checking restriction that 1 deposit with the particular 1 commitment
    mapping(bytes32 => bool) public lockedDep; 
    // map of nullifierHashes for solution double spending problem
    mapping(bytes32 => bool) public emptyDep;
    /// Mapping to track roots and validate their existence
    mapping(bytes32 => bool) public rootsHistory;

    function deposit (
        bytes32 _commitment
        ) payable external {

        require(auction.status, "Auction is unavailable.");
        require(block.timestamp < endAt, "Auction not launched!");
        require(!lockedDep[_commitment], "Only 1 locked deposit with the particular 1 commitment.");
        require(msg.value == auction.depAmount, "Only a fixed deposit amount.");
        require(participantAmount > currentPAmount, "The required number of participants has been recruited");

        _add(_commitment);
        currentPAmount++;
        lockedDep[_commitment] = true;

        rootsHistory[getRoot()] = true;

        emit Deposit();
    }

    function isRootExists(
        bytes32 root
        ) internal view returns (bool) {
        return rootsHistory[root];
    }

    function placeBid(
        address _address,
        uint256 _bid,
        bytes32 _nullifierHash,
        bytes32 _mtRoot,
        address voteVerifier,
        VerifierHelper.ProofPoints memory proof_
        ) external{

        require(auction.status, "Auction is unavailable.");
        require(block.timestamp < endAt || endAt == 0, "Ended!");
        require(!(_bid > auction.depAmount), "Insufficicent balance.");
        require(!(maxBid >= _bid), "Your bid must be more than the current top bid.");
        require(!emptyDep[_nullifierHash], "Your deposit is empty!");
        require(participantAmount == currentPAmount, "Not enough participants");

        require(
            voteVerifier.verifyProofSafe(
                [
                    uint256(_nullifierHash),
                    uint256(_mtRoot),
                    uint256(_bid),
                    uint256(uint160(_address))
                ].asDynamic(),
                proof_,
                4
            ),
            "Bidding: Invalid bid proof"
        );

        maxBid = _bid;
        maxNullifier = _nullifierHash;

        // finish bidding if the bid = entire fixed deposit amount (solution for strike price problem)
        if(maxBid == auction.depAmount) {
            endAt = 0;
            auction.status = false;
        }

        // add time if placing the bid in last minute (solution for last bid problem)
        if(endAt < 1 minutes) {
            endAt += 1 minutes;
        }

        emit Bid(maxBid, maxNullifier);
    }

    function withdrawDep (
        address _address,
        address payable _addressP,
        bytes32 _nullifierHash,
        bytes32 _mtRoot,
        uint256 _bid,
        address voteVerifier,
        VerifierHelper.ProofPoints memory proof_
        ) payable external{

        // if(endAt == 0) {
        //     auction.status = false; 
        // }

        require(!(_nullifierHash == maxNullifier && auction.status == true), "The auction is ongoing & your bid is a current top bid.");
        require(!emptyDep[_nullifierHash], "Your deposit is empty!"); // "Double spending is prohibited."
        require(isRootExists(_mtRoot), "Your root doesn't exist");
        require(participantAmount == currentPAmount, "Not enough participants");

        require(
            voteVerifier.verifyProofSafe(
                [
                    uint256(_nullifierHash),
                    uint256(_mtRoot),
                    uint256(_bid),
                    uint256(uint160(_address))
                ].asDynamic(),
                proof_,
                4
            ),
            "Withdrawing: Invalid bid proof"
        );

        uint _deposit = auction.depAmount;
        if(_nullifierHash == maxNullifier){
            _deposit -= maxBid;
            IERC721(nft.addressNFT).transferFrom(auction.addressAu, _addressP, nft.tokenID);
        }

        (bool sent, ) = _addressP.call{value: _deposit}("");
        require(sent, "Failed to send Ether");
        emptyDep[_nullifierHash] = true;

        emit Withdraw(maxBid, maxNullifier);
    }

    // * receive function
    receive() external payable {}
}