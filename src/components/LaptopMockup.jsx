export default function LaptopMockup({ children }) {
  return (
    <div className="w-full">
      <div
        className="relative rounded-t-2xl rounded-b-[3px] p-[14px] pb-[10px]"
        style={{
          background: 'linear-gradient(160deg, #6b6b7a 0%, #3d3d4d 45%, #232330 100%)',
        }}
      >
        <span className="absolute left-1/2 top-[5px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-black/70 ring-1 ring-white/10" />
        <div className="overflow-hidden rounded-[4px] bg-black">{children}</div>
      </div>

      <svg viewBox="0 0 1000 56" preserveAspectRatio="none" className="block w-full" style={{ height: 22 }}>
        <defs>
          <linearGradient id="laptop-base-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b6b7a" />
            <stop offset="55%" stopColor="#33333f" />
            <stop offset="100%" stopColor="#1a1a22" />
          </linearGradient>
        </defs>
        <path
          d="M 26 0 L 974 0 L 1000 38 Q 994 52 978 52 L 22 52 Q 6 52 0 38 Z"
          fill="url(#laptop-base-grad)"
        />
        <path
          d="M 425 0 L 575 0 L 558 15 Q 552 20 540 20 L 460 20 Q 448 20 442 15 Z"
          fill="#0a0a0f"
        />
      </svg>
    </div>
  )
}
