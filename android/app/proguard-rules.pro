# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Fix for PDFBox missing JP2Decoder class during R8 minification
-dontwarn com.gemalto.jp2.**
-keep class com.gemalto.jp2.** { *; }
-dontwarn com.tom_roush.pdfbox.filter.JPXFilter