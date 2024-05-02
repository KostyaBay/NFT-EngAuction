// import { render } from "react-dom";
// import 'bootstrap/dist/css/bootstrap.css'
// import App from './App';
// // import * as serviceWorker from './serviceWorker';

// const rootElement = document.getElementById("root");
// render( <App />, rootElement);

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
        <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();

// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import './index.css';
// // import Home from './Home';
// // import App from './components/Application1';
// import App from './App';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   root
// );

// ReactDOM.render(
//   <BrowserRouter>
//       <App />
//   </BrowserRouter>,
//   document.getElementById('root')
// );