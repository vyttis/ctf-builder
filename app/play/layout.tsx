export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFB] to-white">
      {children}
    </div>
  )
}
