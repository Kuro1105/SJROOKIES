import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#edeae1' }}>
      <Navbar />
      <main className="pb-16">{children}</main>
    </div>
  )
}
