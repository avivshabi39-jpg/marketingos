'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'שגיאה בכניסה')
      } else {
        window.location.href = '/admin/dashboard'
      }
    } catch {
      setError('שגיאת רשת, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      direction: 'rtl',
    }}>
      {/* Left panel - desktop only */}
      <div style={{
        flex: 1,
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        color: 'white',
      }} className="desktop-panel">
        <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '16px' }}>
          Marketing<span style={{ color: '#818cf8' }}>OS</span>
        </div>
        <p style={{ fontSize: '18px', opacity: 0.8, textAlign: 'center', maxWidth: '320px' }}>
          מערכת ניהול שיווק ולידים לעסקים ישראליים
        </p>
        <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {['ניהול לידים חכם', 'דפי נחיתה מותאמים', 'דוחות אוטומטיים', 'וואצאפ אוטומטי'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.9 }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</div>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 32px',
        background: 'white',
        borderRadius: '0',
      }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e1b4b', marginBottom: '8px' }}>
            ברוך הבא 👋
          </div>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            הכנס לחשבון MarketingOS שלך
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
              אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
              סיסמה
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingLeft: '44px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '18px',
                  padding: '0',
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#dc2626',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#a5b4fc' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              marginTop: '4px',
            }}
          >
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </button>

          <a
            href="/admin/forgot-password"
            style={{
              textAlign: 'center',
              color: '#6366f1',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            שכחתי סיסמה
          </a>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>
            אין לך חשבון?{' '}
          </span>
          <a href="/register" style={{ color: '#6366f1', fontSize: '13px', fontWeight: 500 }}>
            הרשם עכשיו
          </a>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
