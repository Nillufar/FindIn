import {NavLink, Outlet, useNavigate} from 'react-router-dom';
import {useCurrentUser, useSession} from '../features/auth/session';
import {Avatar} from './ui';

export function AppShell() {
    const user = useCurrentUser();
    const {signOut} = useSession();
    const navigate = useNavigate();

    async function handleSignOut() {
        await signOut();
        navigate('/');
    }

    const link = ({isActive}: { isActive: boolean }) => (isActive ? 'nav-link nav-link--active' : 'nav-link');

    return (
        <div className="app">
            <header className="topbar">
                <div className="topbar__inner">
                    <NavLink to="/explore" className="topbar__brand" aria-label="FindIn home">
                        <img src="/findin-logo.webp" alt="FindIn"/>
                    </NavLink>
                    <nav className="topbar__nav" aria-label="Main">
                        <NavLink to="/explore" className={link}>Explore</NavLink>
                        <NavLink to="/dashboard" className={link}>Dashboard</NavLink>
                        <NavLink to="/posts/new" className={link}>Post</NavLink>
                    </nav>
                    <div className="topbar__me">
                        <NavLink to="/profile" className="topbar__profile" aria-label="My profile">
                            <Avatar user={{id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl ?? undefined}} size={34}/>
                            <span className="topbar__name">{user.displayName.split(' ')[0]}</span>
                        </NavLink>
                        <button className="text-button" type="button" onClick={handleSignOut}>Sign out</button>
                    </div>
                </div>
            </header>
            <main className="page">
                <Outlet/>
            </main>
        </div>
    );
}
