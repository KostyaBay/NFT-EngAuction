import { ethers } from "hardhat";
import { BaseContract} from "ethers";

// @ts-ignore
import { poseidonContract } from "circomlibjs";

import { Poseidon } from "@iden3/js-crypto";

export async function getPoseidon(params: number): Promise<BaseContract> {
  
    const [deployer] = await ethers.getSigners();
    const abi = poseidonContract.generateABI(params);
    const code = poseidonContract.createCode(params);
  
    const PoseidonElements = new ethers.ContractFactory(abi, code, deployer);
    const poseidonElements = await PoseidonElements.deploy();
    await poseidonElements.waitForDeployment();
  
    return poseidonElements;
  }
  
  export function poseidonHash(data: string): string {
    data = ethers.hexlify(data);
    const chunks = splitHexIntoChunks(data.replace("0x", ""), 64);
    console.log("chunks ", chunks);
    const inputs = chunks.map((v) => BigInt(v));
    console.log("inputs ", ethers.toBeHex(Poseidon.hash(inputs), 32));
    return ethers.toBeHex(Poseidon.hash(inputs), 32);
  }
  
  function splitHexIntoChunks(hexString: string, chunkSize = 64) {
    const regex = new RegExp(`.{1,${chunkSize}}`, "g");
    const chunks = hexString.match(regex);
  
    if (!chunks) {
      throw new Error("Invalid hex string");
    }
  
    return chunks.map((chunk) => "0x" + chunk);
  }