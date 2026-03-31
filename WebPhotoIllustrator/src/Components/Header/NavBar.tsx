import React from "react"

import { Link } from "react-router-dom"
export default function NavBar() {
  return (
    <div className="offcanvas offcanvas-end " tabIndex={-1} id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
      <div className="offcanvas-header">
        <Link className="offcanvas-title nav-link text-dark" to="/">
          <img className='logoIcon' src='/Images/dark-logo.png' alt='logo'  style={{width:"40px"}}/>
        </Link>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div className="offcanvas-body header-offcanvas">
        <ul className='navbar-nav justify-content-end flex-grow-1'>

          <li className="nav-item">
            <Link className="nav-link text-light border-bottom" to="/">
              <p>Главная</p>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-light border-bottom" to="/storage">
              <p>Каталог</p>

            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-light border-bottom" to="/editor">
              <p>Редактор</p>

            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-light border-bottom" to="/profile">
              <p>Профиль</p>

            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-light border-bottom" to="/hall-of-fame">
              <p>Зал славы</p>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
