import { useState, useRef } from 'react'

type AuthView = 'login' | 'signup' | 'forgot-password'

export interface AuthPageProps {
  onLogin?: (email: string, password: string) => void
  onGoogleLogin?: () => void
  onSignUp?: (alias: string, email: string, password: string, avatar?: File) => void
  onForgotPassword?: (email: string) => void
}

const inputClass =
  'w-full bg-white/5 border border-white/15 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/20 transition-all'

export function AuthPage({ onLogin, onGoogleLogin, onSignUp, onForgotPassword }: AuthPageProps) {
  const [view, setView] = useState<AuthView>('login')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [alias, setAlias] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setAvatarPreview(URL.createObjectURL(file))
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    onLogin?.(email, password)
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    onSignUp?.(alias, email, password, file)
  }

  function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    onForgotPassword?.(forgotEmail)
    setForgotSuccess(true)
  }

  function switchTo(v: AuthView) {
    setView(v)
    setForgotSuccess(false)
    setEmail('')
    setPassword('')
    setAlias('')
    setForgotEmail('')
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-stone-950">
      {/* Deep ocean background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 110% 65% at 50% -5%, rgba(6,78,59,0.75) 0%, transparent 62%), radial-gradient(ellipse 70% 50% at 5% 100%, rgba(15,118,110,0.3) 0%, transparent 55%), radial-gradient(ellipse 55% 40% at 95% 80%, rgba(4,47,46,0.45) 0%, transparent 55%)',
          }}
        />
        {/* Horizontal depth bands */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0, transparent 47px, rgba(52,211,153,0.7) 48px)',
          }}
        />
        {/* Surface light glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 opacity-15 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.6) 0%, transparent 70%)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-5 py-12">
        {/* Brand mark */}
        <div className="text-center mb-9">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-400/20 mb-3">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-emerald-400">
              <path
                d="M10 2C7.5 4.5 5 7 5 10.5a5 5 0 0010 0C15 7 12.5 4.5 10 2z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              <path
                d="M10 14.5v-5M8 11.5l2-2 2 2"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1
            className="text-xl font-semibold text-white tracking-wide"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Freedive
          </h1>
          <p className="text-white/35 text-xs mt-1 tracking-widest uppercase">
            {view === 'login'
              ? 'Sign in to continue'
              : view === 'signup'
              ? 'Create an account'
              : 'Reset password'}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl shadow-black/40">
          {/* — LOGIN — */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Google */}
              <button
                type="button"
                onClick={() => onGoogleLogin?.()}
                className="w-full flex items-center justify-center gap-3 bg-white text-stone-800 font-medium text-sm rounded-xl px-4 py-3 hover:bg-stone-50 active:bg-stone-100 transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/25 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => switchTo('forgot-password')}
                  className="text-emerald-400/60 text-xs hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold text-sm rounded-xl px-4 py-3 transition-colors"
              >
                Log in
              </button>
            </form>
          )}

          {/* — SIGN UP — */}
          {view === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-emerald-400/40 transition-colors"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white/20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <span className="text-white/25 text-xs">Add photo (optional)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <input
                type="text"
                placeholder="Alias (display name)"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold text-sm rounded-xl px-4 py-3 transition-colors"
              >
                Create account
              </button>
            </form>
          )}

          {/* — FORGOT PASSWORD — */}
          {view === 'forgot-password' && (
            <div>
              {forgotSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto">
                    <svg viewBox="0 0 20 20" fill="none" className="w-6 h-6 text-emerald-400">
                      <path
                        d="M4 10l4 4 8-8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-white font-medium text-sm">Check your email</p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    We've sent a reset link to{' '}
                    <span className="text-white/60">{forgotEmail}</span>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-white/45 text-sm leading-relaxed">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                  <input
                    type="email"
                    placeholder="Email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm rounded-xl px-4 py-3 transition-colors"
                  >
                    Send reset link
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="text-center mt-7 text-sm text-white/30">
          {view === 'login' && (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => switchTo('signup')}
                className="text-emerald-400/80 hover:text-emerald-400 transition-colors"
              >
                Sign up
              </button>
            </>
          )}
          {view === 'signup' && (
            <>
              Already have an account?{' '}
              <button
                onClick={() => switchTo('login')}
                className="text-emerald-400/80 hover:text-emerald-400 transition-colors"
              >
                Log in
              </button>
            </>
          )}
          {view === 'forgot-password' && (
            <button
              onClick={() => switchTo('login')}
              className="text-emerald-400/80 hover:text-emerald-400 transition-colors"
            >
              ← Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
