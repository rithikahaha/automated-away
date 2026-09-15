export default function DashboardEmbed({ src }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex items-center gap-1.5 border-b border-black/10 bg-[#e9e9ec] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>
      <iframe
        src={src}
        title="Live dashboard"
        loading="lazy"
        className="h-[600px] w-full border-0"
      />
    </div>
  )
}
