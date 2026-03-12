export type CloroSolublePayload = {
    muestra: string
    numero_ot: string
    fecha_ensayo: string
    realizado_por?: string
    cliente?: string
    condicion_secado_aire?: string
    condicion_secado_horno?: string
    volumen_agua_ml?: number | null
    peso_suelo_seco_g?: number | null
    alicuota_tomada_ml?: number | null
    titulacion_suelo_g?: number | null
    titulacion_nitrato_plata?: number | null
    ph_ensayo?: number | null
    factor_dilucion?: number | null
    mililitros_solucion_usada?: number | null
    contenido_cloruros_ppm?: number | null
    observaciones?: string
    equipo_horno_codigo?: string
    equipo_balanza_001_codigo?: string
    revisado_por?: string
    revisado_fecha?: string
    aprobado_por?: string
    aprobado_fecha?: string
    [key: string]: unknown
}

export type ModuloPayload = CloroSolublePayload

export type EnsayoDetail = {
    id: number
    numero_ensayo?: string | null
    numero_ot?: string | null
    cliente?: string | null
    muestra?: string | null
    fecha_documento?: string | null
    estado?: string | null
    payload?: CloroSolublePayload | null
}

export type SaveResponse = {
    id: number
    numero_ensayo: string
    numero_ot: string
    estado: string
}
