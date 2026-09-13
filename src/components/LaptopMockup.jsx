import { motion } from 'framer-motion'

export default function LaptopMockup({ src, alt, imageMotionStyle }) {
  return (
    <svg viewBox="0 0 1000 680" className="block w-full overflow-visible">
      <defs>
        <clipPath id="screen-clip">
          <rect x="26" y="26" width="948" height="536" rx="10" />
        </clipPath>
        <linearGradient id="body-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9a9aa4" />
          <stop offset="45%" stopColor="#5c5c68" />
          <stop offset="100%" stopColor="#333340" />
        </linearGradient>
        <linearGradient id="base-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8c8c96" />
          <stop offset="45%" stopColor="#55555f" />
          <stop offset="100%" stopColor="#26262f" />
        </linearGradient>
      </defs>

      {/* base / keyboard deck, flares wider than the screen at the front edge */}
      <path
        d="M 44 566 L 956 566 L 1000 636 Q 992 654 974 654 L 26 654 Q 8 654 0 636 Z"
        fill="url(#base-metal)"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="2"
      />
      <rect x="446" y="646" width="108" height="9" rx="4.5" fill="#0a0a0c" opacity="0.75" />

      {/* thin metal lip where the lid meets the base */}
      <rect x="18" y="586" width="964" height="10" fill="url(#body-metal)" />

      {/* screen bezel */}
      <rect
        x="0"
        y="0"
        width="1000"
        height="600"
        rx="30"
        fill="#0b0b0d"
        stroke="url(#body-metal)"
        strokeWidth="3"
      />

      {/* screenshot, cropped to the inner screen */}
      <g clipPath="url(#screen-clip)">
        <motion.image
          href={src}
          x="26"
          y="26"
          width="948"
          height="536"
          preserveAspectRatio="xMidYMid slice"
          style={imageMotionStyle}
        />
      </g>

      {/* camera notch, drawn on top of the screenshot */}
      <path d="M 442 26 L 558 26 L 558 40 Q 558 48 550 48 L 450 48 Q 442 48 442 40 Z" fill="#0b0b0d" />
      <circle cx="500" cy="37" r="3" fill="#1c1c22" />

      <title>{alt}</title>
    </svg>
  )
}
