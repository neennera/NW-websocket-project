import { useState } from 'react';
import { useRouter } from 'next/router';

const AVATARS = ['😊', '🌟', '🦄', '🌈', '🎨', '🎭', '🎪', '🎯'];

export default function RegisterLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    avatarId: 1, // เปลี่ยนจาก avatar_id เป็น avatarId
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleAvatarSelect = (index) => {
    setFormData({
      ...formData,
      avatarId: index + 1, // เปลี่ยนจาก avatar_id เป็น avatarId
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        }/api${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Save token and user data to localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to home page
      router.push('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      username: '',
      email: '',
      password: '',
      avatarId: 1, // เปลี่ยนจาก avatar_id เป็น avatarId
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background:
          'linear-gradient(135deg, #FAF6F1 0%, #F5EBE0 50%, #E3D5CA 100%)',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(139, 115, 85, 0.15)',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '28rem',
          border: '1px solid rgba(213, 189, 175, 0.3)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            {isLogin ? 'Welcome Back! 👋' : 'Join Us! 🎉'}
          </h1>
          <p style={{ color: '#8B7355', fontSize: '0.95rem', opacity: 0.9 }}>
            {isLogin
              ? 'Login to continue your journey'
              : 'Create your account to get started'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #FFE5E5 0%, #FFD5D5 100%)',
              borderLeft: '4px solid #D4756B',
              color: '#8B3A3A',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(212, 117, 107, 0.1)',
            }}
          >
            <p style={{ fontWeight: '600', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {/* Username (Register Only) */}
          {!isLogin && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#8B7355',
                  marginBottom: '0.5rem',
                }}
              >
                Username ✨
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                placeholder="Choose a cool username"
                required={!isLogin}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#8B7355',
                marginBottom: '0.5rem',
              }}
            >
              Email 📧
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#8B7355',
                marginBottom: '0.5rem',
              }}
            >
              Password 🔒
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Avatar Selection (Register Only) */}
          {!isLogin && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#8B7355',
                  marginBottom: '0.75rem',
                }}
              >
                Choose Your Avatar 🎭
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                }}
              >
                {AVATARS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAvatarSelect(index)}
                    style={{
                      padding: '1rem',
                      background:
                        formData.avatar_id === index + 1
                          ? 'linear-gradient(135deg, #D5BDAF 0%, #C9A882 100%)'
                          : 'linear-gradient(135deg, #FAF6F1 0%, #F5EBE0 100%)',
                      border:
                        formData.avatar_id === index + 1
                          ? '2px solid #C9A882'
                          : '2px solid #E3D5CA',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      transform:
                        formData.avatar_id === index + 1
                          ? 'scale(1.05)'
                          : 'scale(1)',
                      boxShadow:
                        formData.avatar_id === index + 1
                          ? '0 4px 12px rgba(201, 168, 130, 0.3)'
                          : '0 2px 8px rgba(139, 115, 85, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      if (formData.avatar_id !== index + 1) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.borderColor = '#D5BDAF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formData.avatar_id !== index + 1) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.borderColor = '#E3D5CA';
                      }
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>
                      {emoji}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              marginTop: '1rem',
              background: loading
                ? 'linear-gradient(135deg, #D5BDAF 0%, #C9A882 100%)'
                : 'linear-gradient(135deg, #C9A882 0%, #8B7355 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(139, 115, 85, 0.2)',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 6px 16px rgba(139, 115, 85, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(139, 115, 85, 0.2)';
              }
            }}
          >
            {loading ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  style={{
                    animation: 'spin 1s linear infinite',
                    height: '1.25rem',
                    width: '1.25rem',
                    marginRight: '0.75rem',
                  }}
                  viewBox="0 0 24 24"
                >
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    style={{ opacity: 0.75 }}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </span>
            ) : isLogin ? (
              '🚀 Login'
            ) : (
              '🎊 Create Account'
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#8B7355', fontSize: '0.95rem' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                fontWeight: '600',
                color: '#C9A882',
                cursor: 'pointer',
                transition: 'color 0.3s ease',
                padding: 0,
                fontSize: '0.95rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#8B7355')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#C9A882')}
            >
              {isLogin ? 'Register here 🎨' : 'Login here 🎯'}
            </button>
          </p>
        </div>

        {/* Decorative Elements */}
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '0.5rem',
              height: '0.5rem',
              background: '#C9A882',
              borderRadius: '50%',
              animation: 'bounce 1s infinite',
            }}
          ></div>
          <div
            style={{
              width: '0.5rem',
              height: '0.5rem',
              background: '#D5BDAF',
              borderRadius: '50%',
              animation: 'bounce 1s infinite',
              animationDelay: '0.1s',
            }}
          ></div>
          <div
            style={{
              width: '0.5rem',
              height: '0.5rem',
              background: '#C9A882',
              borderRadius: '50%',
              animation: 'bounce 1s infinite',
              animationDelay: '0.2s',
            }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-0.5rem);
          }
        }
      `}</style>
    </div>
  );
}
