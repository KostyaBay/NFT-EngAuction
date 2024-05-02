const hr = require("hardhat");

async function deployToken(){
  //1. Get the contract factory
  const [deployer] = await hr.ethers.getSigners();

  const TokenCont = await hr.ethers.getContractFactory("MyToken");
  
  //2. it will create a json request, json-rpc request over to eth network, and the network will call a process to begin a transaction
  const dTokCon = await TokenCont.deploy(deployer.getAddress());
  
  console.log("Contract deployed by:", await deployer.getAddress());
  console.log("Token deployed: ", await dTokCon.getAddress());

  //3. when the process before done, we will deployed the contract
  await dTokCon.safeMint(deployer.getAddress(), 1, "https://ipfs.io/ipfs/QmP8Ar7TQtMAaQzrsP3SSrAwPUmbjGg3p71A6urN56ZX8b?filename=2ad388759051cace9515b479e803214a.gif", { gasLimit: 3000000 });

  await dTokCon.setApprovalForAll(deployer.getAddress(), true);

  //4. all of the response will be returned
  return dTokCon;
}

deployToken()
    .then((deployedContract) => {
      console.log("Deployment successful!");
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
});