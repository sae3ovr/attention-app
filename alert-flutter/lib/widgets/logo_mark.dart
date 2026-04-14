import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class LogoMark extends StatefulWidget {
  final double size;
  final Color color;
  final bool spinning;

  const LogoMark({super.key, this.size = 40, this.color = AppColors.primary, this.spinning = true});

  @override
  State<LogoMark> createState() => _LogoMarkState();
}

class _LogoMarkState extends State<LogoMark> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 8));
    if (widget.spinning) _ctrl.repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: RepaintBoundary(
        child: _RadarWidget(ctrl: _ctrl, color: widget.color, size: widget.size),
      ),
    );
  }
}

class _RadarWidget extends AnimatedWidget {
  final Color color;
  final double size;

  const _RadarWidget({required AnimationController ctrl, required this.color, required this.size})
      : super(listenable: ctrl);

  @override
  Widget build(BuildContext context) {
    final ctrl = listenable as AnimationController;
    return CustomPaint(
      size: Size(size, size),
      painter: _RadarPainter(color: color, sweep: ctrl.value * 2 * pi),
    );
  }
}

class _RadarPainter extends CustomPainter {
  final Color color;
  final double sweep;

  _RadarPainter({required this.color, required this.sweep});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width / 2;

    final ringPaint = Paint()..style = PaintingStyle.stroke..strokeWidth = 0.8;
    for (final frac in [0.95, 0.73, 0.52, 0.30]) {
      ringPaint.color = color.withOpacity(0.1 + frac * 0.25);
      canvas.drawCircle(Offset(cx, cy), r * frac, ringPaint);
    }

    canvas.drawCircle(Offset(cx, cy), r * 0.08, Paint()..color = color.withOpacity(0.85));

    final crossPaint = Paint()..color = color.withOpacity(0.25)..strokeWidth = 0.7..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(cx, r * 0.05), Offset(cx, r * 0.18), crossPaint);
    canvas.drawLine(Offset(cx, size.height - r * 0.05), Offset(cx, size.height - r * 0.18), crossPaint);
    canvas.drawLine(Offset(r * 0.05, cy), Offset(r * 0.18, cy), crossPaint);
    canvas.drawLine(Offset(size.width - r * 0.05, cy), Offset(size.width - r * 0.18, cy), crossPaint);

    final blipPaint = Paint()..color = color.withOpacity(0.5);
    canvas.drawCircle(Offset(cx - r * 0.45, cy - r * 0.3), r * 0.04, blipPaint);
    blipPaint.color = color.withOpacity(0.35);
    canvas.drawCircle(Offset(cx + r * 0.25, cy + r * 0.5), r * 0.03, blipPaint);

    final sweepPath = Path()
      ..moveTo(cx, cy)
      ..arcTo(Rect.fromCircle(center: Offset(cx, cy), radius: r * 0.8), sweep - 0.5, 0.5, false)
      ..close();
    canvas.drawPath(sweepPath, Paint()..color = color.withOpacity(0.08));

    final endX = cx + r * 0.7 * cos(sweep);
    final endY = cy + r * 0.7 * sin(sweep);
    canvas.drawLine(Offset(cx, cy), Offset(endX, endY),
        Paint()..color = color.withOpacity(0.7)..strokeWidth = 1.4..strokeCap = StrokeCap.round);
  }

  @override
  bool shouldRepaint(_RadarPainter old) => old.sweep != sweep;
}
