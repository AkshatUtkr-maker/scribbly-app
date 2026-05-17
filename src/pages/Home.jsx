import { Link } from 'react-router-dom'
import { useAuth } from '../App'
import BottomNav from '../components/BottomNav'

export default function Home() {
  const { user } = useAuth()
  return (
    <div className="page">
      <div className="topbar">
        <span className="topbar-logo">scrib<span>bly</span></span>
        <div className="topbar-right">
          {user ? (
            <Link to="/notes" className="btn btn-ghost btn-sm">my notes</Link>
          ) : (
            <>
              <Link to="/login"  className="btn btn-ghost btn-sm">sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">sign up</Link>
            </>
          )}
        </div>
      </div>
      <div className="hero">
        <h1>Say it out loud.<br /><em>Or don't.</em></h1>
        <p>Scribbly is your corner of the internet. Write publicly, stay anonymous, or keep it to yourself.</p>
        <div className="hero-btns">
          <Link to="/new"  className="btn btn-primary">start writing →</Link>
          <Link to="/feed" className="btn btn-ghost">browse public notes</Link>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
