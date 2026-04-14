import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import '../widgets/logo_mark.dart';
import '../providers/incidents_provider.dart';
import '../models/incident.dart';

const _catEmoji = {
  'robbery': '🚨', 'accident': '💥', 'suspicious': '👁', 'hazard': '⚠️', 'police': '🚔',
  'fire': '🔥', 'medical': '🏥', 'traffic': '🚦', 'noise': '📢', 'flood': '🌊',
  'injured_animal': '🐾', 'building_risk': '🏚️', 'other': '📍',
};

class FeedScreen extends ConsumerStatefulWidget {
  final void Function(String incidentId)? onSelectIncident;
  const FeedScreen({super.key, this.onSelectIncident});
  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(incidentsProvider.notifier).load());
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (!mounted) return;
      ref.read(incidentsProvider.notifier).load();
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(incidentsProvider);
    final sorted = [...state.incidents]..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return SafeArea(
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(children: [
            const LogoMark(size: 22),
            const SizedBox(width: 10),
            Text('Atividade', style: Theme.of(context).textTheme.headlineSmall),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.primary)),
                const SizedBox(width: 4),
                const Text('AO VIVO', style: TextStyle(color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1)),
              ]),
            ),
          ]),
        ),
        Expanded(
          child: state.isLoading && sorted.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : sorted.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 48, height: 48, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.success.withOpacity(0.12)),
                  child: const Icon(Icons.shield, color: AppColors.success, size: 24)),
                const SizedBox(height: 10),
                const Text('Área Segura', style: TextStyle(color: AppColors.success, fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                const Text('Nenhum incidente reportado', style: TextStyle(color: AppColors.textTertiary, fontSize: 11)),
              ]))
            : RefreshIndicator(
                onRefresh: () => ref.read(incidentsProvider.notifier).load(),
                color: AppColors.primary,
                child: ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: sorted.length,
                  itemBuilder: (_, i) => _IncidentTile(incident: sorted[i], onTap: widget.onSelectIncident != null ? () => widget.onSelectIncident!(sorted[i].id) : null),
                ),
              ),
        ),
      ]),
    );
  }
}

class _IncidentTile extends StatelessWidget {
  final Incident incident;
  final VoidCallback? onTap;
  const _IncidentTile({required this.incident, this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = AppColors.category(incident.category);
    final emoji = _catEmoji[incident.category] ?? '📍';
    final ago = DateTime.now().difference(incident.createdAt);
    final timeStr = ago.inMinutes < 1 ? 'now' : ago.inMinutes < 60 ? '${ago.inMinutes}m' : '${ago.inHours}h';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(children: [
        Container(
          width: 38, height: 38,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            color: color.withOpacity(0.1),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Center(child: Text(emoji, style: const TextStyle(fontSize: 18))),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
              child: Text(incident.category.toUpperCase(), style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 1)),
            ),
            const SizedBox(width: 6),
            Container(
              width: 4, height: 4,
              decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.severity(incident.severity)),
            ),
            if (incident.isVerified) ...[
              const SizedBox(width: 6),
              const Text('✓', style: TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.w800)),
            ],
          ]),
          const SizedBox(height: 3),
          Text(incident.title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
        ])),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(timeStr, style: const TextStyle(color: AppColors.textTertiary, fontSize: 10)),
          const SizedBox(height: 4),
          Row(mainAxisSize: MainAxisSize.min, children: [
            Text('👍${incident.confirmCount}', style: const TextStyle(fontSize: 9, color: AppColors.textTertiary)),
            const SizedBox(width: 4),
            Text('👎${incident.denyCount}', style: const TextStyle(fontSize: 9, color: AppColors.textTertiary)),
            const SizedBox(width: 4),
            Text('👁${incident.views}', style: const TextStyle(fontSize: 9, color: AppColors.textTertiary)),
          ]),
        ]),
      ]),
    )));
  }
}
