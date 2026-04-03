# Ticket Order App

Aplicación móvil desarrollada con React Native y Expo para la gestión de tareas mediante un sistema de tickets.

---

## Descripción

Ticket Order es una app enfocada en la organización personal de actividades, permitiendo crear, gestionar y completar tickets de forma sencilla.

Cada ticket incluye:

* ID único incremental
* Título
* Descripción

Los tickets pueden marcarse como completados y automáticamente pasan al historial, manteniendo un registro ordenado de las tareas realizadas.

---

## Características

* Crear tickets
* Lista de tickets activos
* Completar tickets (pasan al historial)
* Historial de tickets completados
* Buscador de tickets
* Sistema de filtros
* Persistencia de datos (AsyncStorage)
* Navegación por pestañas
* Animaciones en interacciones

---

## Instalación

### Requisitos

* Node.js
* Expo CLI

### Clonar el repositorio

```bash
git clone git@github.com:Sudo-CrocPenguin/ticket-order.git
cd ticket-order
```

### Instalar dependencias

```bash
npm install
```

### Ejecutar la app

```bash
npx expo start
```

Escanea el código QR con Expo Go para probar la app en tu dispositivo.

---

## Instalación en Android (APK)

Puedes instalar la versión ya compilada desde el siguiente enlace:

https://expo.dev/accounts/sudo-crocpenguin/projects/ticket-order/builds/33c6e657-6a98-4be5-8c64-6c27c3820a64

---

## Próximas mejoras

* Notificaciones
* Sincronización en la nube
* Sistema de usuarios
* Modo claro/oscuro dinámico
* Estadísticas de productividad
