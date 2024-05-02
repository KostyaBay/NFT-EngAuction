import { ethers } from "hardhat";
import * as snarkjs from "snarkjs";
import { poseidonHash } from "./poseidon-hash";
import { VerifierHelper } from "../../generated-types/contracts/EngAuction";

export interface SecretPair {
    secret: string;
    nullifier: string;
  }

export function generateSecrets() {
    const secret = ethers.randomBytes(28);
    const nullifier = ethers.randomBytes(28);
  
    return {
      secret: padElement(ethers.hexlify(secret)),
      nullifier: padElement(ethers.hexlify(nullifier)),
    };
  }
  
  export function getCommitment(pair: SecretPair): string {
    return poseidonHash(pair.secret + pair.nullifier.replace("0x", ""));
  }
  
  export function getNullifierHash(pair: SecretPair): string {
    return poseidonHash(pair.nullifier);
  }

  export async function getZKP(
    pair: SecretPair,
    root: string,
    bid: string,
    accountAddress: string,
    siblings: string[]
    ) {

    const nullifierHash = getNullifierHash(pair);

    const {proof} = await snarkjs.groth16.fullProve(
        {
          root: root,
          bid: BigInt(bid),
          accountAddress: accountAddress,
          secret: pair.secret,
          nullifier: pair.nullifier,
          siblings: siblings,
        }, 
        `./test/circuits/bidSMT.dev/bidSMT.wasm`,
        `./test/circuits/bidSMT.dev/circuit_final.zkey`,
      );

      swap(proof.pi_b[0], 0, 1);
      swap(proof.pi_b[1], 0, 1);

      // FIXME: Remove any
      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: (proof.pi_a.slice(0, 2).map((x: any) => padElement(BigInt(x)))) as any,
        b: (proof.pi_b.slice(0, 2).map((x: any[]) => x.map((y: any) => padElement(BigInt(y))))) as any,
        c: (proof.pi_c.slice(0, 2).map((x: any) => padElement(BigInt(x)))) as any,
      };

    return {
        formattedProof, 
        nullifierHash
    };
  }

  // Function to swap two elements in an array
  export function swap(arr: any, i: number, j: number) {
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  export function padElement(element: any) {
    return ethers.toBeHex(element, 32);
  }