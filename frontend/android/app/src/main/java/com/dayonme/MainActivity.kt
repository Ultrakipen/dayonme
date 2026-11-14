package com.dayonme

import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Base64
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import java.security.MessageDigest

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens: 시스템 글자 크기/다크모드 변경, 메모리 부족 후 복원 시
    // 저장된 Fragment 복원으로 "Screen fragments should never be restored" 크래시가 나므로 null 전달
    super.onCreate(null)
    printKeyHash()
  }

  private fun printKeyHash() {
    try {
      val info: PackageInfo = if (android.os.Build.VERSION.SDK_INT >= 28) {
        packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES)
      } else {
        @Suppress("DEPRECATION")
        packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
      }

      val signatures = if (android.os.Build.VERSION.SDK_INT >= 28) {
        info.signingInfo?.apkContentsSigners
      } else {
        @Suppress("DEPRECATION")
        info.signatures
      }

      signatures?.forEach { signature ->
        val md = MessageDigest.getInstance("SHA")
        md.update(signature.toByteArray())
        val keyHash = Base64.encodeToString(md.digest(), Base64.NO_WRAP)
        Log.d("KAKAO_KEYHASH", "KeyHash: $keyHash")
        println("=== KAKAO KEYHASH ===")
        println("KeyHash: $keyHash")
        println("=====================")
      }
    } catch (e: Exception) {
      Log.e("KAKAO_KEYHASH", "Error: ${e.message}")
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "dayonme"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
