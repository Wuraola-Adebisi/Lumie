import Sticker from './Sticker'

export default function Marquee({ items }: { items: string[] }) {
  const row = (key: string) => (
    <ul className="marquee-row" aria-hidden={key === 'b'} key={key}>
      {items.map((item) => <li key={item}><span>{item}</span><Sticker kind="burst" color="#f2b632" size={26} /></li>)}
    </ul>
  )
  return <div className="marquee">{row('a')}{row('b')}</div>
}
