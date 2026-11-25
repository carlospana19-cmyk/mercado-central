import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// La clave de Google Maps vive en android/local.properties (MAPS_API_KEY=...), que git ignora.
val localProps = Properties()
rootProject.file("local.properties").takeIf { it.exists() }?.inputStream()?.use { stream ->
    localProps.load(stream)
}

// Firma de producción: android/key.properties (git lo ignora) apunta al keystore
// android/app/upload-keystore.jks. Si no existe (otro equipo, CI), el build
// release cae a la firma debug para que `flutter run --release` siga funcionando,
// pero ESE APK no sirve para subir a Google Play.
val keyProps = Properties()
val keyPropsFile = rootProject.file("key.properties")
if (keyPropsFile.exists()) {
    keyPropsFile.inputStream().use { stream -> keyProps.load(stream) }
}

android {
    namespace = "com.example.mercadocentral_app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // ID definitivo de la app en Google Play (NO se puede cambiar una vez publicada).
        // El namespace de arriba se queda en com.example.mercadocentral_app: es solo el
        // paquete del código (MainActivity) y es independiente del applicationId.
        applicationId = "com.mercadoscentral.app"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["MAPS_API_KEY"] = localProps.getProperty("MAPS_API_KEY") ?: ""
    }

    signingConfigs {
        create("release") {
            if (keyPropsFile.exists()) {
                keyAlias = keyProps.getProperty("keyAlias")
                keyPassword = keyProps.getProperty("keyPassword")
                storePassword = keyProps.getProperty("storePassword")
                storeFile = keyProps.getProperty("storeFile")?.let { file(it) }
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (keyPropsFile.exists()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}
