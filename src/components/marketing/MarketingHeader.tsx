import { Link } from 'react-router-dom'
import { ArrowUpRight,Menu } from 'lucide-react'
import BrandMark from '../ui/BrandMark'
export default function MarketingHeader(){return <header className="marketing-header"><div className="marketing-header-inner"><BrandMark/><nav className="marketing-nav"><a href="#how-it-works">How it works</a><a href="#what-you-can-make">What you can make</a><a href="#why-lumie">Our little corner</a></nav><div className="header-actions"><Link to="/app" className="text-link">Log in</Link><Link to="/app" className="button button-dark button-small">Get started <ArrowUpRight size={15}/></Link></div><button className="icon-button mobile-menu" aria-label="Open navigation"><Menu size={21}/></button></div></header>}
