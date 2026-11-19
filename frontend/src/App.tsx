import {Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {AppShell} from './components/AppShell';
import {AuthView} from './features/auth/AuthView';
import {useSession} from './features/auth/session';
import {DashboardPage} from './pages/DashboardPage';
import {ExplorePage} from './pages/ExplorePage';
import {NewOrganizationPage, NewPostPage} from './pages/NewPostPage';
import {OrganizationPage} from './pages/OrganizationPage';
import {PostDetailPage} from './pages/PostDetailPage';
import {EditProfilePage, ProfilePage} from './pages/ProfilePage';

export function App() {
    const {user, loading} = useSession();
    const location = useLocation();

    if (loading) return <div className="splash" aria-busy="true"><img src="/findin-logo.webp" alt="FindIn"/></div>;
    if (!user) return <AuthView/>;

    // New accounts fill in school and major first so others can find them.
    if (!user.isProfileComplete && location.pathname !== '/welcome') return <Navigate to="/welcome" replace/>;

    return (
        <Routes>
            <Route element={<AppShell/>}>
                <Route index element={<Navigate to="/explore" replace/>}/>
                <Route path="welcome" element={<EditProfilePage onboarding/>}/>
                <Route path="explore" element={<ExplorePage/>}/>
                <Route path="dashboard" element={<DashboardPage/>}/>
                <Route path="posts/new" element={<NewPostPage/>}/>
                <Route path="posts/:postId" element={<PostDetailPage/>}/>
                <Route path="profile" element={<ProfilePage/>}/>
                <Route path="profile/edit" element={<EditProfilePage/>}/>
                <Route path="people/:userId" element={<ProfilePage/>}/>
                <Route path="organizations/new" element={<NewOrganizationPage/>}/>
                <Route path="organizations/:organizationId" element={<OrganizationPage/>}/>
                <Route path="*" element={<Navigate to="/explore" replace/>}/>
            </Route>
        </Routes>
    );
}
