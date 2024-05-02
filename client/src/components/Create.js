import React, {useContext} from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from '../App';

function Create() {
    // const history = useHistory();
    const { addressNFT, setAddressNFT, tokenID, setTokenID } = useContext(UserContext);
    const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // setAddressNFT(addressNFT);
    // setTokenID(tokenID);
    navigate('/launch-auction');
  };

  return (
    <div className="create-container">
      <h1 className="create-message">Fill the gaps for create a new auction: </h1>
      <form onSubmit={handleSubmit}>
        <div className="InputAddressNFT">
            <label htmlFor="InputAddressHtml" className="form-label">Address of NFT</label>
            <input type="address" placeholder="0xff.." value={addressNFT} onChange={(e) => setAddressNFT(e.target.value)} />
        </div>
        <div className="InputTokenID">
            <label htmlFor="InputAddressHtml" className="form-label">Token ID</label>
            <input type="number" className="token-field" placeholder="0" value={tokenID} onChange={(e) => setTokenID(e.target.value)}/>
        </div>
        <button type="submit" className="create-button">Create the auction</button>
      </form>
    </div>
  );
}

export default Create;