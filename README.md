# Ticket Order

Aplicacion movil en React Native/Expo para gestionar tickets personales: crear pendientes, completarlos, consultarlos en historial y reabrirlos si vuelven a estar activos. La app funciona sin servidor y persiste los datos localmente en el dispositivo.

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- React Navigation 7
- AsyncStorage para persistencia local
- Expo Vector Icons para iconografia

## Funcionalidades

- Crear tickets con titulo obligatorio y descripcion opcional.
- Validacion de longitud y limpieza de espacios antes de guardar.
- Listado de tickets activos con busqueda por ID, titulo, descripcion o estado.
- Completar tickets y moverlos al historial con fecha de cierre.
- Reabrir tickets desde el historial.
- Limpiar historial con confirmacion.
- Estados vacios, feedback de carga y avisos de error de almacenamiento.
- Migracion compatible desde la clave antigua de almacenamiento (`tickets_app`).

## Arquitectura

```text
App.js
src/
  components/        Componentes reutilizables de UI
  context/           Estado global y acciones de tickets
  hooks/             Hooks de acceso al dominio
  navigation/        Navegacion por tabs
  screens/           Pantallas de producto
  services/          Adaptadores externos, como AsyncStorage
  styles/            Tokens visuales y estilos compartidos
  utils/             Reglas puras del dominio de tickets
```

### Flujo de datos

1. `TicketProvider` hidrata el estado desde `src/services/ticketStorage.js`.
2. El estado se normaliza con `normalizeTicketState` para soportar datos antiguos o incompletos.
3. Las pantallas consumen el dominio con `useTickets`.
4. Las acciones (`addTicket`, `completeTicket`, `reopenTicket`, `clearHistory`) pasan por un reducer.
5. Cada cambio se persiste en AsyncStorage cuando la hidratacion inicial ya termino.

### Reglas de dominio

Las reglas principales viven en `src/utils/ticketUtils.js` para que sean faciles de probar y reutilizar:

- `validateTicketInput`: valida titulo y descripcion.
- `createTicket`: crea el modelo completo con fechas y estado.
- `completeTicket`: marca un ticket como cerrado.
- `reopenTicket`: devuelve un ticket al flujo activo.
- `searchTickets`: busqueda consistente para activos e historial.
- `normalizeTicketState`: protege contra datos persistidos incompletos.

## Ejecutar en local

Requisitos:

- Node.js 18 o superior
- npm
- Expo Go si vas a probar en un telefono

```bash
npm install
npm start
```

Comandos disponibles:

```bash
npm start      # abre Expo
npm run android
npm run ios
npm run web
```

## Persistencia

La app guarda este estado local:

```js
{
  tickets: [],
  history: [],
  counter: 1
}
```

La clave actual es `@ticket_order/state`. Si existe informacion guardada con la clave anterior `tickets_app`, la app la lee, la normaliza y luego continua guardando con la clave nueva.

## Criterios de calidad usados

- Estado centralizado con reducer para que las transiciones sean explicitas.
- Persistencia aislada en un servicio, sin llamadas a AsyncStorage dentro de pantallas.
- Componentes compartidos para tarjetas, buscador, metricas y estados vacios.
- Colores centralizados y estilos sin valores sueltos en pantallas.
- UI preparada para listas largas con `FlatList`.
- Acciones destructivas con confirmacion.
- Feedback visible para carga, errores y creacion exitosa.

## Proximos pasos recomendados

- Agregar pruebas unitarias para `ticketUtils`.
- Agregar ESLint/Prettier para estandarizar formato.
- Permitir prioridades o fechas limite si el flujo de trabajo lo necesita.
- Exportar historial a CSV.
- Agregar sincronizacion opcional cuando exista backend.
