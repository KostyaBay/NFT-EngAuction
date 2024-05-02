import React, {useState, useEffect, useContext, useMemo, useRef} from 'react';
import { ethers } from "ethers";
import abi from '../EngAuctionABI.json';
import { UserContext } from '../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faUpload } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { openSeaSDK } from "opensea-js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Auction.css';
import {
    getCommitment,
    getCommitmentHash,
    getZKP,
    genValue
} from "./helpers/zkp-helper";

function Auction() {
    
    const [deposit, setDeposit] = useState('');
    const [bid, setBid] = useState('');
    const [address2, setAddress2] = useState('');
    const [readyToDep, setReadyToDep] = useState(false);
    const [readyToBid, setReadyToBid] = useState(false);
    const [fileName, setFileName] = useState('');
    const [fileAttached, setFileAttached] = useState(false);
    const [fileContent, setFileContent] = useState(null);
    const [statusSave, setStatusSave] = useState(false);
    const [addFile, setAddFile] = useState(false);
    const [readyToWithdraw, setReadyToWithdraw] = useState(false);

    const zkProof = useRef(null);

    const { signer, provider, account, addressNFT, tokenID, depositAmount, setDepositAmount, secret, nullifier, setSecret, setNullifier, commitment, setCommitment,
            nullHash, setNullHash, balance, setBalance, transactionSuccess, setTransactionSuccess, auction, setAuction, siblings, setSiblings,
            root, setRoot, proof, setProof, maxBid, setmaxBid, maxNull, setmaxNull, storedBalance, storedMBid, storedMNull, storedDepAmount } = useContext(UserContext);

    const contractAddress = "0x61ad88019c1780138937FdC046af6BFffd426a2d";
    const contractToken = "0xF8E6B11c22fb7C40ee2C2E1f5330148fc1140D85";
    const verifierAddress = "0x5Da96CE8C5e0248AcfE80a3F96f3a62c7FfAf9b2";

    const Auction  = useMemo(() => {
        return signer
            ? new ethers.Contract(contractAddress, abi, signer)
            : null
    }, [signer])

    console.log("signer", signer);

    useEffect(() => {

          if (readyToDep)
          {
            handleDeposit().then(() => setReadyToDep(false));
          }

          const getBalance = async () => {
            const balance = await provider.getBalance(contractAddress)
            const balanceFormatted = ethers.formatEther(balance.toString()) //formatEther(balance)
            setBalance(storedBalance);
            localStorage.setItem('balanceAu', balanceFormatted); // save account to localStorage
            setBalance(balanceFormatted);
          }
          setTransactionSuccess(false);
    
        const getAuction = async () => {
          console.log(setAuction(auction));
        }

        getBalance()
          .catch(console.error);

        getAuction()
          .catch(console.error);

      }, [readyToDep])

      useEffect(() => {
        if (statusSave)
        {
          saveSNtoFile().then(() => setStatusSave(false));
        }
      }, [statusSave])

      useEffect(() => {
        if (addFile)
        {
            handleSuccess();
            handleTransactionSuccess();
            setAddFile(false);
        }
      }, [addFile])

      useEffect(() => {
        if (readyToBid) {
          handleBid().then(() => setReadyToBid(false));   
        }
      }, [readyToBid])

      useEffect(() => {
        if (readyToWithdraw) {
            handleWithdrawDep().then(() => setReadyToWithdraw(false));
        }
      }, [readyToWithdraw])

  const handleTransactionSuccess = () => {
    setTransactionSuccess(true);
  };

  const handleSuccess = () => {
    toast.success("Transaction successful!");
  };

  const handleError = () => {
    toast.error("Transaction failed!");
  };

  const handleGenSN = async () => {
    const s = genValue();
    const n = genValue();
    console.log("s: "+s);
    console.log("n: "+n);
    // console.log("12");
    return [s,n];
  }

  const handleGenComm = async (s, n) => {
    const commit = getCommitment(s, n);
    console.log("comm: ",commit);
    return commit;
  };

  const submitSave = () => {
    setStatusSave(true);
  }

  const saveSNtoFile = async () => {
          // function for writing generated values in file
          const saveToFile = (content) => {
              // creating the object Blob
              const blob = new Blob([content], { type: 'text/plain' });
  
              // creating the link on file
              const url = URL.createObjectURL(blob);
  
              // creating the element <a> for downloading
              const link = document.createElement('a');
              link.href = url;
              link.download = 'inputSN.json';
  
              // adding the element <a> on page and click emulation
              document.body.appendChild(link);
              link.click();
  
              // deleting the element <a> from the page
              document.body.removeChild(link);
          };
  
          // forming the contents of the file
          const content = `
          {
          \t"secret" : "${secret}",
          \t"nullifier" : "${nullifier}"
          }`;
          
          // saving in file
          saveToFile(content);
  }

  const submitDep = async () => {
    const [s,n] = await handleGenSN();
    const c = await handleGenComm(s,n);
    console.log("ss "+s);
    console.log("sn "+n);
    console.log("scom "+c);
    setSecret(s);
    setNullifier(n);
    setCommitment(c);

    setReadyToDep(true);
  }

  const handleDeposit = async () => {
    try {
      console.log("Ds "+secret);
      console.log("Dn "+nullifier);
      console.log("Dcom "+commitment);

      const depAm = "0.01";

      setDepositAmount(storedDepAmount);

      const key = getCommitmentHash(commitment);
      console.log("key ", key);
      const sibl = await Auction.getProof(key);
      // console.log("154");
      setSiblings(sibl);
      console.log("sibl: "+sibl);
      localStorage.setItem('depAmount', depAm);
      console.log("depAm: "+depAm);

      const ethDep = ethers.parseEther(depAm);
      // console.log("1234",ethDep);
      console.log("commitment",commitment);
      const _deposit = await Auction.deposit(commitment, {value: ethDep});
      await _deposit.wait();
      console.log(ethDep);
      // setDeposit(ethDep);
      // setCommitment(commitment);
      console.log(commitment);
      const mtRoot = (await Auction.getRoot()).toString();
      console.log("root of owner: "+mtRoot);
      setRoot(mtRoot);
      handleSuccess();
      handleTransactionSuccess();
    } catch (error) {
      handleError();
      console.error("Transaction failed:", error);
    }
  };

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileAttached = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setFileAttached(true);
    }
  }

  const handleFileSN = async () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;

        // reading data from the file
        try {
          const data = JSON.parse(content);
          if(data.secret && data.nullifier) {
            console.log("saveS "+data.secret);
            console.log("saveN "+data.nullifier);

            setSecret(data.secret);
            setNullifier(data.nullifier);
            setCommitment(getCommitment(data.secret,data.nullifier));

            console.log("aftSSN");
          } else {
            // if it wasn't possible to read the secret or nullifier, we display an error
            console.error('Invalid file format: Missing secret or nullifier');
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(selectedFile);
    }
    console.log("balance of owner: ", await provider.getBalance(contractToken));
    // console.log("saveS "+123);
    // console.log("saveN "+456);
    setAddFile(true);
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileAttached(false);
    setFileContent(null);
  };

  const handleSubmit = async () => {
    // console.log("1");
    const mtRoot = (await Auction.getRoot()).toString();
    setRoot(mtRoot);
    // console.log("2");
    const key = getCommitmentHash(commitment);
    // console.log("k "+key);
    // console.log("3");
    console.log("account: " + account);
    const onchainProof = await Auction.getProof(key);
    zkProof.current = await getZKP(
      secret,
      nullifier,
      root,
      ethers.parseEther(bid),
      account,
      onchainProof.siblings
    );
    setSiblings(onchainProof);
    console.log("type sibl "+typeof onchainProof);
    console.log("sibl: "+onchainProof);

    setNullHash(zkProof.current.nullifierHash);
    console.log("nh: "+zkProof.current.nullifierHash);

    setReadyToBid(true);
  };

  const handleBid = async () => {
    try{
      const ethBid = ethers.parseEther(bid);
      console.log("root of owner: "+root);
      console.log("bid: "+ethBid);
      console.log("nh: "+zkProof.current.nullifierHash);
      console.log("prf: "+zkProof.current.formattedProof);

      console.log("signer ", signer, "type of ", typeof signer);
      console.log("accountB: " + account, "type of ", typeof account);
      const _placeBid = await Auction.placeBid(account, ethBid, zkProof.current.nullifierHash, root, verifierAddress, zkProof.current.formattedProof);
      await _placeBid.wait();

      setmaxBid(storedMBid);
      setmaxNull(storedMNull);
      localStorage.setItem('maxBid', bid);
      localStorage.setItem('maxNull', zkProof.current.nullifierHash);

      setProof(zkProof.current.formattedProof);
      console.log("Your bid:" + ethBid);
      handleSuccess();
      handleTransactionSuccess();

    } catch (error) {
      handleError();
      console.error("Transaction failed:", error);
    }
  };

  const handleSubmitWith = async (e) => {
      e.preventDefault();
      // console.log("1");
      const mtRoot = (await Auction.getRoot()).toString();
      setRoot(mtRoot);
      // console.log("2");
      const key = getCommitmentHash(commitment);
      // console.log("3");
      const onchainProof = await Auction.getProof(key);

      console.log("account: " + account);
      zkProof.current = await getZKP(
          secret,
          nullifier,
          mtRoot,
          ethers.parseEther("0"),
          account,
          onchainProof.siblings
      );
      setSiblings(onchainProof);
      console.log("type sibl "+typeof onchainProof);
      console.log("sibl: "+onchainProof);
      setNullHash(zkProof.current.nullifierHash);
      console.log("nh: "+zkProof.current.nullifierHash);
      setReadyToWithdraw(true);
  }
  const handleWithdrawDep = async () => {
    try{
      const ethBid = ethers.parseEther("0");

      console.log("a "+account);
      console.log("nh "+zkProof.current.nullifierHash);
      console.log("r "+root);
      console.log("bid "+bid);
      console.log("p "+zkProof.current.formattedProof);
      console.log("accountW: " + account);
      const _withdraw = await Auction.withdrawDep(account, account, zkProof.current.nullifierHash, root, ethBid, verifierAddress, zkProof.current.formattedProof);
      await _withdraw.wait();

      // setAddress2(address2);
      setNullHash(zkProof.current.nullifierHash);
      setProof(zkProof.current);
      // console.log("Your address2:" + address2);
      handleSuccess();
      handleTransactionSuccess();
    } catch (error) {
      handleError();
      console.error("Transaction failed:", error);
    }
  };

  return (
    <div className='auction-container'>
      <h1>Auction Page</h1>
      <div className='auction-info'>
      <p className='addressName'><b>Address of auction:</b> {contractAddress}</p>
      <p className='balance'><b>Balance of auction:</b> {balance + " ETH"}</p>
      <p className='addressName'><b>Address of NFT:</b> {addressNFT}</p>
      <p className='tokenName'><b>Token ID:</b> {tokenID}</p>
      {/* {nftData && (
                <div>
                    <h2>{nftData.name}</h2>
                    <img src={nftData.image_url} alt={nftData.name} />
                </div>
            )} */}
      {/* <img src="https://ipfs.io/ipfs/bafybeifceqb425nypkowl6galgabq7osmoqmoy6nkgdq5sxl3fsbgetadq/2" alt="NFT" /> */}
      <p className='addressName'><b> Signer: </b> {account}</p>
      </div>
        <div>
          <button className="openModalBtn" onClick={submitSave}>Download keys</button>
        </div>
            <div className="auction-container1">
                <p className='info-message1'> For start bidding lock the deposit:</p>
                <button className="auction-button1" onClick={submitDep}>Lock the deposit</button>
            </div>
        <div className='auction-proof-upload'>
        <label htmlFor="InputAddressHtml" className="form-label">Your keys (.json)</label>
                    {!fileAttached && (
                    <div>
                        <p> <FontAwesomeIcon icon={faUpload} /> &nbsp; </p>
                        <p className='info-message-proof'>Drag & drop your file here, or click to select file</p>
                    </div>
                    )}
                    {fileAttached && (
                      <div>
                        <p> <FontAwesomeIcon icon={faFile} /> &nbsp; {fileName} </p>
                        <div className="titleCloseBtn1">
                          <button onClick={handleRemoveFile}>X</button>
                        </div>
                      </div>
                    ) }
                    <input type="file" accept=".json" onChange={handleFileAttached}/>
                     {fileContent && <pre>{fileContent}</pre>} 
                    <button className="auction-button3" onClick={handleFileSN}>Upload</button>
        </div>
            <div className="auction-container1">
                <p className='info-message1'> Filling the gaps for place the bid:</p>
                {/* <label htmlFor="InputAddressHtml" className="form-label">Amount of bid</label> */}
                <input type="number" className="bid-field" placeholder="Enter amount of ETH" value={bid} onChange={(e) => setBid(e.target.value)} />
                <button type="submit" className="auction-button2" onClick={handleSubmit}>Place a bid</button>
            </div>
        <div>
              <p className='addressName'><b>Your nullifierHash:</b> {nullHash}</p>
            </div>
        <table class="table table-striped">
        <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Bid</th>
                <th scope="col">NullifierHash</th>
              </tr>
        </thead>
            <tbody>
              <tr>
                <th scope="row">Top</th>
                <td>{storedMBid + " ETH"}</td>
                <td>{storedMNull}</td>
              </tr>
            </tbody>
        </table>

        <form onSubmit={handleSubmitWith}>
            <div className="auction-container1">
                <p className='info-message1'> Filling the gaps for withdraw the deposit:</p>
                <button type="submit" className="auction-button3">Withdraw the deposit</button>
            </div>
        </form>
    </div>
  );
}

export default Auction;