import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight,Menu,X } from 'lucide-react'
import BrandMark from '../ui/BrandMark'
export default function MarketingHeader(){
  const [open,setOpen]=useState(false)
  return <header className="marketing-header"><div className="marketing-header-inner"><BrandMark/><nav className="marketing-nav"><a href="#how-it-works">How it works</a><a href="#what-you-can-make">What you can make</a><a href="#why-lumie">Our little corner</a></nav><div className="header-actions"><Link to="/app" className="text-link">Log in</Link><Link to="/app" className="button button-dark button-small">Get started <ArrowUpRight size={15}/></Link></div><button className="icon-button mobile-menu" onClick={()=>setOpen(!open)} aria-label={open?'Close navigation':'Open navigation'}>{open?<X size={21}/>:<Menu size={21}/>}</button></div>{open&&<nav className="mobile-nav-panel"><a href="#how-it-works" onClick={()=>setOpen(false)}>How it works</a><a href="#what-you-can-make" onClick={()=>setOpen(false)}>What you can make</a><a href="#why-lumie" onClick={()=>setOpen(false)}>Our little corner</a><Link to="/app" onClick={()=>setOpen(false)}>Open Lumie <ArrowUpRight size={15}/></Link></nav>}</header>
}
