import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
    } else {
      navigate('/dashboard')
    }

    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      if (resetError.message.toLowerCase().includes('rate limit') || resetError.status === 429) {
        setError('Demasiados intentos. Espera unos minutos antes de volver a intentarlo.')
      } else {
        setError(`No se pudo enviar el correo: ${resetError.message}`)
      }
    } else {
      setResetSent(true)
    }

    setLoading(false)
  }

  const cardContent = showForgot ? (
    <>
      <h1 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase text-center mb-1">
        Recuperar acceso
      </h1>
      <p className="font-opensans text-xs text-brand-bruma text-center tracking-wider mb-8">
        Te enviaremos un enlace para restablecer tu contraseña
      </p>

      {resetSent ? (
        <div className="text-center space-y-4">
          <p className="font-opensans text-sm text-brand-blue">
            Revisa tu correo <span className="font-semibold">{email}</span> y sigue el enlace para crear una nueva contraseña.
          </p>
          <button
            onClick={() => { setShowForgot(false); setResetSent(false) }}
            className="font-opensans text-xs text-brand-tierra tracking-wider hover:underline"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-brand-bruma/40 px-4 py-3 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue bg-transparent transition-colors"
              placeholder="admin@valeacr.com"
            />
          </div>

          {error && (
            <p className="font-opensans text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase py-3 hover:bg-brand-tierra transition-colors duration-300 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>

          <button
            type="button"
            onClick={() => { setShowForgot(false); setError(null) }}
            className="w-full font-opensans text-xs text-brand-bruma tracking-wider hover:text-brand-blue transition-colors text-center"
          >
            ← Volver al inicio de sesión
          </button>
        </form>
      )}
    </>
  ) : (
    <>
      <h1 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase text-center mb-1">
        Acceso
      </h1>
      <p className="font-opensans text-xs text-brand-bruma text-center tracking-wider mb-8">
        Panel Administrativo VALEA
      </p>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full border border-brand-bruma/40 px-4 py-3 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue bg-transparent transition-colors"
            placeholder="admin@valeacr.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra">
              Contraseña
            </label>
            <button
              type="button"
              onClick={() => { setShowForgot(true); setError(null) }}
              className="font-opensans text-xs text-brand-bruma hover:text-brand-tierra transition-colors tracking-wide"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full border border-brand-bruma/40 px-4 py-3 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue bg-transparent transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="font-opensans text-xs text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase py-3 hover:bg-brand-tierra transition-colors duration-300 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </>
  )

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <img
            src="/logo_claro_transparente.svg"
            alt="VALEA Aesthetics"
            className="h-20 object-contain"
          />
        </div>

        <div className="bg-brand-lino p-8">
          {cardContent}
        </div>

        <p className="text-center font-opensans text-xs text-brand-lino/30 mt-6">
          <a href="/" className="hover:text-brand-lino/60 transition-colors">
            ← Volver al sitio
          </a>
        </p>
      </div>
    </div>
  )
}
