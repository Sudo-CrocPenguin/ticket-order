# Expo updates

La app movil vive en `apps/mobile` y usa `expo-updates` + EAS Update para mostrar una pantalla de
actualizacion cuando existe una nueva version OTA compatible.

## Que cubre

EAS Update sirve para cambios de JavaScript, estilos, pantallas, textos e
imagenes incluidas en el bundle.

No sirve para cambios nativos como:

- Agregar o quitar dependencias nativas.
- Cambiar permisos.
- Cambiar SDK de Expo.
- Cambiar configuracion nativa de Android/iOS.

Para esos casos se necesita una nueva build con EAS Build.

## Configuracion

La app tiene:

```json
"runtimeVersion": {
  "policy": "appVersion"
},
"updates": {
  "url": "https://u.expo.dev/42d2c77c-665b-4326-9f07-a5919af99e12",
  "checkAutomatically": "NEVER"
}
```

`checkAutomatically: "NEVER"` permite que `UpdateGate` controle el aviso y
muestre la pantalla antes de cargar el resto de la aplicacion.

## Publicar una actualizacion OTA

Despues de tener una build instalada que incluya `expo-updates`, publica cambios
JS/UI con:

```bash
cd apps/mobile
eas update --channel production --message "Descripcion del cambio"
```

Para pruebas internas:

```bash
cd apps/mobile
eas update --channel preview --message "Prueba de actualizacion"
```

## Build requerida

La primera vez que agregas `expo-updates` debes generar e instalar una nueva
build, porque es una dependencia nativa:

```bash
cd apps/mobile
eas build --profile production --platform android
```

o para prueba interna:

```bash
cd apps/mobile
eas build --profile preview --platform android
```

La pantalla de actualizacion no se puede validar completamente en Expo Go. Expo
indica que la API completa de updates funciona en builds release.
