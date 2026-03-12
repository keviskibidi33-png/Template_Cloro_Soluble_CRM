import { useEffect, useState, type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { SessionGuard } from './components/SessionGuard'
import ModuloForm from './pages/ModuloForm'

const CRM_LOGIN_URL = import.meta.env.VITE_CRM_LOGIN_URL || 'http://localhost:3000/login'

function AccessGate({ children }: { children: ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const tokenFromUrl = params.get('token')

        if (tokenFromUrl) {
            localStorage.setItem('token', tokenFromUrl)
        }

        const token = tokenFromUrl || localStorage.getItem('token')
        const isEmbedded = window.parent !== window
        const authorized = Boolean(tokenFromUrl || (isEmbedded && token))
        setIsAuthorized(authorized)
    }, [])

    if (isAuthorized === null) return null

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="w-full max-w-sm text-center">
                        <div className="mb-8">
                            <img src="/geofal.svg" alt="Geofal" className="h-14 mx-auto" style={{ filter: 'grayscale(100%) contrast(1.2)' }} />
                        </div>

                        <div className="mx-auto w-12 h-12 border-2 border-black rounded-full flex items-center justify-center mb-6">
                            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>

                        <h1 className="text-xl font-bold text-black tracking-wide uppercase mb-3">Acceso Denegado</h1>

                        <p className="text-xs text-neutral-500 leading-relaxed mb-8">
                            Todos los intentos de acceso son registrados y auditados.
                            <br />
                            Se requiere autenticacion valida desde el CRM.
                        </p>

                        <button
                            className="w-full py-3 px-6 bg-black text-white text-sm font-semibold tracking-wide uppercase hover:bg-neutral-800 active:bg-neutral-900 transition-colors"
                            onClick={() => window.location.assign(CRM_LOGIN_URL)}
                        >
                            Ir al CRM
                        </button>
                    </div>
                </div>
                <div className="py-4 text-center text-[11px] text-neutral-500">
                    <div className="mb-1">Términos · Licencias · Privacidad</div>
                    <div>© {new Date().getFullYear()} Geofal S.A.S — Sistema auditado</div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

export default function App() {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <AccessGate>
                <SessionGuard />
                <ModuloForm />
            </AccessGate>
            <Toaster position="top-right" />
        </div>
    )
}
