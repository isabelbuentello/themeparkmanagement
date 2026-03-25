import React from "react"
import { Link } from 'react-router-dom'
import Login from './Login.jsx'

function Home() {
  return (
    <div>
        <nav>
            <Link to="/account">Signup/Login</Link>
        </nav>
        <h1> home page!!!</h1>
    </div>
  )
}

export default Home
