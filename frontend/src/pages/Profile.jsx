/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { user, logout, token, login } = useContext(AuthContext);
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ username: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await axios.get("/api/auth/me");
        setProfile(res.data);
        setForm({
          username: res.data.username,
          email: res.data.email,
        });
      } catch (err) {
        console.error("Error fetching profile:", err.message);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    if (!profile) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUpdate = async () => {
    try {
      const res = await axios.put("/api/auth/update", form);
      setProfile(res.data);
      login(res.data, token);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  const handlePasswordChange = async () => {
    try {
      await axios.put("/api/auth/change-password", passwordForm);
      alert("Password changed successfully!");
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (err) {
      alert("Failed to change password.");
    }
  };

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (error) return <div className="profile-error">{error}</div>;

  return (
    <div className="profile-container">
      <h1 className="profile-title">My Profile</h1>
      <div className="profile-section">
        <h2 className="section-title">Update Profile</h2>
        <div className="form-group">
          <label>Username</label>
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <button className="btn btn-update" onClick={handleUpdate}>
          Update Profile
        </button>
      </div>
      <div className="profile-section">
        <h2 className="section-title">Change Password</h2>
        <div className="form-group">
          <input
            type="password"
            placeholder="Old Password"
            value={passwordForm.oldPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="New Password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
            }
          />
        </div>
        <button className="btn btn-password" onClick={handlePasswordChange}>
          Change Password
        </button>
      </div>
      <button className="btn btn-logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Profile;
