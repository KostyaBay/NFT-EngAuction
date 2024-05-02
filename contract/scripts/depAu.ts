const { poseidonContract } = require("circomlibjs");
import { ethers } from "hardhat";

async function deployAu(){
  //1. Get the contract factory
  const AuContract = await ethers.getContractFactory("EngAuction"
  , {
    libraries: {
        PoseidonUnit1L: await (await getPoseidonContract(1)).getAddress(),
        PoseidonUnit2L: await (await getPoseidonContract(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidonContract(3)).getAddress(),
        }
    }
  );
  
  //2. It will create a json request, json-rpc request over to eth network, and the network will call a process to begin a transaction
  const dCon = await AuContract.deploy();
  
  console.log("Eng Auction deployed: ", await dCon.getAddress());

  console.log("Successfully transaction.");

}

export async function getPoseidonContract(params: number) {
  const abi = poseidonContract.generateABI(params);
  const code = poseidonContract.createCode(params);

  const PoseidonElements = new ethers.ContractFactory(abi, code, (await ethers.getSigners())[0]);
  const poseidonElements = await PoseidonElements.deploy();

  return poseidonElements;
}

deployAu().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});