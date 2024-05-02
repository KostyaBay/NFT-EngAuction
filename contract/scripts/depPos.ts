import { ethers } from "hardhat";
async function deployPos(){

  // Get the contract factory
  const PosContract = await ethers.getContractFactory("PoseidonSMT");
  const dCon = await PosContract.deploy();
  
  console.log("Poseidon Contract deployed: ", await dCon.getAddress());
}

deployPos().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});