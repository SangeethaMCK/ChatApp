import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import UserAuth from './UserAuth.jsx'
import Chatapp from './Chatapp.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  {/* <UserAuth /> */}
  <Chatapp />
  </React.StrictMode>,
)
