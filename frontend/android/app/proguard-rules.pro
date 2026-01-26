# Add project specific ProGuard rules here.

# React Native
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }
-keep class com.facebook.react.animated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Hermes
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# React Native Config
-keep class com.dayonme.BuildConfig { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Gson
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-dontwarn com.swmansion.reanimated.**
-dontwarn com.swmansion.worklets.**

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native Image Picker
-keep class com.imagepicker.** { *; }

# React Native WebView
-keep class com.reactnativecommunity.webview.** { *; }

# React Native Fast Image
-keep class com.dylanvann.fastimage.** { *; }
-keep public class com.bumptech.glide.** { *; }

# Kakao Login
-keep class com.kakao.** { *; }
-dontwarn com.kakao.**

# Naver Login
-keep class com.nhn.** { *; }
-keep class com.navercorp.** { *; }
-dontwarn com.nhn.**

# OneSignal
-keep class com.onesignal.** { *; }
-dontwarn com.onesignal.**

# Sentry
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# Socket.io
-keep class io.socket.** { *; }
-dontwarn io.socket.**

# Keep native methods
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
    @com.facebook.react.uimanager.annotations.ReactProp *;
    @com.facebook.react.uimanager.annotations.ReactPropGroup *;
}

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# General Android
-keep class * implements android.os.Parcelable { *; }
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Suppress warnings
-dontwarn javax.annotation.**
-dontwarn sun.misc.Unsafe
-dontwarn com.facebook.react.**
