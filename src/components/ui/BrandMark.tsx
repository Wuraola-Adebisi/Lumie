import { Link } from 'react-router-dom'
export default function BrandMark({compact=false}:{compact?:boolean}){return <Link to="/" className="brand-mark" aria-label="Lumie home"><span className="brand-symbol">l</span>{!compact&&<span>lumie</span>}</Link>}
