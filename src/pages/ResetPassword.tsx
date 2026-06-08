import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase intercepts the token from the URL hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
    } else {
      await supabase.auth.signOut()
      navigate('/login')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <img
            src="https://res.cloudinary.com/dkpfptjvm/image/upload/v1780903156/logo_claro_transparente_uc22dn.svg"
            alt="VALEA Aesthetics"
            width="42"
            height="80"
            className="h-20 object-contain"
          />
        </div>

        <div className="bg-brand-lino p-8">
          <h1 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase text-center mb-1">
            Nueva contraseña
          </h1>
          <p className="font-opensans text-xs text-brand-bruma text-center tracking-wider mb-8">
            Elige una contraseña segura para tu cuenta
          </p>

          {!ready ? (
            <p className="font-opensans text-xs text-brand-bruma text-center">
              Verificando enlace...
            </p>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full border border-brand-bruma/40 px-4 py-3 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue bg-transparent transition-colors"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
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
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
