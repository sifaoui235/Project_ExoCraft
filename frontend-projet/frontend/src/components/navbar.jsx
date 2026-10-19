import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="legacy-navbar">
      <div>
        <Link to="/">ExoCraft</Link>
      </div>

      <div>
        <Link to="/login">Connexion</Link>

        <Link to="/register">Inscription</Link>
      </div>
    </nav>
  );
}

export default Navbar;