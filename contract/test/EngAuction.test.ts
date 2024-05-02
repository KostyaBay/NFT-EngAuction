import { expect } from "chai";
import { ethers } from "hardhat";
import { AddressLike, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { poseidonHash, getPoseidon } from "./helpers/poseidon-hash";
import { VerifierHelper } from "../generated-types/contracts/EngAuction";
import { SecretPair, generateSecrets, getCommitment, getZKP } from "./helpers/zkp-helper";
import { EngAuction, MyToken, Groth16Verifier } from "../generated-types";

describe("Deployment", function () {
  //global vars
  let EngAuction, MyToken, BidVerifier;
  let engAuction: EngAuction;
  let myToken: MyToken;
  let bidVerifier: Groth16Verifier;
  let G16V_add: AddressLike;
  let owner: Signer, addr1: Signer, addr2: Signer;
  let pair: SecretPair, commitment: string, nullifierHash: string, root: string;
  let zkProof: { formattedProof: VerifierHelper.ProofPointsStruct; nullifierHash: string };
  let pair2: SecretPair, commitment2: string, nullifierHash2: string, root2: string;
  let zkProof2: { formattedProof: VerifierHelper.ProofPointsStruct; nullifierHash: string };
  let OWNER_add: string, ADDR1_add: string, ADDR2_add: string;

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
  
    OWNER_add = await owner.getAddress();
    ADDR1_add = await addr1.getAddress();
    ADDR2_add = await addr2.getAddress();
  
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy(OWNER_add);
    console.log("Contract deployed by:", OWNER_add);
    console.log("Token deployed: ", await myToken.getAddress());

    await myToken.safeMint(OWNER_add, 1, "https://myduck/metadata/");
    await myToken.setApprovalForAll(OWNER_add, true);

    EngAuction = await ethers.getContractFactory("EngAuction"
    , {
       libraries: {
           PoseidonUnit1L: await (await getPoseidon(1)).getAddress(),
           PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
           PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
           }
       }
      );
    engAuction = await EngAuction.deploy();
    
    BidVerifier = await ethers.getContractFactory("Groth16Verifier");
    bidVerifier = await BidVerifier.deploy();
    console.log("Contract G16V deployed by:", OWNER_add);
    G16V_add = await bidVerifier.getAddress();
    console.log("G16V_add: ", G16V_add);

  });

    it("Should set the right data of NFT token", async function () {
        const nftAddress = await myToken.getAddress(); // Set your NFT address here
        const tokenId = 1; // Set your NFT token ID here

        console.log("nftAdd: "+nftAddress);
        
        await engAuction.setAddressNFT(nftAddress, tokenId);
        
        const result = await engAuction.getAddressNFT();
        const addressNFT = result[0];
        const tokenID = result[1];

        console.log("addNFT: "+addressNFT);
        expect(addressNFT).to.equal(nftAddress);
        expect(tokenID).to.equal(tokenId);
    });

   it("Check token contract before", async function () {
     expect(await myToken.tokenURI(1)).to.equal("https://myduck/metadata/");
     console.log("uri ", await myToken.tokenURI(1));
     expect(await myToken.ownerOf(1)).to.equal(OWNER_add);
     console.log("ownerOf ", await myToken.ownerOf(1));
   });

  it("Should launch the auction by the addr1 - error", async function () {

      const depAmount = "50"; // Set your desired deposit amount here
      const ethDepAm = ethers.parseEther(depAmount);
      const auctionDuration = 10 * 60; // 5 minutes
      const participantAmount = "2";

      await expect(engAuction.connect(addr1).launchAuction(ethDepAm, (await time.latest()) + auctionDuration, OWNER_add, participantAmount)
    ).to.be.revertedWith("Only owner of NFT can to launch auction!");
    });

    it("Should launch the auction by the owner", async function () {

        const depAmount = "50"; // Set your desired deposit amount here
        const ethDepAm = ethers.parseEther(depAmount);
        const auctionDuration = 10 * 60; // 5 minutes
        const participantAmount = "2";

        // console.log("--token address: "+ await myToken.getAddress());
        await engAuction.setAddressNFT(await myToken.getAddress(), 1);

        await engAuction.launchAuction(ethDepAm, (await time.latest()) + auctionDuration, OWNER_add, participantAmount);

        const result = await engAuction.getAuctionInfo();
        const addressAu = result[0];
        const statusAu = result[1];
        const depAmountAu = result[2]; 
        const endAtAu = result[3];

        // console.log("Timestamp: "+(await time.latest() + auctionDuration));

        // Assert auction status
        expect(statusAu).to.be.true;

        // Assert deposit amount
        expect(depAmountAu).to.equal(ethDepAm);

        // // Assert endAt timestamp
        // const expectedEndAt = (await time.latest()) + auctionDuration;
        // console.log("Time lat: " + (await time.latest()));
        // console.log("Time af: "+expectedEndAt);
        // expect(endAtAu).to.equal(expectedEndAt);
    });

    it("Should lock the deposit, owner!", async function () {

      const deposit = "50";
      const depositEth = ethers.parseEther(deposit); // Set the deposit amount in ether

      console.log("deposit: "+depositEth);
      pair = generateSecrets();
      console.log("pair1.1: ", pair.secret, "pair1.2: ", pair.nullifier);
      commitment = getCommitment(pair);
      console.log("com: ", commitment);
  
      const oldBalance = await ethers.provider.getBalance(OWNER_add);
      console.log("Old balance of owner's money: " + oldBalance);

      // Perform deposit
      await expect(engAuction.connect(owner).deposit(commitment, { value: depositEth }))
        .to.emit(engAuction, "Deposit")
        .withArgs();

      const newBalance = await ethers.provider.getBalance(OWNER_add);
      // console.log("New balance of owner's money: " + newBalance);

      // Assert that the deposit was successful
      const isDepositLocked = await engAuction.lockedDep(commitment);
      expect(isDepositLocked).to.be.true;
    });

    it("Should lock the deposit, address1!", async function () {

      const deposit = "50";
      const depositEth = ethers.parseEther(deposit); // Set the deposit amount in ether

      console.log("deposit: "+depositEth);
      pair2 = generateSecrets();
      console.log("pair2.1: ", pair2.secret, "pair2.2: ", pair2.nullifier);
      commitment2 = getCommitment(pair2);
      console.log("com2: ", commitment2);

      // Perform deposit
      await expect(engAuction.connect(addr1).deposit(commitment2, { value: depositEth }))
          .to.emit(engAuction, "Deposit")
          .withArgs();

      root2 = (await engAuction.connect(addr1).getRoot()).toString();
      console.log("root of add1: "+root2);

      // Assert that the deposit was successful
      const isDepositLocked = await engAuction.lockedDep(commitment2);
      expect(isDepositLocked).to.be.true;
    });

    it("Should place a bid, owner!", async function () {

      const bid = "5";
      const ethBid = ethers.parseEther(bid);
      console.log(commitment);
      const key = poseidonHash(commitment);
      const onchainProof = await engAuction.connect(owner).getProof(key);

      // console.log("onchain ", onchainProof);
      console.log("Proof\npair: ", pair);
      console.log("root: ", root);
      console.log("ownerAdd: ", OWNER_add);
      // console.log("siblings: ", onchainProof.siblings);

      root = (await engAuction.connect(owner).getRoot()).toString();
      console.log("root of owner: "+root);

      zkProof = await getZKP(
          pair,
          root,
          ethBid.toString(),
          OWNER_add,
          onchainProof.siblings
      );

      // console.log("zkProof ", zkProof);

      // console.log("zkProof1: ", zkProof.formattedProof);
      console.log("zkNH: ", zkProof.nullifierHash);
      console.log("root: ", root);
      // console.log("zkProof2: ", zkProof.formattedProof);

      // Perform placing a bid
      await expect(engAuction.connect(owner).placeBid(OWNER_add, ethBid, zkProof.nullifierHash, root, G16V_add, zkProof.formattedProof))
        .to.emit(engAuction, "Bid")
        .withArgs(ethBid, zkProof.nullifierHash);

      console.log("Successfully!");

      // Assert that the bid was placed successfully
      const isBidPlaced = await engAuction.connect(owner).maxBid();
      const isNullifierHashSet = await engAuction.connect(owner).maxNullifier();
      expect(isBidPlaced).to.equal(ethBid);
      expect(isNullifierHashSet).to.equal(zkProof.nullifierHash);
    });

    it("Should place a bid2, owner!", async function () {

      const bid = "10";
      const ethBid = ethers.parseEther(bid);
      const key = poseidonHash(commitment);
      const onchainProof = await engAuction.connect(owner).getProof(key);

      // console.log("onchain ", onchainProof);
      console.log("Proof\npair: ", pair);
      console.log("root: ", root);
      console.log("ownerAdd: ", OWNER_add);
      // console.log("siblings: ", onchainProof.siblings);

      root = (await engAuction.connect(owner).getRoot()).toString();
      console.log("root of owner: "+root);

      zkProof = await getZKP(
          pair,
          root,
          ethBid.toString(),
          OWNER_add,
          onchainProof.siblings
      );

      // console.log("zkProof ", zkProof);

      // Perform placing a bid
      await expect(engAuction.connect(owner).placeBid(OWNER_add, ethBid, zkProof.nullifierHash, root, G16V_add, zkProof.formattedProof))
        .to.emit(engAuction, "Bid")
        .withArgs(ethBid, zkProof.nullifierHash);

      console.log("nullH: "+zkProof.nullifierHash);
      console.log("root of owner: "+root);
      // console.log("proof: "+zkProof);
  
      // Assert that the bid was placed successfully
      const isBidPlaced = await engAuction.connect(owner).maxBid();
      const isNullifierHashSet = await engAuction.connect(owner).maxNullifier();
      expect(isBidPlaced).to.equal(ethBid);
      expect(isNullifierHashSet).to.equal(zkProof.nullifierHash);
    });

    it("Should place a bid, address1!", async function () {

      const bid = "50";
      const ethBid = ethers.parseEther(bid);
      const key = poseidonHash(commitment2);
      const onchainProof = await engAuction.connect(addr1).getProof(key);

      // console.log("onchain ", onchainProof);
      console.log("Proof\npair: ", pair2);
      console.log("root2: ", root2);
      console.log("add1_Add: ", ADDR1_add);
      // console.log("siblings: ", onchainProof.siblings);

      root2 = (await engAuction.connect(addr1).getRoot()).toString();
      console.log("root of addr1: "+root2);

      zkProof2 = await getZKP(
          pair2,
          root2,
          ethBid.toString(),
          ADDR1_add,
          onchainProof.siblings
      );

      // console.log("zkProof2 ", zkProof2);

      console.log("zkNH: ", zkProof2.nullifierHash);
      console.log("root: ", root2);
      // console.log("zkProof22: ", zkProof2.formattedProof);
  
      // Perform placing a bid
      await expect(engAuction.connect(addr1).placeBid(ADDR1_add, ethBid, zkProof2.nullifierHash, root2, G16V_add, zkProof2.formattedProof))
        .to.emit(engAuction, "Bid")
        .withArgs(ethBid, zkProof2.nullifierHash);
  
      // Assert that the bid was placed successfully
      const isBidPlaced = await engAuction.connect(addr1).maxBid();
      const isNullifierHashSet = await engAuction.connect(addr1).maxNullifier();
      expect(isBidPlaced).to.equal(ethBid);
      expect(isNullifierHashSet).to.equal(zkProof2.nullifierHash);
    });


    it("Should withdraw the deposit, owner", async function () {

      const bid = "0";
      const ethBid = ethers.parseEther(bid); // Set the bid amount in ether

      const key = poseidonHash(commitment);
      const onchainProof = await engAuction.connect(owner).getProof(key);

      // console.log("onchain ", onchainProof);
      console.log("Proof\npair: ", pair);
      console.log("root: ", root);
      console.log("ownerAdd: ", OWNER_add);
      // console.log("siblings: ", onchainProof.siblings);

      root = (await engAuction.connect(owner).getRoot()).toString();
      console.log("root of owner: "+root);

      zkProof = await getZKP(
          pair,
          root,
          ethBid.toString(),
          OWNER_add,
          onchainProof.siblings
      );

      // console.log("zkProof ", zkProof);

      const oldBalance = await ethers.provider.getBalance(OWNER_add);
      console.log("Balance of owner's money: " + oldBalance);
      console.log("Balance of owner's token: " + await myToken.balanceOf(OWNER_add));
      
      const maxNull = (await engAuction.connect(owner).maxNullifier());
      const maxBid = (await engAuction.connect(owner).maxBid());
      console.log("maxNull: "+maxNull);
      console.log("maxBid: "+maxBid);

      console.log("add of w: "+OWNER_add);
      console.log("nullH: "+nullifierHash);
      console.log("root of owner: "+root);
      // console.log("proof: "+zkProof);

      // Simulate withdrawing deposit
      await expect(engAuction.connect(owner).withdrawDep(OWNER_add, OWNER_add, zkProof.nullifierHash, root, ethBid, G16V_add, zkProof.formattedProof))
        .to.emit(engAuction, "Withdraw")
        .withArgs(maxBid, maxNull);

      const balance = await ethers.provider.getBalance(OWNER_add);
      console.log("Balance of owner's money: " + balance);
      console.log("Balance of owner's token: " + await myToken.balanceOf(OWNER_add));

      // Assert that the deposit was withdrawn successfully
      const isDepositEmpty = await engAuction.connect(owner).emptyDep(zkProof.nullifierHash);
      expect(isDepositEmpty).to.be.true;
    });

  it("Should withdraw the deposit, address1", async function () {

    const bid = "0";
    const ethBid = ethers.parseEther(bid); // Set the bid amount in ether

    const key = poseidonHash(commitment2);
    const onchainProof = await engAuction.connect(addr1).getProof(key);

    zkProof2 = await getZKP(
        pair2,
        root2,
        ethBid.toString(),
        ADDR1_add,
        onchainProof.siblings
    );

    const oldBalance = await ethers.provider.getBalance(ADDR1_add);
    console.log("Balance of owner's money: " + oldBalance);
    console.log("Balance of owner's token: " + await myToken.balanceOf(ADDR1_add));

    const maxNull = (await engAuction.connect(addr1).maxNullifier());
    const maxBid = (await engAuction.connect(addr1).maxBid());
    console.log("maxNull: ", maxNull);
    console.log("maxBid: ", maxBid);

    console.log("add of w: ", ADDR1_add);
    console.log("nullH: ", zkProof2.nullifierHash);
    console.log("root of owner: ", root2);
    // console.log("proof: ", zkProof);

    // Simulate withdrawing deposit
    await expect(engAuction.connect(addr1).withdrawDep(ADDR1_add, ADDR1_add, zkProof2.nullifierHash, root2, ethBid, G16V_add, zkProof2.formattedProof))
        .to.emit(engAuction, "Withdraw")
        .withArgs(maxBid, maxNull);

    const balance = await ethers.provider.getBalance(ADDR1_add);
    console.log("Balance of owner's money: " + balance);
    console.log("Balance of owner's token: " + await myToken.balanceOf(ADDR1_add));

    // Assert that the deposit was withdrawn successfully
    const isDepositEmpty = await engAuction.connect(addr1).emptyDep(zkProof2.nullifierHash);
    expect(isDepositEmpty).to.be.true;
  });

    it("Check token contract after", async function () {
      expect(await myToken.tokenURI(1)).to.equal("https://myduck/metadata/");
      console.log("uri ", await myToken.tokenURI(1));
      expect(await myToken.ownerOf(1)).to.equal(ADDR1_add);
      console.log("ownerOf ", await myToken.ownerOf(1));
    });
});