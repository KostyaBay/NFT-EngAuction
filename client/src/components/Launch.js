import React, {useState, useEffect, useContext, useMemo} from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from "ethers";
import abi from '../EngAuctionABI.json';
import { UserContext } from '../App';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Launch() {

    const [timestamp, setTimestamp] = useState('');
    const [owner, setOwner] = useState('');
    const [isLaunch, setIsLaunch] = useState(false);

    const navigate = useNavigate();

    const { signer, provider, account, addressNFT, tokenID, depositAmount, setDepositAmount, balance, setBalance, auction, setAuction, participantAmount, setParticipantAmount } = useContext(UserContext);
    const contractAddress = '0xC5ddBEdb3df8220b8fdA5500bDCc88074C0ba789';
    
    const Auction  = useMemo(() => {
        return signer
            ? new ethers.Contract(contractAddress, abi, signer)
            : null
    }, [signer])

    console.log("signer", signer);

  const handleSuccess = () => {
    toast.success("Transaction successful!");
  };

  const handleError = () => {
    toast.error("Transaction failed!");
  };

  const handleLaunchAuction = async (e) => {
    e.preventDefault();
    try{
      console.log(addressNFT, tokenID);
      const _addressNFT = await Auction.setAddressNFT(addressNFT, tokenID);
      await _addressNFT.wait();
      const ethDepAm = ethers.parseEther(depositAmount);
      console.log(ethDepAm, timestamp, account, participantAmount);
      const _launch = await Auction.launchAuction(ethDepAm, timestamp, account, participantAmount);
      await _launch.wait();

      setDepositAmount(ethDepAm);
      setTimestamp(timestamp);
      setParticipantAmount(participantAmount);
      setIsLaunch(true);
      handleSuccess();
      console.log("Successfully transaction.");
      navigate('/auction');
    } catch (error) {
      handleError();
      console.error("Transaction failed:", error);
  }
  };

  return (
    <div className='connected-container'>
      <h1>Launch auction</h1>
      <div className='auction-info'>
      <p className='addressName'><b>Address of auction:</b> {contractAddress}</p>
      <p className='addressName'><b>Address of NFT:</b> {addressNFT}</p>
      <p className='tokenName'><b>Token ID:</b> {tokenID}</p>
      <p className='balance'><b>Balance of auction:</b> {balance + " ETH"}</p>
      <p className='addressName'><b> Signer: </b> {account}</p>
      </div>
        <form onSubmit={handleLaunchAuction}>
            <div className="launch-container">
                <p className='info-message1'> Filling the gaps for launch the auction:</p>
                <label htmlFor="InputAddressHtml" className="form-label">Fixed deposit amount</label>
                <input type="number" className="token-field" placeholder="0 ETH" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />

                <label htmlFor="InputAddressHtml" className="form-label">Timestamp of auction</label>
                <input type="number" className="token-field" placeholder="0" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} />

                <label htmlFor="InputAddressHtml" className="form-label">Address of owner NFT</label>
                <input type="address" placeholder="0xff.." value={owner} onChange={(e) => setOwner(e.target.value)} />

                <label htmlFor="InputAddressHtml" className="form-label">Amount of participants</label>
                <input type="number" className="token-field" placeholder="0" value={participantAmount} onChange={(e) => setParticipantAmount(e.target.value)} />

                <button type="submit" className="launch-button">Launch the auction</button>
            </div>
        </form>
    </div>
  );
}

export default Launch;