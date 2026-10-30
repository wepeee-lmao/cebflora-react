import { Link } from 'react-router-dom';
import Brand from './Brand';

export default function Footer() {
  return (
    <footer>
      <div className="footer-col">
        <Brand />
      </div>
      <div className="footer-col">
        <h4>Platform</h4>
        <Link to="/taxonomy">Search &amp; browse</Link>
        <Link to="/identify">Learn &amp; identify</Link>
        <Link to="/dashboard">Save &amp; contribute</Link>
      </div>
      <div className="footer-col">
        <h4>About</h4>
        <a href="#">How it works</a>
        <a href="#">For Students</a>
        <a href="#">Safety</a>
      </div>
      <div className="footer-col">
        <h4>Support</h4>
        <Link to="/login">Log In</Link>
        <Link to="/login">Create account</Link>
        <a href="#">Contact us</a>
      </div>
    </footer>
  );
}
