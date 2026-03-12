# Cloro Soluble CRM Frontend

Microfrontend del modulo **Cloro Soluble** para Geofal.

- Dominio productivo: `https://cloro-soluble.geofal.com.pe`
- Backend API: `https://api.geofal.com.pe` (rutas `/api/cloro-soluble`)

## Objetivo

- Registrar y editar ensayos del modulo.
- Guardar en backend (EN PROCESO / COMPLETO) y cerrar modal del CRM.
- Exportar Excel con plantilla oficial del laboratorio.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Axios
- React Hot Toast

## Variables de entorno

- `VITE_API_URL=https://api.geofal.com.pe`
- `VITE_CRM_LOGIN_URL=https://crm.geofal.com.pe/login`

## Desarrollo local

```bash
npm install
npm run dev
```
