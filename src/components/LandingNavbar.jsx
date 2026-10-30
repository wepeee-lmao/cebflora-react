import { Link } from 'react-router-dom';
import Brand from './Brand';

export default function LandingNavbar() {
  return (
    <nav className="navbar">
      <Brand />
      <div className="nav-wrapper">
        <div className="nav-actions">
          <Link to="/login">Log In</Link>
        </div>
        <div>
          <p className="p">Already have an account?</p>
        </div>
      </div>
    </nav>
  );
}
