import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'map_screen.dart';
import 'feed_screen.dart';
import 'chain_screen.dart';
import 'family_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens = [
    const MapScreen(),
    FeedScreen(onSelectIncident: (id) => setState(() => _currentIndex = 0)),
    const ChainScreen(),
    const FamilyScreen(),
    const ProfileScreen(),
  ];
  static const _labels = ['Map', 'Feed', 'Chain', 'Family', 'Profile'];
  static const _icons = [Icons.map_outlined, Icons.feed_outlined, Icons.link, Icons.family_restroom_outlined, Icons.person_outline];
  static const _activeIcons = [Icons.map, Icons.feed, Icons.link, Icons.family_restroom, Icons.person];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final navBg = isDark ? AppColors.background : AppColors.lightBackground;
    final primary = Theme.of(context).colorScheme.primary;
    final muted = isDark ? AppColors.textTertiary : AppColors.lightMuted;

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(color: navBg, border: Border(top: BorderSide(color: isDark ? AppColors.border : AppColors.lightBorder, width: 0.5))),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 58,
            child: Row(
              children: List.generate(_screens.length, (i) {
                final active = _currentIndex == i;
                return Expanded(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => setState(() => _currentIndex = i),
                      splashColor: primary.withAlpha(30),
                      highlightColor: primary.withAlpha(15),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
                            decoration: BoxDecoration(
                              color: active ? primary.withAlpha(25) : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(active ? _activeIcons[i] : _icons[i], size: 22, color: active ? primary : muted),
                          ),
                          const SizedBox(height: 2),
                          Text(_labels[i], style: TextStyle(color: active ? primary : muted, fontSize: 9, fontWeight: active ? FontWeight.w700 : FontWeight.w400, letterSpacing: 0.3)),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
