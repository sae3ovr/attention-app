import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? glowColor;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;

  const GlassCard({super.key, required this.child, this.padding, this.glowColor, this.borderRadius, this.onTap});

  @override
  Widget build(BuildContext context) {
    final br = borderRadius ?? BorderRadius.circular(16);
    final content = ClipRRect(
      borderRadius: br,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: padding ?? const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.glassBg,
            borderRadius: br,
            border: Border.all(color: glowColor?.withAlpha(76) ?? AppColors.glassBorder),
            boxShadow: glowColor != null ? [BoxShadow(color: glowColor!.withAlpha(38), blurRadius: 16)] : null,
          ),
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(borderRadius: br, onTap: onTap, child: content),
      );
    }
    return content;
  }
}
