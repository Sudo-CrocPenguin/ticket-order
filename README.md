<div align="center">

```
 ████████╗██╗ ██████╗██╗  ██╗███████╗████████╗
    ██╔══╝██║██╔════╝██║ ██╔╝██╔════╝╚══██╔══╝
    ██║   ██║██║     █████╔╝ █████╗     ██║   
    ██║   ██║██║     ██╔═██╗ ██╔══╝     ██║   
    ██║   ██║╚██████╗██║  ██╗███████╗   ██║   
    ╚═╝   ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   

 ██████╗ ██████╗ ██████╗ ███████╗██████╗ 
██╔═══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
██║   ██║██████╔╝██║  ██║█████╗  ██████╔╝
██║   ██║██╔══██╗██║  ██║██╔══╝  ██╔══██╗
╚██████╔╝██║  ██║██████╔╝███████╗██║  ██║
 ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
```

### _Tu cabeza para pensar. La app para recordar._

[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK_51-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![AsyncStorage](https://img.shields.io/badge/AsyncStorage-persistencia_local-FF6B6B?style=for-the-badge)](https://react-native-async-storage.github.io/async-storage/)
[![Platform](https://img.shields.io/badge/Android-listo_para_instalar-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://www.android.com)

</div>

---

## El problema que resuelve

Las apps de tareas suelen pedir demasiado: cuenta, categorías, prioridades, etiquetas, colores, vistas kanban... y terminás organizando el sistema en lugar de usarlo.

**Ticket Order** va al revés. Cada tarea es un ticket. Lo abrís, lo trabajás, lo cerrás. Pasa al historial y no vuelve a molestarte. Sin login, sin nube obligatoria, sin configuración inicial. Arranca y ya funciona.

---

## Instalación en 10 segundos

> Desde tu dispositivo Android, abrí este enlace o escaneá el QR en Expo Go:

```
https://expo.dev/accounts/sudo-crocpenguin/projects/ticket-order/builds/33c6e657-6a98-4be5-8c64-6c27c3820a64
```

---

## Qué podés hacer

```
┌─────────────────────────────────────────────┐
│  📋  TICKETS ACTIVOS                         │
│  ─────────────────────────────────────────  │
│  #001  Llamar al banco          [ Completar ]│
│  #002  Revisar PR de backend    [ Completar ]│
│  #003  Comprar café             [ Completar ]│
│                          [ + Nuevo ticket ]  │
└─────────────────────────────────────────────┘
```

- **Crear tickets** con título y descripción — ID incremental automático
- **Completar tickets** con un tap → desaparecen de la lista activa y se archivan solos
- **Buscar** en tiempo real dentro de activos e historial
- **Filtrar** para ver exactamente lo que necesitás
- **Historial** de todo lo que ya hiciste — porque a veces necesitás probarlo
- **Persistencia local** con AsyncStorage — cerrá la app, apagá el teléfono, los tickets siguen ahí

---

## Stack

```
React Native ──────── UI nativa, fluida en Android e iOS
Expo ──────────────── Toolchain y build sin dolor
AsyncStorage ──────── Persistencia local, sin servidor
React Navigation ──── Navegación por pestañas
Reanimated ────────── Animaciones de 60fps en las interacciones
```

---

## Ejecutar en local

**Requisitos:** Node.js 18+ · Expo Go en tu dispositivo

```bash
git clone git@github.com:Sudo-CrocPenguin/ticket-order.git
cd ticket-order
npm install
npx expo start
```

Escaneá el QR con Expo Go y la app está viva en tu teléfono.

---

## Lo que viene

No están prometidas, pero están pensadas:

| Feature | Por qué importa |
|---|---|
| Notificaciones push | Tickets que te avisan cuando querés |
| Sincronización en la nube | Tus tickets en todos tus dispositivos |
| Sistema de usuarios | Para equipos pequeños |
| Modo claro / oscuro dinámico | Porque los ojos también importan |
| Estadísticas de productividad | Ver cuántos tickets cerraste en una semana es adictivo |

---

<div align="center">

```
[ ABIERTO ] ──────────────────────► [ COMPLETADO ]
 un tap
```

_Un ticket a la vez. Siempre._

</div>
