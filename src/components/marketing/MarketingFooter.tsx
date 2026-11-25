import { Link } from 'react-router-dom'
import BrandMark from '../ui/BrandMark'

export default function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="footer-top footer-top-expanded">
        <div className="footer-brand">
          <BrandMark />
          <p>A little place for everything<br/>you want to say.</p>
          <span className="footer-mailclub">THE INTERNET'S LITTLE MAIL CLUB</span>
        </div>
        <div className="footer-link-group">
          <strong>Explore</strong>
          <Link to="/about">About Lumie</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/app/create">Creation Studio</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-link-group">
          <strong>Policies</strong>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of service</Link>
          <Link to="/acceptable-use">Acceptable use</Link>
          <Link to="/cookies">Cookie notice</Link>
          <Link to="/accessibility">Accessibility</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Lumie</span>
        <span>Made for the things that matter.</span>
        <Link to="/contact">Get in touch</Link>
      </div>
    </footer>
  )
}
