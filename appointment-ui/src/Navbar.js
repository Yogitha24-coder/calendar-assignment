import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isOpen, setIsOpen] = useState(false); // 👈 controls hamburger

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  }

  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, []);

  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center p-3 bg-dark text-white">
        {/* Brand */}
        <Link className="navbar-brand" to="/appointments">
          Calendar App
        </Link>

        {/* Hamburger button (mobile only) */}
        <button
          className="nav-button md:hidden" // hidden on desktop
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>

        {/* Menu (visible in desktop OR when hamburger is open) */}
        <div className={`menu ${isOpen ? "block" : "hidden"} md:flex gap-2`}>
          {token ? (
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link className="btn btn-outline-light" to="/login">
                Login
              </Link>
              <Link className="btn btn-outline-light" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
