export default function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div className="absolute left-1/4 top-0 h-[28rem] w-[28rem] animate-blob rounded-full bg-accent/15 blur-[100px]" />
      <div className="absolute right-1/4 top-40 h-[24rem] w-[24rem] animate-blob rounded-full bg-accent/8 blur-[100px] [animation-delay:4s]" />
      <div className="absolute bottom-0 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 animate-blob rounded-full bg-accent/10 blur-[100px] [animation-delay:8s]" />
    </div>
  )
}
