import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../theme/app_theme.dart';
import '../widgets/logo_mark.dart';
import '../data/badges.dart';
import '../providers/auth_provider.dart';
import '../providers/tracking_provider.dart';

const _emergencyServices = [
  {'label': 'Polícia', 'icon': Icons.local_police, 'phone': '190', 'color': 0xFF3B7AFF},
  {'label': 'Bombeiros', 'icon': Icons.local_fire_department, 'phone': '193', 'color': 0xFFFF5522},
  {'label': 'Ambulância', 'icon': Icons.local_hospital, 'phone': '192', 'color': 0xFFFF3B7A},
  {'label': 'Serviço Social', 'icon': Icons.volunteer_activism, 'phone': '100', 'color': 0xFF7B61FF},
  {'label': 'Proteção Animal', 'icon': Icons.pets, 'phone': '0800-111-000', 'color': 0xFFFFB800},
  {'label': 'Defesa Civil', 'icon': Icons.shield, 'phone': '199', 'color': 0xFF00D4FF},
];

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _showLevelList = false;
  bool _ghostMode = false;
  String _sosContact = 'Contato SOS — configurar';
  String _selectedLang = 'PT';

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    if (user == null) return const Center(child: Text('Não autenticado', style: TextStyle(color: AppColors.textTertiary)));

    final badge = getBadgeForReputation(user.reputation);
    final tracked = ref.watch(trackingProvider);
    final progress = getProgressToNextLevel(user.reputation, badge);

    return Stack(children: [
      SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [const LogoMark(size: 20), const Spacer()]),
            const SizedBox(height: 8),

            // ── Profile card with guardian pip ──
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: badge.color.withOpacity(0.2))),
              child: Row(children: [
                Stack(children: [
                  Container(
                    width: 46, height: 46,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: badge.color.withOpacity(0.12), border: Border.all(color: badge.color, width: 2)),
                    child: Center(child: Text(user.displayName.isNotEmpty ? user.displayName[0].toUpperCase() : '?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: badge.color))),
                  ),
                  if (user.isGuardian)
                    Positioned(bottom: 0, right: 0, child: Container(
                      width: 16, height: 16, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.background, border: Border.all(color: AppColors.primary, width: 1.5)),
                      child: const Center(child: Text('🛡️', style: TextStyle(fontSize: 8))),
                    )),
                ]),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(user.displayName, style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: () => setState(() => _showLevelList = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: badge.color.withAlpha(20), borderRadius: BorderRadius.circular(8), border: Border.all(color: badge.color.withAlpha(50))),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text(badge.icon, style: const TextStyle(fontSize: 14)),
                        const SizedBox(width: 4),
                        Text(badge.name, style: TextStyle(color: badge.color, fontSize: 11, fontWeight: FontWeight.w700)),
                        const SizedBox(width: 4),
                        Text('Nv.${badge.level}', style: const TextStyle(color: AppColors.textTertiary, fontSize: 9)),
                        const SizedBox(width: 4),
                        const Icon(Icons.chevron_right, size: 14, color: AppColors.textTertiary),
                      ]),
                    ),
                  ),
                ])),
              ]),
            ),
            const SizedBox(height: 8),

            // ── Reputation + progress bar ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: badge.color.withOpacity(0.15))),
              child: Column(children: [
                Row(children: [
                  Text('Reputação', style: TextStyle(color: AppColors.textTertiary, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 1)),
                  const Spacer(),
                  Text('${user.reputation}', style: TextStyle(color: badge.color, fontSize: 14, fontWeight: FontWeight.w800, fontFamily: 'monospace')),
                  const SizedBox(width: 3),
                  const Text('pts', style: TextStyle(color: AppColors.textTertiary, fontSize: 8)),
                ]),
                const SizedBox(height: 6),
                if (user.isGuardian)
                  Container(
                    height: 22, alignment: Alignment.center,
                    decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
                    child: Text('NÍVEL MÁXIMO', style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w700)),
                  )
                else
                  ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: LinearProgressIndicator(value: progress, minHeight: 6, backgroundColor: AppColors.glass, valueColor: AlwaysStoppedAnimation(badge.color)),
                  ),
              ]),
            ),
            const SizedBox(height: 8),

            // ── Stats grid ──
            Row(children: [
              _statCard('Relatórios', '${user.totalReports}', AppColors.primary),
              const SizedBox(width: 6),
              _statCard('Confirmações', '${user.totalConfirmations}', AppColors.cyan),
              const SizedBox(width: 6),
              _statCard('Hoje', user.dailyReportLimit == -1 ? '${user.reportsToday}/∞' : '${user.reportsToday}/${user.dailyReportLimit}', AppColors.warning),
            ]),
            if (user.isGuardian) ...[
              const SizedBox(height: 6),
              Row(children: [
                _statCard('Verificados', '${user.verifiedIncidents}', AppColors.primary),
                const SizedBox(width: 6),
                _statCard('Removidos', '${user.removedIncidents}', AppColors.error),
                const SizedBox(width: 6),
                _statCard('Mentorados', '${user.mentees}', AppColors.secondary),
              ]),
            ],
            const SizedBox(height: 10),

            // ── SOS + Family Alert ──
            Row(children: [
              Expanded(child: _emergencyBtn('🚨', 'Alerta Família', AppColors.error, _sendFamilyAlert)),
              const SizedBox(width: 6),
              Expanded(child: _emergencyBtn('🆘', 'S.O.S.', AppColors.warning, _sendSOS)),
            ]),
            const SizedBox(height: 6),
            GestureDetector(
              onTap: _showSOSConfig,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  const Icon(Icons.contact_phone, size: 14, color: AppColors.textTertiary),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_sosContact, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11))),
                  Text('Configurar', style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w700)),
                ]),
              ),
            ),
            const SizedBox(height: 16),

            // ── Emergency services grid ──
            _sectionHeader('Serviços de Emergência', Icons.phone_in_talk),
            const SizedBox(height: 6),
            GridView.count(
              crossAxisCount: 3, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 6, crossAxisSpacing: 6, childAspectRatio: 1.15,
              children: _emergencyServices.map((s) => _emergencyServiceBtn(s)).toList(),
            ),
            const SizedBox(height: 12),

            // ── Tracked items ──
            _sectionHeader('Itens Rastreados', Icons.track_changes),
            const SizedBox(height: 6),
            if (tracked.items.isEmpty)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  const Icon(Icons.info_outline, color: AppColors.textTertiary, size: 16),
                  const SizedBox(width: 10),
                  const Expanded(child: Text('Nenhum item rastreado', style: TextStyle(color: AppColors.textTertiary, fontSize: 12))),
                  _miniBtn('Adicionar', _showAddTracked),
                ]),
              )
            else ...[
              ...tracked.items.map((item) {
                final color = _typeColor(item.itemType);
                final hasLoc = item.hasLocation;
                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Row(children: [
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(shape: BoxShape.circle, color: color.withAlpha(25), border: Border.all(color: color.withAlpha(80))),
                        child: Icon(_typeIcon(item.itemType), color: color, size: 16),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(item.name, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                        Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(color: color.withAlpha(20), borderRadius: BorderRadius.circular(3)),
                            child: Text(item.itemType.toUpperCase(), style: TextStyle(color: color, fontSize: 7, fontWeight: FontWeight.w800, letterSpacing: 1)),
                          ),
                          const SizedBox(width: 6),
                          Container(width: 5, height: 5, decoration: BoxDecoration(shape: BoxShape.circle, color: hasLoc ? AppColors.success : AppColors.textTertiary)),
                          const SizedBox(width: 3),
                          Text(hasLoc ? item.lastSeenLabel : 'No location', style: TextStyle(color: hasLoc ? AppColors.textSecondary : AppColors.textTertiary, fontSize: 9)),
                        ]),
                      ])),
                      GestureDetector(
                        onTap: () => _confirmDelete(item),
                        child: Container(
                          width: 28, height: 28,
                          decoration: BoxDecoration(borderRadius: BorderRadius.circular(6), color: AppColors.error.withAlpha(15)),
                          child: const Icon(Icons.delete_outline, size: 14, color: AppColors.error),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 8),
                    Row(children: [
                      Expanded(child: _trackedActionBtn(
                        icon: Icons.map,
                        label: 'Ver no Mapa',
                        color: AppColors.primary,
                        enabled: hasLoc,
                        onTap: () => _viewOnMap(item),
                      )),
                      const SizedBox(width: 6),
                      Expanded(child: _trackedActionBtn(
                        icon: Icons.navigation,
                        label: 'Rastrear',
                        color: color,
                        enabled: hasLoc,
                        onTap: () => _trackLive(item),
                      )),
                      const SizedBox(width: 6),
                      Expanded(child: _trackedActionBtn(
                        icon: Icons.share_location,
                        label: 'Atualizar GPS',
                        color: AppColors.cyan,
                        enabled: true,
                        onTap: () => _pushLocation(item),
                      )),
                    ]),
                  ]),
                );
              }),
              _miniBtn('+ Adicionar', _showAddTracked),
            ],
            const SizedBox(height: 12),

            // ── Preferences ──
            _sectionHeader('Preferências', Icons.tune),
            const SizedBox(height: 6),

            // Theme
            _menuItem(
              ref.watch(themeModeProvider) == ThemeMode.dark ? Icons.dark_mode : Icons.light_mode,
              ref.watch(themeModeProvider) == ThemeMode.dark ? 'Tema Escuro' : 'Tema Claro',
              () => ref.read(themeModeProvider.notifier).toggle(),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary.withAlpha(25), borderRadius: BorderRadius.circular(4)),
                child: Text(ref.watch(themeModeProvider) == ThemeMode.dark ? 'ESCURO' : 'CLARO', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 8, fontWeight: FontWeight.w800)),
              ),
            ),

            // Language
            Container(
              margin: const EdgeInsets.only(bottom: 3),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
              child: Row(children: [
                const Icon(Icons.language, size: 18, color: AppColors.textSecondary),
                const SizedBox(width: 10),
                const Text('Idioma', style: TextStyle(fontSize: 13)),
                const Spacer(),
                ...['PT', 'EN', 'ES', 'DE'].map((l) => Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedLang = l),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: _selectedLang == l ? AppColors.primary.withOpacity(0.15) : Colors.transparent,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: _selectedLang == l ? AppColors.primary : AppColors.border),
                      ),
                      child: Text(l, style: TextStyle(color: _selectedLang == l ? AppColors.primary : AppColors.textTertiary, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1)),
                    ),
                  ),
                )),
              ]),
            ),

            // Menu items
            _menuItem(Icons.visibility, 'Modo Fantasma', () => setState(() => _ghostMode = !_ghostMode), trailing: _ghostMode
                ? Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: AppColors.primary.withAlpha(25), borderRadius: BorderRadius.circular(4)),
                    child: const Text('ATIVO', style: TextStyle(color: AppColors.primary, fontSize: 8, fontWeight: FontWeight.w800)))
                : null),
            _menuItem(Icons.share_location, 'Compartilhar Localização', () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Localização partilhada')))),
            _menuItem(Icons.settings, 'Configurações', _showSettings),
            _menuItem(Icons.accessibility_new, 'Acessibilidade', _showAccessibility),
            _menuItem(Icons.logout, 'Sair', () => ref.read(authProvider.notifier).logout(), danger: true),
            const SizedBox(height: 40),
          ]),
        ),
      ),
      if (_showLevelList) _buildLevelListModal(user.reputation),
    ]);
  }

  // ── Helpers ──

  Widget _statCard(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
      child: Column(children: [
        Text(value, style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.w800, fontFamily: 'monospace')),
        const SizedBox(height: 1),
        Text(label, style: const TextStyle(color: AppColors.textTertiary, fontSize: 8), overflow: TextOverflow.ellipsis, maxLines: 1),
      ]),
    ),
  );

  Widget _emergencyBtn(String emoji, String label, Color color, VoidCallback onTap) => Material(
    color: color.withAlpha(25), borderRadius: BorderRadius.circular(12),
    child: InkWell(borderRadius: BorderRadius.circular(12), onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withAlpha(76))),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w800)),
        ]),
      ),
    ),
  );

  Widget _emergencyServiceBtn(Map<String, dynamic> s) {
    final color = Color(s['color'] as int);
    return Material(
      color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(10),
      child: InkWell(borderRadius: BorderRadius.circular(10), onTap: () => _callPhone(s['phone'] as String),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withOpacity(0.25))),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(s['icon'] as IconData, color: color, size: 18),
            const SizedBox(height: 2),
            Text(s['label'] as String, style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w700), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(s['phone'] as String, style: const TextStyle(color: AppColors.textTertiary, fontSize: 7, fontFamily: 'monospace')),
          ]),
        ),
      ),
    );
  }

  Widget _sectionHeader(String title, IconData icon) => Row(children: [
    Icon(icon, size: 16, color: AppColors.primary),
    const SizedBox(width: 6),
    Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
  ]);

  Widget _miniBtn(String label, VoidCallback onTap) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: AppColors.primary.withAlpha(20), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.primary.withAlpha(50))),
      child: Text(label, style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w700)),
    ),
  );

  Widget _menuItem(IconData icon, String label, VoidCallback onTap, {bool danger = false, Widget? trailing}) => Padding(
    padding: const EdgeInsets.only(bottom: 3),
    child: Material(
      color: AppColors.surface, borderRadius: BorderRadius.circular(10),
      child: InkWell(borderRadius: BorderRadius.circular(10), onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
          child: Row(children: [
            Icon(icon, size: 18, color: danger ? AppColors.error : AppColors.textSecondary),
            const SizedBox(width: 10),
            Text(label, style: TextStyle(color: danger ? AppColors.error : null, fontSize: 13)),
            const Spacer(),
            if (trailing != null) trailing,
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, size: 16, color: AppColors.textTertiary),
          ]),
        ),
      ),
    ),
  );

  IconData _typeIcon(String type) {
    switch (type) { case 'pet': return Icons.pets; case 'vehicle': return Icons.directions_car; case 'tag': return Icons.sell; case 'person': return Icons.person_pin; default: return Icons.location_on; }
  }

  Color _typeColor(String type) {
    switch (type) { case 'pet': return const Color(0xFFFFB800); case 'vehicle': return const Color(0xFF00D4FF); case 'tag': return const Color(0xFF7B61FF); case 'person': return const Color(0xFFFF3B7A); default: return AppColors.secondary; }
  }

  Widget _trackedActionBtn({required IconData icon, required String label, required Color color, required bool enabled, required VoidCallback onTap}) {
    return Material(
      color: enabled ? color.withAlpha(15) : Colors.transparent,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: enabled ? onTap : null,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: enabled ? color.withAlpha(50) : AppColors.border)),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 14, color: enabled ? color : AppColors.textDisabled),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(color: enabled ? color : AppColors.textDisabled, fontSize: 7, fontWeight: FontWeight.w700), textAlign: TextAlign.center),
          ]),
        ),
      ),
    );
  }

  void _viewOnMap(item) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('📍 Showing ${item.name} on map'), duration: const Duration(seconds: 1)));
  }

  void _trackLive(item) {
    ref.read(trackingProvider.notifier).startTracking(item.id);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('🔴 Live tracking ${item.name}'), duration: const Duration(seconds: 2)));
  }

  Future<void> _pushLocation(item) async {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('📡 Updating GPS location...'), duration: Duration(seconds: 1)));
    await ref.read(trackingProvider.notifier).pushDeviceLocationToItem(item.id);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✓ Location updated'), duration: Duration(seconds: 1)));
  }

  void _confirmDelete(item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Remover Item', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        content: Text('Remover "${item.name}" dos itens rastreados?', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          TextButton(
            onPressed: () { Navigator.pop(ctx); ref.read(trackingProvider.notifier).remove(item.id); },
            child: const Text('Remover', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  void _callPhone(String phone) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('A ligar para $phone...')));
  }

  Future<void> _sendFamilyAlert() async {
    try {
      final pos = await Geolocator.getCurrentPosition();
      await ref.read(apiProvider).sendFamilyPanic(pos.latitude, pos.longitude);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🚨 Alerta enviado à família!')));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Falha ao enviar alerta'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _sendSOS() async {
    try {
      final pos = await Geolocator.getCurrentPosition();
      await ref.read(apiProvider).sendSOS(pos.latitude, pos.longitude);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🆘 SOS enviado!')));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Falha ao enviar SOS'), backgroundColor: AppColors.error));
    }
  }

  void _showSOSConfig() {
    final ctrl = TextEditingController(text: _sosContact == 'Contato SOS — configurar' ? '' : _sosContact);
    showModalBottomSheet(context: context, backgroundColor: AppColors.surface, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Contato SOS', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'Nome ou número do contato')),
          const SizedBox(height: 14),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: () { setState(() => _sosContact = ctrl.text.isEmpty ? 'Contato SOS — configurar' : ctrl.text); Navigator.pop(ctx); },
            child: const Text('Salvar'),
          )),
        ]),
      ),
    );
  }

  Widget _buildLevelListModal(int reputation) {
    final currentBadge = getBadgeForReputation(reputation);
    final nextIdx = allBadges.indexWhere((b) => b.level == currentBadge.level) + 1;
    final nextBadge = nextIdx < allBadges.length ? allBadges[nextIdx] : null;
    final ptsNeeded = nextBadge != null ? nextBadge.minReputation - reputation : 0;

    return GestureDetector(
      onTap: () => setState(() => _showLevelList = false),
      child: Container(
        color: Colors.black54,
        child: Center(child: GestureDetector(onTap: () {},
          child: Container(
            margin: const EdgeInsets.all(24),
            constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75, maxWidth: 380),
            decoration: BoxDecoration(color: AppColors.background.withOpacity(0.95), borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.border)),
            child: ClipRRect(borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                child: Column(children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Row(children: [
                      const Icon(Icons.military_tech, color: AppColors.primary, size: 20),
                      const SizedBox(width: 8),
                      const Text('PROGRESSÃO DE NÍVEL', style: TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 2, fontFamily: 'monospace')),
                      const Spacer(),
                      GestureDetector(onTap: () => setState(() => _showLevelList = false), child: const Icon(Icons.close, color: AppColors.textTertiary, size: 20)),
                    ]),
                  ),
                  const Divider(color: AppColors.border),
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      itemCount: allBadges.length,
                      itemBuilder: (_, i) {
                        final b = allBadges[i];
                        final isCurrent = b.level == currentBadge.level;
                        final isUnlocked = reputation >= b.minReputation;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: isCurrent ? b.color.withOpacity(0.1) : (isUnlocked ? AppColors.glass : Colors.transparent),
                            borderRadius: BorderRadius.circular(10),
                            border: isCurrent ? Border.all(color: b.color.withOpacity(0.4)) : null,
                          ),
                          child: Row(children: [
                            Text(isUnlocked ? b.icon : '🔒', style: const TextStyle(fontSize: 20)),
                            const SizedBox(width: 10),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Text('Nv.${b.level}', style: TextStyle(color: isUnlocked ? b.color : AppColors.textDisabled, fontSize: 10, fontWeight: FontWeight.w800)),
                                const SizedBox(width: 6),
                                Expanded(child: Text(b.name, style: TextStyle(color: isUnlocked ? AppColors.textPrimary : AppColors.textDisabled, fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
                                if (isCurrent) Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(color: b.color.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                                  child: Text('ATUAL', style: TextStyle(color: b.color, fontSize: 7, fontWeight: FontWeight.w800)),
                                ),
                              ]),
                              Text('${b.nameEN} · ${b.minReputation} pts', style: TextStyle(color: isUnlocked ? AppColors.textTertiary : AppColors.textDisabled, fontSize: 9)),
                            ])),
                          ]),
                        );
                      },
                    ),
                  ),
                  if (nextBadge != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.border))),
                      child: Text('Próximo: ${nextBadge.icon} ${nextBadge.name} — faltam $ptsNeeded pts', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                ]),
              ),
            ),
          ),
        )),
      ),
    );
  }

  void _showSettings() {
    showModalBottomSheet(context: context, backgroundColor: AppColors.surface, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(padding: const EdgeInsets.all(20), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 16),
        const Text('Configurações', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 20),
        _settingRow('Modo Fantasma', _ghostMode, (v) { setState(() => _ghostMode = v); Navigator.pop(context); }),
        _settingRow('Notificações', true, (v) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(v ? 'Notificações ativadas' : 'Notificações desativadas'))); }),
        _settingRow('Compartilhar Localização', true, (v) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(v ? 'Localização partilhada' : 'Localização privada'))); }),
        _settingRow('Localização Aproximada', false, (v) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(v ? 'Localização aproximada ±200m' : 'Localização exata'))); }),
        const SizedBox(height: 12),
        Text('ALERT.IO v3.0', style: TextStyle(color: AppColors.textTertiary, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1.5)),
        const SizedBox(height: 4),
        Text('ENCRYPTED · AES-256 · REAL-TIME', style: TextStyle(color: AppColors.textTertiary.withOpacity(0.5), fontSize: 7, fontFamily: 'monospace', letterSpacing: 2)),
        const SizedBox(height: 8),
      ])),
    );
  }

  void _showAccessibility() {
    showModalBottomSheet(context: context, backgroundColor: AppColors.surface, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(padding: const EdgeInsets.all(20), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 16),
        const Text('Acessibilidade', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 20),
        _settingRow('Alto Contraste', false, (v) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(v ? 'Alto contraste ativado' : 'Alto contraste desativado'))); }),
        _settingRow('Reduzir Movimento', false, (v) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(v ? 'Movimento reduzido' : 'Animações normais'))); }),
        _settingRow('Leitor de Ecrã', false, (v) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(v ? 'Leitor de ecrã ativado' : 'Leitor de ecrã desativado'))); }),
        _settingRow('Texto Grande', false, (v) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(v ? 'Texto grande ativado' : 'Texto normal'))); }),
        const SizedBox(height: 8),
      ])),
    );
  }

  Widget _settingRow(String label, bool value, ValueChanged<bool> onChanged) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      Expanded(child: Text(label, style: const TextStyle(fontSize: 14))),
      Switch(value: value, onChanged: onChanged, activeColor: AppColors.primary),
    ]),
  );

  void _showAddTracked() {
    final nameCtrl = TextEditingController();
    String type = 'pet';
    showModalBottomSheet(
      context: context, backgroundColor: AppColors.surface, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Adicionar Item Rastreado', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 14),
            TextField(controller: nameCtrl, decoration: const InputDecoration(hintText: 'Nome (ex: Rex, Carro, Mochila)')),
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: ['pet', 'vehicle', 'tag', 'person'].map((t) => ChoiceChip(
              label: Row(mainAxisSize: MainAxisSize.min, children: [Icon(_typeIcon(t), size: 14), const SizedBox(width: 4), Text(t.toUpperCase())]),
              selected: type == t, onSelected: (_) => setSheetState(() => type = t),
              selectedColor: AppColors.primary.withOpacity(0.2),
              labelStyle: TextStyle(color: type == t ? AppColors.primary : AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w700),
            )).toList()),
            const SizedBox(height: 14),
            SizedBox(width: double.infinity, child: ElevatedButton(
              onPressed: () { if (nameCtrl.text.isNotEmpty) { ref.read(trackingProvider.notifier).add(nameCtrl.text, type); Navigator.pop(ctx); } },
              child: const Text('ADICIONAR'),
            )),
          ]),
        ),
      ),
    );
  }
}
