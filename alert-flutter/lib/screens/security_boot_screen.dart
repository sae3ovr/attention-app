import 'dart:async';
import 'package:flutter/material.dart';
import '../widgets/logo_mark.dart';
import '../theme/app_theme.dart';

class _BootStep {
  final String label;
  final String icon;
  final int durationMs;
  const _BootStep(this.label, this.icon, this.durationMs);
}

const _steps = [
  _BootStep('Initializing security protocols...', '🔐', 600),
  _BootStep('Verifying encrypted connection...', '🔒', 500),
  _BootStep('Authenticating device signature...', '📱', 550),
  _BootStep('Loading threat intelligence database...', '🛡️', 600),
  _BootStep('Scanning network perimeter...', '📡', 500),
  _BootStep('Establishing real-time feed...', '🌐', 450),
  _BootStep('System ready.', '✅', 400),
];

class SecurityBootScreen extends StatefulWidget {
  final VoidCallback onComplete;
  const SecurityBootScreen({super.key, required this.onComplete});

  @override
  State<SecurityBootScreen> createState() => _SecurityBootScreenState();
}

class _SecurityBootScreenState extends State<SecurityBootScreen> with TickerProviderStateMixin {
  int _currentStep = -1;
  final List<int> _completedSteps = [];
  late final AnimationController _logoCtrl;
  late final Animation<double> _logoScale;
  late final AnimationController _fadeCtrl;
  late final AnimationController _progressCtrl;
  late final AnimationController _glowCtrl;

  @override
  void initState() {
    super.initState();
    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _logoScale = CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut);
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500), value: 1.0);
    _progressCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 3600));
    _glowCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))..repeat(reverse: true);

    _logoCtrl.forward();
    _runSequence();
  }

  Future<void> _runSequence() async {
    await Future.delayed(const Duration(milliseconds: 500));
    for (int i = 0; i < _steps.length; i++) {
      if (!mounted) return;
      setState(() => _currentStep = i);
      _progressCtrl.animateTo((i + 1) / _steps.length, duration: Duration(milliseconds: (_steps[i].durationMs * 0.8).round()), curve: Curves.easeOutCubic);
      await Future.delayed(Duration(milliseconds: _steps[i].durationMs));
      if (!mounted) return;
      setState(() => _completedSteps.add(i));
    }
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    _fadeCtrl.reverse().then((_) {
      if (mounted) widget.onComplete();
    });
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _fadeCtrl.dispose();
    _progressCtrl.dispose();
    _glowCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeCtrl,
      child: Container(
        color: const Color(0xFF070910),
        child: DefaultTextStyle(
          style: const TextStyle(decoration: TextDecoration.none, color: AppColors.textPrimary),
          child: SafeArea(
            child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo
                  ScaleTransition(
                    scale: _logoScale,
                    child: _AnimBuilder(
                      animation: _glowCtrl,
                      builder: (context, child) => Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.15 + _glowCtrl.value * 0.15), blurRadius: 20 + _glowCtrl.value * 10)],
                        ),
                        child: child,
                      ),
                      child: const LogoMark(size: 80, spinning: true),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Title
                  FadeTransition(
                    opacity: _logoScale,
                    child: Column(children: [
                      RichText(text: TextSpan(style: const TextStyle(fontFamily: 'monospace', fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 4, decoration: TextDecoration.none), children: [
                        const TextSpan(text: 'ALERT'),
                        TextSpan(text: '.IO', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w400, decoration: TextDecoration.none)),
                      ])),
                      const SizedBox(height: 6),
                      Text('SECURITY INITIALIZATION', style: TextStyle(fontFamily: 'monospace', fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.primary.withOpacity(0.6), letterSpacing: 3, decoration: TextDecoration.none)),
                    ]),
                  ),
                  const SizedBox(height: 40),

                  // Boot log
                  SizedBox(
                    width: 360,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: List.generate(_steps.length, (i) {
                        final isActive = i == _currentStep;
                        final isDone = _completedSteps.contains(i);
                        final isVisible = i <= _currentStep;
                        if (!isVisible) return const SizedBox.shrink();
                        return AnimatedOpacity(
                          opacity: isVisible ? 1.0 : 0.0,
                          duration: const Duration(milliseconds: 200),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                            margin: const EdgeInsets.only(bottom: 2),
                            decoration: BoxDecoration(
                              color: isActive ? AppColors.primary.withOpacity(0.04) : Colors.transparent,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(children: [
                              SizedBox(
                                width: 20,
                                child: Text(
                                  isDone ? '✓' : isActive ? _steps[i].icon : '○',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: isDone ? AppColors.primary : const Color(0xFF3A3F4B)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _steps[i].label,
                                  style: TextStyle(fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.3, color: isDone ? const Color(0xFF4A5060) : isActive ? const Color(0xFF8B949E) : const Color(0xFF3A3F4B)),
                                ),
                              ),
                              if (isActive && !isDone)
                                _AnimBuilder(
                                  animation: _glowCtrl,
                                  builder: (_, __) => Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.primary.withOpacity(_glowCtrl.value))),
                                ),
                            ]),
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Progress bar
                  SizedBox(
                    width: 360,
                    child: Row(children: [
                      _AnimBuilder(
                        animation: _progressCtrl,
                        builder: (_, __) => Text(
                          'STEP ${_currentStep < 0 ? 0 : _currentStep + 1} / ${_steps.length}',
                          style: TextStyle(fontFamily: 'monospace', fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.primary.withOpacity(0.5), letterSpacing: 1),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.04), borderRadius: BorderRadius.circular(2)),
                          child: _AnimBuilder(
                            animation: _progressCtrl,
                            builder: (_, __) => FractionallySizedBox(
                              alignment: Alignment.centerLeft,
                              widthFactor: _progressCtrl.value,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(2),
                                  boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 6)],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      _AnimBuilder(
                        animation: _progressCtrl,
                        builder: (_, __) => Text(
                          '${(_progressCtrl.value * 100).round()}%',
                          style: TextStyle(fontFamily: 'monospace', fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primary.withOpacity(0.7), letterSpacing: 1),
                        ),
                      ),
                    ]),
                  ),
                ],
              ),
            ),
          ),
        ),
        ),
      ),
    );
  }
}

class _AnimBuilder extends AnimatedWidget {
  final Widget Function(BuildContext, Widget?) builder;
  final Widget? child;
  const _AnimBuilder({required Animation<double> animation, required this.builder, this.child}) : super(listenable: animation);
  @override
  Widget build(BuildContext context) => builder(context, child);
}
