# LK Studio — R8 / ProGuard rules for the Capacitor Android shell.
# Applied to android/app/proguard-rules.pro by scripts/patch-android-release.ps1

# Capacitor plugins (reflection-based bridge)
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.Permission <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep public class * extends com.getcapacitor.Plugin { *; }

# Legacy Capacitor v2 plugin annotations
-keep @com.getcapacitor.NativePlugin public class * {
    @com.getcapacitor.PluginMethod public <methods>;
}

# Cordova compatibility layer (Capacitor plugins may use it)
-keep public class * extends org.apache.cordova.* {
    public <methods>;
    public <fields>;
}

# WebView JavaScript bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# App entry point
-keep class com.lkstudio.app.MainActivity { *; }

# Readable stack traces in Play Console crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
