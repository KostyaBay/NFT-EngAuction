import { ethers } from "hardhat";

async function deployVerifier(){
  //1. Get the contract factory
  const VerifContract = await ethers.getContractFactory("Groth16Verifier");
  
  //2. It will create a json request, json-rpc request over to eth network, and the network will call a process to begin a transaction
  const dCon = await VerifContract.deploy();
  
  console.log("Verifier deployed: ", await dCon.getAddress());

  console.log("Successfully transaction.");

}

deployVerifier().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});