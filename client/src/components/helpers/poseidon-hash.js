import { ethers } from "ethers";

import { Poseidon } from "@iden3/js-crypto";

  export function poseidonHash(data) {
    data = ethers.hexlify(data);
    // console.log("1", data);
    const chunks = splitHexIntoChunks(data.replace("0x", ''), 64);
    // console.log("2ph ", chunks);
    const inputs = chunks.map((v) => BigInt(v));
    // console.log('inputs', inputs)
    // console.log("ph", ethers.toBeHex(Poseidon.hash(inputs), 32).toString());
    return ethers.toBeHex(Poseidon.hash(inputs), 32).toString();
  }
  
  function splitHexIntoChunks(hexString, chunkSize = 64) {
    // console.log("1 ", hexString);
    const regex = new RegExp(`.{1,${chunkSize}}`, "g");
    // console.log("2sp ", regex);
    const chunks = hexString.match(regex);
    // console.log("3sp ", chunks);
  
    if (!chunks) {
      throw new Error("Invalid hex string");
    }
  
    return chunks.map((chunk) => "0x" + chunk);
  }