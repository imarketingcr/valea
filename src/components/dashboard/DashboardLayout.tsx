/**
 * components/dashboard/DashboardLayout.tsx
 * Layout principal del dashboard médico:
 * sidebar colapsable + área de contenido principal.
 */
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  UserPlus,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/dashboard/patients', label: 'Pacientes', icon: Users, end: false },
  { to: '/dashboard/appointments', label: 'Citas', icon: CalendarCheck, end: false },
  { to: '/dashboard/new-patient', label: 'Nuevo Paciente', icon: UserPlus, end: false },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-brand-lino/10">
        <img
          src="https://res.cloudinary.com/dkpfptjvm/image/upload/v1780903156/logo_claro_transparente_uc22dn.svg"
          alt="VALEA Aesthetics"
          width="83"
          height="160"
          className="h-40 object-contain"
        />
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 font-opensans text-xs tracking-wider uppercase transition-all duration-200',
                isActive
                  ? 'bg-brand-lino/15 text-brand-arena border-l-2 border-brand-arena'
                  : 'text-brand-lino/60 hover:text-brand-lino hover:bg-brand-lino/10'
              )
            }
          >
            <Icon size={16} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer sidebar: avatar + logout */}
      <div className="px-4 py-5 border-t border-brand-lino/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-brand-arena flex items-center justify-center shrink-0">
            <span className="font-cormorant text-sm font-medium text-brand-blue">C</span>
          </div>
          <div>
            <p className="font-opensans text-xs text-brand-lino/80 font-medium leading-tight">
              Dra. Carolina Castillo
            </p>
            <p className="font-opensans text-[10px] text-brand-lino/40 tracking-wider">
              MED16178
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 font-opensans text-xs text-brand-lino/40 hover:text-brand-lino/70 transition-colors cursor-pointer bg-transparent border-none w-full"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar desktop ─────────────────────────────────────── */}
      <aside className="hidden md:flex md:w-60 md:flex-col bg-brand-blue fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* ── Sidebar mobile overlay ─────────────────────────────── */}
      <>
        {/* Overlay */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-brand-blue/50 backdrop-blur-sm md:hidden transition-opacity duration-300',
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Drawer */}
        <div
          className={cn(
            'fixed top-0 left-0 bottom-0 z-50 w-64 bg-brand-blue md:hidden transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-brand-lino/50 hover:text-brand-lino bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
          <SidebarContent />
        </div>
      </>

      {/* ── Área principal ──────────────────────────────────────── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Topbar mobile */}
        <header className="md:hidden bg-brand-lino border-b border-brand-bruma/30 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-brand-blue bg-transparent border-none cursor-pointer"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <img
            src="https://res.cloudinary.com/dkpfptjvm/image/upload/v1780903156/logo_oscuro_transparente_bc5i1j.svg"
            alt="VALEA Aesthetics"
            width="23"
            height="40"
            className="h-10 object-contain"
          />
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
