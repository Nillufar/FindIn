import {useSelector} from 'react-redux';
import './styles.css'; 
import './profile.css';

function Profile() {
    const user = useSelector((state) => state.userReducer.user);

    return (
        <div>
            <section class="profile-picture" style={{backgroundImage:'url(${user.coverImage})'}}>
                <button class="upload-picture-btn" type="button" aria-label="Change Profile Picture">Change Picture</button>
            </section>

            <header class="profile-header">
                <div class="avatar-container">
                    <div class="avatar-flat" id="avatarInitials">JS</div>
                    <button class="upload-avatar-btn" type="button" aria-label="Upload Profile Picture">+</button>
                </div>

                <div class ="profile-info">
                    <h2 id="fullName">{user?.firstname} {user?.lastname}</h2>
                    {user?.address && <p id="location">{user?.address?.city}, {user?.address?.country}</p>}
                    {user?.email && <p><a id="email" href="johnsmith@gmail.com">{user?.email}</a></p>}
                    {user?.github && <p><a id="github" href="https://github.com/johnsmith">github.com/johnsmith</a></p>}
                    {user?.contact && <p id="phone">{user?.contact.code} {user?.contact.phone}</p>}
                    <p id="Coding Skills">{user?.codingSkills}</p>
                </div>
            </header>

            <section class ="profile-experience">
                <div class="resume-container">
                    {user?.resume && <p id="resume">{user.resume}</p>}
                    {!user?.resume && <p id="resume" class="resume-empty">No resume uploaded yet.</p>}
                    <button class="upload-resume-btn" type="button" aria-label="Upload Resume">Upload Resume</button>
                </div>
                <div class="favorite-projects-container">
                    {user?.favoriteProjects && <p id="favoriteProjects">{user.favoriteProjects}</p>}
                    {!user?.favoriteProjects && <p id="favoriteProjects">No favorite projects added yet.</p>}
                </div>
            </section>
        </div>
    )
}
export default Profile;