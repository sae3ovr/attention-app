import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Theme mode provider
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) => ThemeModeNotifier());

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.dark);
  void toggle() => state = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
  void setDark() => state = ThemeMode.dark;
  void setLight() => state = ThemeMode.light;
}

class AppColors {
  // Dark palette (matching web app Colors)
  static const background = Color(0xFF0D1117);
  static const backgroundLight = Color(0xFF161B22);
  static const surface = Color(0xFF1C2333);
  static const surfaceLight = Color(0xFF21293A);

  static const primary = Color(0xFF00FF88);
  static const primaryDim = Color(0xFF00CC6E);
  static const secondary = Color(0xFF7B61FF);
  static const accent = Color(0xFFFF3B7A);
  static const warning = Color(0xFFFFB800);
  static const error = Color(0xFFFF4444);
  static const success = Color(0xFF00FF88);
  static const cyan = Color(0xFF00D4FF);

  static const textPrimary = Color(0xFFE6EDF3);
  static const textSecondary = Color(0xFF8B949E);
  static const textTertiary = Color(0xFF6E7681);
  static const textDisabled = Color(0xFF484F58);
  static const border = Color(0x14FFFFFF);
  static const glass = Color(0x18FFFFFF);
  static const glassBg = Color(0xBF0D1117);
  static const glassBorder = Color(0x14FFFFFF);

  // Light palette (matching web app LightColors)
  static const lightBackground = Color(0xFFFAFBFE);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightPrimary = Color(0xFF009973);
  static const lightText = Color(0xFF1A1D2E);
  static const lightMuted = Color(0xFF555B6E);
  static const lightBorder = Color(0x12000000);

  static Color severity(String s) {
    switch (s) {
      case 'low': return primary;
      case 'medium': return warning;
      case 'high': return const Color(0xFFFF7A3B);
      case 'critical': return error;
      default: return textTertiary;
    }
  }

  static Color category(String c) {
    switch (c) {
      case 'robbery': return const Color(0xFFFF4444);
      case 'accident': return const Color(0xFFFF7A3B);
      case 'suspicious': return const Color(0xFFFFB800);
      case 'hazard': return const Color(0xFFFF3B7A);
      case 'police': return const Color(0xFF3B7AFF);
      case 'fire': return const Color(0xFFFF5522);
      case 'medical': return const Color(0xFFFF3B7A);
      case 'traffic': return const Color(0xFFFFB800);
      case 'noise': return const Color(0xFF7B61FF);
      case 'flood': return const Color(0xFF0EA5E9);
      case 'injured_animal': return const Color(0xFFD97706);
      case 'building_risk': return const Color(0xFFB91C1C);
      default: return const Color(0xFF8A8A9A);
    }
  }
}

class AppTheme {
  static ThemeData get dark {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.surface,
        error: AppColors.error,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 28, letterSpacing: -1, fontFamily: 'monospace'),
        headlineMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 22, letterSpacing: -0.5, fontFamily: 'monospace'),
        headlineSmall: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 18, fontFamily: 'monospace'),
        bodyLarge: TextStyle(color: AppColors.textPrimary, fontSize: 15),
        bodyMedium: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        bodySmall: TextStyle(color: AppColors.textTertiary, fontSize: 11),
        labelLarge: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 12, letterSpacing: 1.5, fontFamily: 'monospace'),
      ),
      appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, elevation: 0, centerTitle: false),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.background,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textTertiary,
      ),
      cardTheme: CardTheme(color: AppColors.surface, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.border)), elevation: 0),
      elevatedButtonTheme: ElevatedButtonThemeData(style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary, foregroundColor: AppColors.background,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 1),
      )),
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: AppColors.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary)),
        hintStyle: const TextStyle(color: AppColors.textTertiary, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      snackBarTheme: SnackBarThemeData(backgroundColor: AppColors.surface, contentTextStyle: const TextStyle(color: AppColors.textPrimary, fontSize: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), behavior: SnackBarBehavior.floating),
    );
  }

  static ThemeData get light {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.lightBackground,
      colorScheme: const ColorScheme.light(
        primary: AppColors.lightPrimary,
        secondary: AppColors.secondary,
        surface: AppColors.lightSurface,
        error: AppColors.error,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(color: AppColors.lightText, fontWeight: FontWeight.w700, fontSize: 28, letterSpacing: -1, fontFamily: 'monospace'),
        headlineMedium: TextStyle(color: AppColors.lightText, fontWeight: FontWeight.w700, fontSize: 22, letterSpacing: -0.5, fontFamily: 'monospace'),
        headlineSmall: TextStyle(color: AppColors.lightText, fontWeight: FontWeight.w700, fontSize: 18, fontFamily: 'monospace'),
        bodyLarge: TextStyle(color: AppColors.lightText, fontSize: 15),
        bodyMedium: TextStyle(color: AppColors.lightMuted, fontSize: 13),
        bodySmall: TextStyle(color: AppColors.textTertiary, fontSize: 11),
        labelLarge: TextStyle(color: AppColors.lightPrimary, fontWeight: FontWeight.w700, fontSize: 12, letterSpacing: 1.5, fontFamily: 'monospace'),
      ),
      appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, elevation: 0, centerTitle: false),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.lightBackground,
        selectedItemColor: AppColors.lightPrimary,
        unselectedItemColor: AppColors.lightMuted,
      ),
      cardTheme: CardTheme(color: AppColors.lightSurface, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.lightBorder)), elevation: 0),
      elevatedButtonTheme: ElevatedButtonThemeData(style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.lightPrimary, foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 1),
      )),
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: const Color(0xFFF5F6FA),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.lightBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.lightBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.lightPrimary)),
        hintStyle: const TextStyle(color: AppColors.textTertiary, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      snackBarTheme: SnackBarThemeData(backgroundColor: AppColors.lightSurface, contentTextStyle: const TextStyle(color: AppColors.lightText, fontSize: 13), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), behavior: SnackBarBehavior.floating),
    );
  }
}
