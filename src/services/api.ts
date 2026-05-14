import axios from 'axios'
import type { EnsayoDetail, CloroSolublePayload, SaveResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.geofal.com.pe'
const MODULE = 'cloro-soluble'

const api = axios.create({
    baseURL: API_URL,
})

const TOKEN_REFRESH_TIMEOUT_MS = 2500
const TOKEN_EXPIRY_SKEW_MS = 60 * 1000

type AuthenticatedRequestConfig = {
    _authRetried?: boolean
    headers?: Record<string, any>
    method?: string
    url?: string
}

const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem('token')?.trim()
    return token ? token : null
}

const persistToken = (token: string | null) => {
    if (typeof window === 'undefined') return
    if (token) {
        localStorage.setItem('token', token)
        return
    }
    localStorage.removeItem('token')
}

const decodeJwtExp = (token: string | null): number | null => {
    if (!token) return null

    try {
        const [, payload] = token.split('.')
        if (!payload) return null

        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
        const decoded = JSON.parse(window.atob(padded))

        return typeof decoded?.exp === 'number' ? decoded.exp * 1000 : null
    } catch {
        return null
    }
}

const isTokenExpiringSoon = (token: string | null, skewMs = TOKEN_EXPIRY_SKEW_MS): boolean => {
    const exp = decodeJwtExp(token)
    if (!exp) return !token
    return exp <= Date.now() + skewMs
}

const requestTokenFromParent = async (reason: string): Promise<string | null> => {
    const existingToken = getStoredToken()

    if (typeof window === 'undefined' || window.parent === window) {
        return existingToken
    }

    const requestId = `legacy-${reason}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

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
            if (token) persistToken(token)
            resolve(token ?? getStoredToken())
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
                    source: 'legacy-auth-api',
                    reason,
                },
                '*',
            )
        } catch {
            finish(existingToken)
        }
    })
}

const resolveAccessToken = async (reason: string): Promise<string | null> => {
    const storedToken = getStoredToken()
    if (!isTokenExpiringSoon(storedToken)) {
        return storedToken
    }

    const refreshedToken = await requestTokenFromParent(reason)
    return refreshedToken ?? storedToken
}



api.interceptors.request.use(
    async (config: any) => {
        const token = await resolveAccessToken(`request:${config.method ?? 'get'}:${config.url ?? ''}`)
        if (token) {
            config.headers = config.headers ?? {}
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

api.interceptors.response.use(
    (response) => response,
    async (error: any) => {
        const originalRequest = error.config as AuthenticatedRequestConfig | undefined

        if (error.response?.status === 401 && originalRequest && !originalRequest._authRetried) {
            originalRequest._authRetried = true

            const refreshedToken = await requestTokenFromParent('401-retry')
            if (refreshedToken) {
                originalRequest.headers = originalRequest.headers ?? {}
                originalRequest.headers.Authorization = `Bearer ${refreshedToken}`
                return api.request(originalRequest as any)
            }
        }

        if (error.response?.status === 401) {
            window.dispatchEvent(new CustomEvent('session-expired'))
        }
        return Promise.reject(error)
    },
)

const extractFilename = (contentDisposition?: string): string | undefined => {
    const match = typeof contentDisposition === 'string' ? contentDisposition.match(/filename="?([^";]+)"?/i) : null
    return match?.[1]
}

export async function saveEnsayo(payload: CloroSolublePayload, ensayoId?: number): Promise<SaveResponse> {
    const { data } = await api.post<SaveResponse>(`/api/${MODULE}/excel`, payload, {
        params: {
            download: false,
            ensayo_id: ensayoId,
        },
    })
    return data
}

export async function saveAndDownload(payload: CloroSolublePayload, ensayoId?: number): Promise<{ blob: Blob; filename?: string }> {
    const response = await api.post(`/api/${MODULE}/excel`, payload, {
        params: {
            download: true,
            ensayo_id: ensayoId,
        },
        responseType: 'blob',
    })
    const filename = extractFilename(response.headers['content-disposition'])
    return { blob: response.data, filename }
}

export async function getEnsayoDetail(ensayoId: number): Promise<EnsayoDetail> {
    const { data } = await api.get<EnsayoDetail>(`/api/${MODULE}/${ensayoId}`)
    return data
}

export default api
