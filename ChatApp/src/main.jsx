import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import UserAuth from './UserAuth.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserAuth />
    {/* <App /> */}
  </React.StrictMode>,
)
