import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import '../theme/app_theme.dart';

const _kTutorialSeenKey = 'tutorial_completed_v2';

class TutorialService {
  static Future<bool> shouldShowTutorial() async {
    final prefs = await SharedPreferences.getInstance();
    return !(prefs.getBool(_kTutorialSeenKey) ?? false);
  }

  static Future<void> markComplete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kTutorialSeenKey, true);
  }

  static Future<void> reset() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kTutorialSeenKey);
  }

  static void showTutorial({
    required BuildContext context,
    required List<GlobalKey> navKeys,
    required List<String> navLabels,
    required List<String> navDescriptions,
    required List<IconData> navIcons,
    VoidCallback? onFinish,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final targets = <TargetFocus>[];

    for (int i = 0; i < navKeys.length; i++) {
      targets.add(
        TargetFocus(
          identify: 'nav_$i',
          keyTarget: navKeys[i],
          alignSkip: Alignment.topRight,
          enableOverlayTab: true,
          shape: ShapeLightFocus.RRect,
          radius: 14,
          paddingFocus: 8,
          contents: [
            TargetContent(
              align: i < 3 ? ContentAlign.top : ContentAlign.top,
              builder: (context, controller) => _TutorialCard(
                step: i + 1,
                totalSteps: navKeys.length,
                title: navLabels[i],
                description: navDescriptions[i],
                icon: navIcons[i],
                isDark: isDark,
                onNext: controller.next,
                onSkip: () {
                  controller.skip();
                },
                isLast: i == navKeys.length - 1,
              ),
            ),
          ],
        ),
      );
    }

    final tutorial = TutorialCoachMark(
      targets: targets,
      colorShadow: isDark ? const Color(0xFF070910) : const Color(0xFF1A1D2E),
      opacityShadow: 0.88,
      hideSkip: true,
      onFinish: () async {
        await markComplete();
        onFinish?.call();
      },
      onSkip: () {
        markComplete();
        onFinish?.call();
        return true;
      },
    );

    if (!context.mounted) return;
    final ctx = context;
    Future.delayed(const Duration(milliseconds: 600), () {
      tutorial.show(context: ctx);
    });
  }
}

class _TutorialCard extends StatelessWidget {
  final int step;
  final int totalSteps;
  final String title;
  final String description;
  final IconData icon;
  final bool isDark;
  final VoidCallback onNext;
  final VoidCallback onSkip;
  final bool isLast;

  const _TutorialCard({
    required this.step,
    required this.totalSteps,
    required this.title,
    required this.description,
    required this.icon,
    required this.isDark,
    required this.onNext,
    required this.onSkip,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final primary = isDark ? AppColors.primary : AppColors.lightPrimary;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surface.withAlpha(245) : Colors.white.withAlpha(250),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primary.withAlpha(60)),
        boxShadow: [
          BoxShadow(color: primary.withAlpha(25), blurRadius: 20, spreadRadius: 2),
          BoxShadow(color: Colors.black.withAlpha(40), blurRadius: 12),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: primary.withAlpha(25),
                border: Border.all(color: primary.withAlpha(80)),
              ),
              child: Icon(icon, size: 18, color: primary),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w700,
                  color: isDark ? AppColors.textPrimary : AppColors.lightText,
                ),
              ),
              const SizedBox(height: 2),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: primary.withAlpha(20), borderRadius: BorderRadius.circular(4)),
                  child: Text(
                    'STEP $step OF $totalSteps',
                    style: TextStyle(color: primary, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 1),
                  ),
                ),
              ]),
            ])),
          ]),
          const SizedBox(height: 12),
          Text(
            description,
            style: TextStyle(
              fontSize: 13, height: 1.4,
              color: isDark ? AppColors.textSecondary : AppColors.lightMuted,
            ),
          ),
          const SizedBox(height: 14),
          // Progress dots
          Row(children: [
            ...List.generate(totalSteps, (i) => Container(
              width: i == step - 1 ? 18 : 6, height: 6,
              margin: const EdgeInsets.only(right: 4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(3),
                color: i < step ? primary : primary.withAlpha(30),
              ),
            )),
            const Spacer(),
            if (!isLast)
              GestureDetector(
                onTap: onSkip,
                child: Text('Skip', style: TextStyle(color: AppColors.textTertiary, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            if (!isLast) const SizedBox(width: 12),
            GestureDetector(
              onTap: onNext,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: primary,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [BoxShadow(color: primary.withAlpha(60), blurRadius: 8)],
                ),
                child: Text(
                  isLast ? 'GET STARTED' : 'NEXT',
                  style: TextStyle(
                    color: isDark ? AppColors.background : Colors.white,
                    fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1,
                  ),
                ),
              ),
            ),
          ]),
        ],
      ),
    );
  }
}
