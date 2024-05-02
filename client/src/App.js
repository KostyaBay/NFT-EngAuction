import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import './App.css';
import Login from './components/Login.js';
import Connected from './components/Connected.js';
import Create from './components/Create';
import Join from './components/Join.js';
import Launch from './components/Launch.js';
import Auction from './components/Auction.js';

export const UserContext = React.createContext(null);

function App() {

  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [auction, setAuction] = useState('');
  const [addressNFT, setAddressNFT] = useState('');
  const [tokenID, setTokenID] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [participantAmount, setParticipantAmount] = useState('');
  const [secret, setSecret] = useState('');
  const [nullifier, setNullifier] = useState('');
  const [commitment, setCommitment] = useState('');
  const [nullHash, setNullHash] = useState('');
  const [root, setRoot] = useState('');
  const [siblings, setSiblings] = useState('');
  const [proof, setProof] = useState('');
  const [maxBid, setmaxBid] = useState('');
  const [maxNull, setmaxNull] = useState('');
  const storedAccount = localStorage.getItem('metamaskAccount');
  const storedBalance = localStorage.getItem('balanceAu');
  const storedDepAmount = localStorage.getItem('depAmount');
  const storedMBid = localStorage.getItem('maxBid');
  const storedMNull = localStorage.getItem('maxNull');
  return (
    <Router>
      <ToastContainer />
      <UserContext.Provider value={ {signer: signer, setSigner: setSigner,
                                     provider: provider, setProvider: setProvider, 
                                     account: account, setAccount: setAccount,
                                     balance: balance, setBalance: setBalance,
                                     transactionSuccess: transactionSuccess, setTransactionSuccess: setTransactionSuccess,
                                     auction: auction, setAuction: setAuction,
                                     addressNFT: addressNFT, setAddressNFT: setAddressNFT,
                                     tokenID: tokenID, setTokenID: setTokenID,
                                     depositAmount: depositAmount, setDepositAmount: setDepositAmount,
                                     participantAmount: participantAmount, setParticipantAmount: setParticipantAmount,
                                     secret: secret, setSecret: setSecret,
                                     nullifier: nullifier, setNullifier: setNullifier,
                                     commitment: commitment, setCommitment: setCommitment,
                                     nullHash: nullHash, setNullHash: setNullHash,
                                     root: root, setRoot: setRoot,
                                     siblings: siblings, setSiblings: setSiblings,
                                     proof: proof, setProof: setProof,
                                     maxBid: maxBid, setmaxBid: setmaxBid,
                                     maxNull: maxNull, setmaxNull: setmaxNull,
                                     storedMBid: storedMBid, storedMNull: storedMNull, 
                                     storedDepAmount: storedDepAmount,
                                     storedAccount: storedAccount, storedBalance: storedBalance}}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/connected" element={<Connected />} />
          <Route path="/create-auction" element={<Create />} />
          <Route path="/join-auction" element={<Join />} />
          <Route path="/launch-auction" element={<Launch />} />
          <Route path="/auction" element={<Auction />} />
        </Routes>
      </UserContext.Provider>
    </Router>
  );
}

export default App;