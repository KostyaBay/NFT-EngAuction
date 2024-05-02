pragma circom  2.1.6;

include "./SMTVerifier.circom";

template bidSMT(treeDepth) {
    // In
    signal input root;

    signal input bid; // bid amount had choosen
    signal input accountAddress; // address of the user account

    signal input secret;
    signal input nullifier;

    signal input siblings[treeDepth];

    // Out
    signal output nullifierHash; 

    // SMT inclusion verification
    component smtVerifier = SMTVerifier(treeDepth);

    smtVerifier.root <== root;
    smtVerifier.secret <== secret;
    smtVerifier.nullifier <== nullifier;

    smtVerifier.siblings <== siblings;

    smtVerifier.isVerified === 1;
    
    // Setting the nullifierHash as an output to prevent double bidding
    nullifierHash <== smtVerifier.nullifierHash;
    
    // Adding constraints on bidding parameters
    // Squares are used to prevent optimizer from removing those constraints
    // The bidding parameters are not used in any computation
    signal bidSquare <== bid * bid;
    signal accountAddressSquare <== accountAddress * accountAddress;
}

component main {public [root,
                        bid,
                        accountAddress]} = bidSMT(80);