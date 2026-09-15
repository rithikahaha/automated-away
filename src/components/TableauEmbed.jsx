export default function TableauEmbed({ src }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <tableau-viz src={src} toolbar="bottom" hide-tabs="true" style={{ width: '100%', height: '600px' }} />
    </div>
  )
}
