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

# OkHttp & Retrofit
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
# Retrofit Generic 타입 보존
-keepattributes Signature
-keepattributes Exceptions
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Gson - Generic 타입 완전 보존
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
# 모든 모델 클래스의 필드 보존
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName <fields>;
}

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }

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

# Kakao Login - React Native Seoul 패키지 (완전 보존)
-keep,includedescriptorclasses class com.dooboolab.kakaologins.** { *; }
-keep,includedescriptorclasses interface com.dooboolab.kakaologins.** { *; }
-keepclassmembers,includedescriptorclasses class com.dooboolab.kakaologins.** { *; }
-keepnames class com.dooboolab.kakaologins.** { *; }
# Kakao SDK 원본 (완전 보존)
-keep,includedescriptorclasses class com.kakao.** { *; }
-keep,includedescriptorclasses interface com.kakao.** { *; }
-keep,includedescriptorclasses class com.kakao.sdk.** { *; }
-keep,includedescriptorclasses interface com.kakao.sdk.** { *; }
-keepnames class com.kakao.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes Exceptions
-dontwarn com.kakao.**
-dontwarn com.dooboolab.kakaologins.**

# Naver Login - React Native Seoul 패키지 (완전 보존)
-keep,includedescriptorclasses class com.dooboolab.naverlogin.** { *; }
-keep,includedescriptorclasses interface com.dooboolab.naverlogin.** { *; }
-keepclassmembers,includedescriptorclasses class com.dooboolab.naverlogin.** { *; }
-keepnames class com.dooboolab.naverlogin.** { *; }
# Naver SDK 원본 (완전 보존)
-keep,includedescriptorclasses class com.nhn.** { *; }
-keep,includedescriptorclasses class com.navercorp.** { *; }
-keep,includedescriptorclasses interface com.nhn.** { *; }
-keep,includedescriptorclasses interface com.navercorp.** { *; }
-keep,includedescriptorclasses class com.naver.** { *; }
-keepnames class com.nhn.** { *; }
-keepnames class com.navercorp.** { *; }
-keepnames class com.naver.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes Exceptions
-dontwarn com.nhn.**
-dontwarn com.navercorp.**
-dontwarn com.naver.**
-dontwarn com.dooboolab.naverlogin.**

# Reflection 관련 ClassCastException 방지
-keepattributes Signature,RuntimeVisibleAnnotations,AnnotationDefault
-keep class kotlin.Metadata { *; }
-keep class kotlin.reflect.** { *; }
-dontwarn kotlin.reflect.**

# Generic 타입 정보 유지 (ParameterizedType 오류 방지) - 강화
-keepattributes Signature
-keepattributes Exceptions
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations
-keepattributes RuntimeInvisibleParameterAnnotations
-keepattributes AnnotationDefault
-keep class * extends java.lang.reflect.ParameterizedType { *; }
-keep class * extends java.lang.reflect.Type { *; }
-keep class * extends java.lang.reflect.GenericArrayType { *; }
-keep class * extends java.lang.reflect.WildcardType { *; }
-keep class * extends java.lang.reflect.TypeVariable { *; }
# Promise와 Callback 타입 보존
-keep class com.facebook.react.bridge.Promise { *; }
-keep class com.facebook.react.bridge.Callback { *; }
-keep class com.facebook.react.bridge.ReadableMap { *; }
-keep class com.facebook.react.bridge.WritableMap { *; }
-keep class com.facebook.react.bridge.ReadableArray { *; }
-keep class com.facebook.react.bridge.WritableArray { *; }

# Kotlin 관련 추가 설정
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

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
