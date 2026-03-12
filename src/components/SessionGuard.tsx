import { useState, useEffect } from 'react'

const REFRESH_INTERVAL_MS = 60 * 60 * 1000 // 60 min

export function SessionGuard() {
    const [expired, setExpired] = useState(false)

    useEffect(() => {
        const onExpired = () => setExpired(true)
        window.addEventListener('session-expired', onExpired)

        const interval = setInterval(() => {
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'TOKEN_REFRESH_REQUEST' }, '*')
            }
        }, REFRESH_INTERVAL_MS)

        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === 'TOKEN_REFRESH' && event.data.token) {
                localStorage.setItem('token', event.data.token)
            }
        }
        window.addEventListener('message', onMessage)

        return () => {
            window.removeEventListener('session-expired', onExpired)
            window.removeEventListener('message', onMessage)
            clearInterval(interval)
        }
    }, [])

    if (!expired) return null

    return (
        <>
            <style>{`
                @keyframes sg-backdrop { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sg-modal { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
            <div
                className="fixed inset-0 z-[99999] flex items-center justify-center"
                style={{ animation: 'sg-backdrop 0.3s ease-out' }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                <div
                    className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
                    style={{ animation: 'sg-modal 0.4s ease-out' }}
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Sesion expirada
                    </h2>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Tu sesion de seguridad ha expirado.<br />
                        Recarga para continuar trabajando.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                        Recargar pagina
                    </button>
                </div>
            </div>
        </>
    )
}
