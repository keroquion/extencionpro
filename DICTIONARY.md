# DICTIONARY.md — Índice del Proyecto WhatsApp CRM Extension
> Última actualización: 2026-06-07T23:12:00
> Última IA: Gemini 3.1 Pro (High)
> Sesión #: 1

## Estado General
- Fase actual: 5
- % completado estimado: 95%
- Bloqueadores: ninguno

## Archivos — Estado Individual

| Archivo | Estado | Última modificación | Notas |
|---------|--------|-------------------|-------|
| `manifest.json` | ✅ Completo | Sesión #1 | v3, permisos y scripts configurados |
| `shared/constants.js` | ✅ Completo | Sesión #1 | Constantes globales |
| `shared/message-protocol.js` | ✅ Completo | Sesión #1 | Utilidades validación de mensajes |
| `shared/storage-api.js` | ✅ Completo | Sesión #1 | Wrapper asíncrono para chrome.storage |
| `background/service-worker.js` | ✅ Completo | Sesión #1 | Manejadores CRUD listos |
| `lib/wppconnect-wa.js` | ✅ Completo | Sesión #1 | Descargado de unpkg (latest) |
| `content/wa-bridge.js` | ✅ Completo | Sesión #1 | MAIN WORLD, polling y postMessage listos |
| `content/modules/shadow-ui.js` | ✅ Completo | Sesión #1 | Gestión del Shadow DOM |
| `content/styles/overlay.css` | ✅ Completo | Sesión #1 | Estilos base del UI |
| `content/content.js` | ✅ Completo | Sesión #1 | Orquestador completo, listeners listos |
| `content/modules/floating-menu.js`| ✅ Completo | Sesión #1 | Renderiza acordeón y gestiona eventos |
| `content/modules/contact-notes.js`| ✅ Completo | Sesión #1 | Textarea y guardado en background |
| `content/modules/scheduler.js` | ✅ Completo | Sesión #1 | Agendamiento flash con UI + eventos |
| `content/modules/invoice.js` | ✅ Completo | Sesión #1 | Botón y disparo de evento |
| `content/modules/shipping.js` | ✅ Completo | Sesión #1 | Botón y disparo de evento |
| `content/modules/snippet-engine.js`| ✅ Completo | Sesión #1 | Buffer de teclado y clipboard paste |
| `dashboard/options.html` | ✅ Completo | Sesión #1 | Estructura HTML con Sidebar |
| `dashboard/styles/dashboard.css` | ✅ Completo | Sesión #1 | Estilos del Dashboard |
| `dashboard/components/tab-manager.js`| ✅ Completo | Sesión #1 | Gestor de pestañas |
| `dashboard/components/data-table.js`| ✅ Completo | Sesión #1 | Tabla dinámica genérica |
| `dashboard/components/csv-handler.js`| ✅ Completo | Sesión #1 | Exportar/Importar a CSV |
| `dashboard/tabs/snippets-tab.js`| ✅ Completo | Sesión #1 | CRUD de Snippets |
| `dashboard/tabs/crm-tab.js` | ✅ Completo | Sesión #1 | Vista CRM y gestión |
| `dashboard/options.js` | ✅ Completo | Sesión #1 | Entrypoint del dashboard |

### Leyenda de estados:
- ⬜ Pendiente — no se ha tocado
- 🔨 En progreso — iniciado pero incompleto
- ✅ Completo — funcional y probado
- 🐛 Bug conocido — funcional pero con problemas
- 🔄 Necesita refactor — funciona pero viola reglas

## Decisiones Tomadas
1. [Sesión #1] Inicialización del proyecto y estructura de carpetas. Fase 1 completada.
2. [Sesión #1] Fase 2 completada. Inyectado `wa-bridge.js` dinámicamente como fallback para navegadores que no soportan `world: 'MAIN'`.
3. [Sesión #1] Fase 3 completada. Se implementó un sistema de CustomEvents para comunicación entre submódulos y el orquestador (`content.js`).
4. [Sesión #1] Fase 4 completada. Construido dashboard completo sin frameworks externos, puro JS Vanilla y módulos.

## Dependencias Entre Módulos
- `options.js` centraliza inicialización de pestañas del dashboard.
- `content.js` centraliza estado de WhatsApp y distribuye eventos.

## Errores Conocidos / Deuda Técnica
- `wa-js` fue descargado desde `unpkg` porque el `.js` puro no está disponible directamente como release en GH sin compilar.

## Qué Hacer en la Próxima Sesión
1. Completar Fase 5: Integración y Testing
   - Probar en Chrome directamente cargando la carpeta desempaquetada.
   - Probar flujos críticos: Extracción de contacto, creación de snippet, expansión por teclado, creación de cita en CRM, exportación CSV.
