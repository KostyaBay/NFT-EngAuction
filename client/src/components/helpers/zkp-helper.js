import { ethers } from "ethers";
import * as snarkjs from "snarkjs";
import { poseidonHash } from "./poseidon-hash";
import {VerifierHelper} from "./generated-types/contracts/EngAuction.ts";

export function genValue() {
    const value = ethers.randomBytes(28);
    return padElement(ethers.hexlify((value)));
}

export function getCommitment(s, n) {
    const nullif = n.replace("0x", "");
    return poseidonHash(s + nullif);
}

export function getNullifierHash(n) {
    return poseidonHash(n);
}

  export function getCommitmentHash(commitment: string) {
    return poseidonHash(commitment);
  }

  export async function getZKP(
    secret: string,
    nullifier: string,
    root: string,
    bid: string,
    accountAddress: string,
    siblings: string[]
    ) {

    const nullifierHash = getNullifierHash(nullifier);

    const {proof} = await snarkjs.groth16.fullProve(
        {
          root: root,
          bid: BigInt(bid),
          accountAddress: accountAddress,
          secret: secret,
          nullifier: nullifier,
          siblings: siblings,
        }, 
        `/circuits/bidSMT.wasm`,
        `/circuits/circuit_final.zkey`,
      );

      swap(proof.pi_b[0], 0, 1);
      swap(proof.pi_b[1], 0, 1);

      // FIXME: Remove any
      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: (proof.pi_a.slice(0, 2).map((x: any) => padElement(BigInt(x)))),
        b: (proof.pi_b.slice(0, 2).map((x: any[]) => x.map((y: any) => padElement(BigInt(y))))),
        c: (proof.pi_c.slice(0, 2).map((x: any) => padElement(BigInt(x)))),
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