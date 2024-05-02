import React, {useState, useEffect, useContext} from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import logo from '../logo.png';
import { UserContext } from '../App';

function Login() {

  const { signer, setSigner, provider, setProvider, account, setAccount, storedAccount } = useContext(UserContext);

  const navigate = useNavigate();


    useEffect( () => {
      if (storedAccount) {
        setAccount(storedAccount);
      } else {
        alert('Please connect to your MetaMask account.');
      }

      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      }
  
      return() => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      }
    });
  
    function handleAccountsChanged(accounts) {
      if (accounts.length > 0 && account !== accounts[0]) {
        setAccount(accounts[0]);
        // canVote();
      } else {
      //   setIsConnected(false);
        setAccount(null);
      }
    }
  
      async function connectToMetamask() {
          if (window.ethereum) {
            try {
              const provider = new ethers.BrowserProvider(window.ethereum);
              setProvider(provider);
              await provider.send("eth_requestAccounts", []);
              const signer = await provider.getSigner();
              setSigner(signer);
              const address = await signer.getAddress();
              setAccount(address);
              localStorage.setItem('metamaskAccount', address); // Збереження акаунта в localStorage
              console.log("Metamask connected: " + address);
              navigate('/connected'); //, {state: { account: address}}
              setAccount(address);
              // setIsConnected(true);
            } catch (err) {
              console.error(err);
            }
          }
            else {
              console.error("MetaMask not detected in the browser")
            }
          // navigate('/auction');
    };

    console.log("signer", signer);
  
    return (
      <div className="login-container">
        <div class="login-content">
          <div class="logo-container">
            <img src={logo} className="login-logo" alt="logo"/>
          </div>
            <div class="text-container">
              <h1 className="welcome-message1"> Welcome to</h1>
              <p><h1 className="welcome-message2"> ZK-BASED</h1></p>
              <p><h1 className="welcome-message3"> ENGLISH AUCTION</h1></p>
              <button className="login-button" onClick={connectToMetamask}>Connect MetaMask</button>
            </div>
        </div>
      </div>
    );
  }

export default Login;