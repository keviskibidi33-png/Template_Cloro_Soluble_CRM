import { useCallback, useEffect, useState } from 'react'

const REFRESH_INTERVAL_MS = 45 * 60 * 1000
const TOKEN_REFRESH_TIMEOUT_MS = 2500
let tokenRefreshCounter = 0

const requestTokenRefreshFromParent = async (reason: string): Promise<string | null> => {
    const existingToken = localStorage.getItem('token')

    if (typeof window === 'undefined' || window.parent === window) {
        return existingToken
    }

    const requestId = `session-guard-${reason}-${Date.now()}-${tokenRefreshCounter++}`

    return new Promise((resolve) => {
        let settled = false

        const cleanup = () => {
            window.removeEventListener('message', onMessage)
            clearTimeout(timeoutId)
        }

        const finish = (token: string | null) => {
            if (settled) return
            settled = true
            cleanup()
            if (token) {
                localStorage.setItem('token', token)
            }
            resolve(token ?? existingToken)
        }

        const onMessage = (event: MessageEvent) => {
            if (event.data?.type !== 'TOKEN_REFRESH') return

            const responseRequestId = typeof event.data?.requestId === 'string' ? event.data.requestId : null
            if (responseRequestId && responseRequestId !== requestId) return

            const token = typeof event.data?.token === 'string' && event.data.token.trim()
                ? event.data.token.trim()
                : null

            finish(token)
        }

        const timeoutId = window.setTimeout(() => {
            finish(existingToken)
        }, TOKEN_REFRESH_TIMEOUT_MS)

        window.addEventListener('message', onMessage)

        try {
            window.parent.postMessage(
                {
                    type: 'TOKEN_REFRESH_REQUEST',
                    requestId,
                    source: 'legacy-session-guard',
                    reason,
                },
                '*',
            )
        } catch {
            finish(existingToken)
        }
    })
}

export function SessionGuard() {
    const [expired, setExpired] = useState(false)
    const [isRecovering, setIsRecovering] = useState(false)

    const requestRefresh = useCallback(async (reason: string) => {
        setIsRecovering(true)
        const token = await requestTokenRefreshFromParent(reason)
        if (token) {
            localStorage.setItem('token', token)
            setExpired(false)
        }
        setIsRecovering(false)
        return token
    }, [])

    useEffect(() => {
        const onExpired = () => {
            setExpired(true)
            void requestRefresh('session-expired')
        }
        window.addEventListener('session-expired', onExpired)

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                void requestRefresh('interval')
            }
        }, REFRESH_INTERVAL_MS)

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void requestRefresh('visibility')
            }
        }

        const onFocus = () => {
            void requestRefresh('focus')
        }

        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === 'TOKEN_REFRESH' && event.data.token) {
                localStorage.setItem('token', event.data.token)
                setExpired(false)
                setIsRecovering(false)
            }
        }

        window.addEventListener('message', onMessage)
        window.addEventListener('focus', onFocus)
        document.addEventListener('visibilitychange', onVisibility)

        void requestRefresh('mount')

        return () => {
            window.removeEventListener('session-expired', onExpired)
            window.removeEventListener('message', onMessage)
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibility)
            clearInterval(interval)
        }
    }, [requestRefresh])

    if (!expired) return null

    return (
        <div className="fixed bottom-4 right-4 z-[99999] max-w-sm rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M12 8v4" />
                        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                    </svg>
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-slate-900">Reconexión de sesión</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        La sesión del iframe se venció mientras trabajabas. El módulo intentará reconectarse sin cerrar tu trabajo; si persiste, puedes reintentar manualmente.
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            onClick={() => {
                                void requestRefresh('manual-retry')
                            }}
                            disabled={isRecovering}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRecovering ? 'Reconectando...' : 'Reintentar sesión'}
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Recargar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
