import { useState, useRef } from 'react';
import { uploadProfileImage, updateProfile } from '../services/index';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName]           = useState(user?.name || '');
  const [isProvider, setIsProvider] = useState(user?.isProvider || false);
  const [preview, setPreview]     = useState(user?.profileImage || '');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');
  const fileRef = useRef();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setImgLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('profileImage', imageFile);
      const { data } = await uploadProfileImage(fd);
      updateUser({ profileImage: data.profileImage });
      setPreview(data.profileImage);
      setImageFile(null);
      setSuccess('Profile image updated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed');
    } finally {
      setImgLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await updateProfile({ name, isProvider });
      updateUser({ name: data.name, isProvider: data.isProvider });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="page-header">
          <div>
            <h2>👤 My Profile</h2>
            <p className="page-subtitle">Manage your account settings and image</p>
          </div>
        </div>

        {error   && <div className="alert alert-error"   onClick={() => setError('')}>{error} ✕</div>}
        {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success} ✓</div>}

        {/* Profile Image Section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-seed-header" />
          <div className="card-body">
            <h4 style={{ marginBottom: 20, color: 'var(--pine)' }}>Profile Photo</h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="profile-avatar-lg"
                  />
                ) : (
                  <div
                    className="profile-avatar-lg profile-avatar-placeholder"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  className="upload-zone"
                  onClick={() => fileRef.current.click()}
                  style={{ padding: '20px 16px' }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <div style={{ fontSize: '1.5rem' }}>📷</div>
                  <p style={{ marginTop: 6 }}>
                    {imageFile ? imageFile.name : 'Click to choose a new photo'}
                  </p>
                </div>
                {imageFile && (
                  <button
                    className="btn btn-accent btn-full"
                    style={{ marginTop: 10 }}
                    onClick={handleImageUpload}
                    disabled={imgLoading}
                  >
                    {imgLoading ? 'Uploading…' : '⬆ Upload Photo'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="card">
          <div className="card-seed-header" />
          <div className="card-body">
            <h4 style={{ marginBottom: 20, color: 'var(--pine)' }}>Account Details</h4>

            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div
                className="form-group"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: isProvider ? 'rgba(30,58,47,.06)' : 'var(--paper)',
                  borderRadius: 'var(--radius)',
                  border: '1.5px solid',
                  borderColor: isProvider ? 'var(--pine)' : 'var(--border)',
                  transition: 'all .2s',
                }}
              >
                <input
                  type="checkbox"
                  id="providerToggle"
                  checked={isProvider}
                  onChange={(e) => setIsProvider(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--pine)', cursor: 'pointer' }}
                />
                <label htmlFor="providerToggle" style={{ cursor: 'pointer', flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--pine)' }}>Provider Mode</span>
                  <br />
                  <span style={{ fontSize: '.83rem', color: 'var(--ink-lite)' }}>
                    Enable to create listings and receive plant requests
                  </span>
                </label>
                {isProvider && <span className="badge badge-provider">Active</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
