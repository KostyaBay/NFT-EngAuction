import React, { useContext, useState } from "react";
import { Link, useLocation} from "react-router-dom";
import { UserContext } from '../App';

function Connected() {
    // const { state } = useLocation();
    // const { account} = state;
    // const { account } = useContext(UserContext);
    const { account } = useContext(UserContext);

    // const [showModal, setShowModal] = useState(false);
      
    //   const openModal = () => {
    //     generateRandomString();
    //     setShowModal(true);
    //   };
    
    //   const closeModal = () => {
    //     setShowModal(false);
    //   };

    //   const secret = generateRandomString();
    //   const nullifier = generateRandomString(32);

    return (
        <div className="connected-container">
            <h1 className="connected-header"> You are connected to Metamask</h1>
            <p className="connected-account">Your account: {account}</p>
            <div className="button-connected-container">
                <Link to="/create-auction">
                    <button className="connected-button1">Create the auction</button>
                </Link>
                <Link to="/join-auction">
                    <button className="connected-button2">Join to auction</button>
                </Link>
            </div>
      </div>
    );
  }

export default Connected;