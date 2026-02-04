# 📱 Mercado Central - Aplicaciones Móviles

Aplicaciones nativas para Android (Play Store) e iOS (App Store) creadas con Capacitor.

## 🚀 Inicio Rápido

### 1. Preparar Recursos
```bash
npm run resources
```

### 2. Construir para Android
```bash
npm run build:android
```

### 3. Construir para iOS
```bash
npm run build:ios
```

## 📋 Requisitos Previos

### Para Android:
- **Android Studio** instalado
- **JDK 11+** configurado
- **Android SDK** 22+

### Para iOS:
- **macOS** (requerido para desarrollo iOS)
- **Xcode** 13+
- **iOS Simulator** o dispositivo físico

## 🛠️ Desarrollo

### Sincronizar Cambios
```bash
# Sincronizar todos los cambios con plataformas nativas
npm run sync

# Sincronizar solo Android
npm run sync:android

# Sincronizar solo iOS
npm run sync:ios
```

### Actualizar Web Assets
```bash
npm run build:web
```

## 📱 Configuración de Aplicaciones

### Android (Play Store)
1. Abrir Android Studio
2. Importar proyecto: `android/`
3. Configurar firma de aplicación
4. Build → Generate Signed APK/Bundle
5. Subir a Google Play Console

### iOS (App Store)
1. Abrir Xcode
2. Abrir proyecto: `ios/App/App.xcodeproj`
3. Configurar firma de código (Apple Developer)
4. Archive → Upload to App Store
5. Subir via App Store Connect

## 🎨 Personalización

### Iconos y Splash Screens
- **Icono**: `resources/icon.png` (1024x1024 recomendado)
- **Splash**: `resources/splash.png` (2732x2732 recomendado)
- **Colores**: Configurados en `package.json` scripts

### Generar Recursos Automáticamente
```bash
npm run resources
```

## 📦 Estructura del Proyecto

```
mercado-central/
├── www/                    # Web assets para móviles
├── android/               # Proyecto Android nativo
├── ios/                   # Proyecto iOS nativo
├── resources/             # Iconos y splash screens
├── capacitor.config.json  # Configuración Capacitor
└── package.json          # Scripts de construcción
```

## 🔧 Configuración Capacitor

```json
{
  "appId": "com.mercadocentral.app",
  "appName": "Mercado Central",
  "webDir": "www"
}
```

## 📋 Checklist de Publicación

### Android (Play Store):
- [ ] Generar Signed APK/AAB
- [ ] Crear cuenta Google Play Developer ($25)
- [ ] Configurar app en Play Console
- [ ] Subir APK/AAB
- [ ] Completar store listing
- [ ] Configurar precios y distribución
- [ ] Enviar a revisión

### iOS (App Store):
- [ ] Generar Archive en Xcode
- [ ] Crear cuenta Apple Developer ($99/año)
- [ ] Configurar app en App Store Connect
- [ ] Subir build
- [ ] Completar app information
- [ ] Configurar screenshots
- [ ] Enviar a revisión

## 🚀 Funcionalidades Móviles

✅ **Aplicación Web Completa** empaquetada como app nativa
✅ **Acceso Offline** básico
✅ **Notificaciones Push** (configurables)
✅ **Cámara** para subir fotos
✅ **GPS** para ubicación
✅ **Almacenamiento Local** para datos

## 🐛 Solución de Problemas

### Android:
- Verificar Android SDK path
- Asegurar JDK 11+
- Limpiar y rebuild en Android Studio

### iOS:
- Verificar Xcode versión
- Configurar team de desarrollo
- Verificar provisioning profiles

## 📞 Soporte

Para soporte técnico contactar al equipo de desarrollo.

# Flujo para actualizar la app Android tras cambios en el código web

1. Realiza tus cambios en los archivos fuente (JS, HTML, CSS, etc.) usando VS Code.
2. Compila los assets web:
   
   npm run build

3. Sincroniza los cambios con el proyecto Android:
   
   npx cap copy android

4. Abre Android Studio (o si ya está abierto, espera a que detecte los cambios).
5. Genera el APK/AAB desde Android Studio como de costumbre.

¡Listo! No necesitas volver a importar archivos manualmente. El proceso es automático, similar a un push en git.