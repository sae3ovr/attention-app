import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import '../widgets/logo_mark.dart';

class FamilyScreen extends ConsumerStatefulWidget {
  const FamilyScreen({super.key});
  @override
  ConsumerState<FamilyScreen> createState() => _FamilyScreenState();
}

class _FamilyScreenState extends ConsumerState<FamilyScreen> {
  bool _checkInSent = false;
  final _members = [
    _FamilyMember(name: 'Eduardo Q.', relation: 'Admin', battery: 85, isOnline: true, lat: 41.2356, lng: -8.620),
    _FamilyMember(name: 'Patricia Querino', relation: 'Membro', battery: 63, isOnline: true, lat: 41.237, lng: -8.621),
    _FamilyMember(name: 'Lucas Querino', relation: 'Modo Criança', battery: 72, isOnline: true, lat: 41.234, lng: -8.618, isKid: true, isInSafeZone: true),
    _FamilyMember(name: 'Sofia Querino', relation: 'Membro', battery: 14, isOnline: false, lat: 41.240, lng: -8.625),
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(children: [
            const LogoMark(size: 22),
            const SizedBox(width: 10),
            Text('Família', style: Theme.of(context).textTheme.headlineSmall),
            const Spacer(),
            _headerButton(Icons.person_add, 'Convidar', () => _showInvite()),
          ]),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            children: [
              // Family group info
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                ),
                child: Row(children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), color: AppColors.primary.withOpacity(0.1)),
                    child: const Center(child: Text('👨‍👩‍👧‍👦', style: TextStyle(fontSize: 20))),
                  ),
                  const SizedBox(width: 12),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Querino Family', style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                    Row(children: [
                      Container(width: 5, height: 5, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.primary)),
                      const SizedBox(width: 4),
                      Text('${_members.where((m) => m.isOnline).length}/${_members.length} online', style: const TextStyle(color: AppColors.textTertiary, fontSize: 10)),
                    ]),
                  ]),
                ]),
              ),

              ..._members.map(_buildMemberCard),

              // Check-in button
              Container(
                margin: const EdgeInsets.only(top: 12),
                child: Material(
                  color: _checkInSent ? AppColors.success.withAlpha(25) : AppColors.primary.withAlpha(20),
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () { setState(() => _checkInSent = true); Future.delayed(const Duration(seconds: 3), () { if (mounted) setState(() => _checkInSent = false); }); },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: _checkInSent ? AppColors.success.withAlpha(100) : AppColors.primary.withAlpha(50))),
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(_checkInSent ? Icons.check_circle : Icons.favorite, size: 18, color: _checkInSent ? AppColors.success : AppColors.primary),
                        const SizedBox(width: 8),
                        Text(_checkInSent ? 'Enviado! ✓' : 'Estou Bem', style: TextStyle(color: _checkInSent ? AppColors.success : AppColors.primary, fontSize: 13, fontWeight: FontWeight.w700)),
                      ]),
                    ),
                  ),
                ),
              ),

              // Panic button
              Container(
                margin: const EdgeInsets.only(top: 8),
                child: Material(
                  color: AppColors.error.withAlpha(25),
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🚨 Alerta enviado à família!'), backgroundColor: AppColors.error)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.error.withAlpha(100))),
                      child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text('🚨', style: TextStyle(fontSize: 20)),
                        SizedBox(width: 10),
                        Text('ALERTA FAMÍLIA', style: TextStyle(color: AppColors.error, fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 1)),
                      ]),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _buildMemberCard(_FamilyMember m) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: m.isOnline ? AppColors.primary.withOpacity(0.1) : AppColors.glass,
                border: Border.all(color: m.isOnline ? AppColors.primary : AppColors.textDisabled, width: 1.5),
              ),
              child: Center(child: Text(m.name.isNotEmpty ? m.name[0] : '?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: m.isOnline ? AppColors.primary : AppColors.textDisabled))),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(m.name, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
                if (m.isKid) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(color: AppColors.warning.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                    child: const Text('KID', style: TextStyle(color: AppColors.warning, fontSize: 7, fontWeight: FontWeight.w800)),
                  ),
                ],
              ]),
              Text(m.relation, style: const TextStyle(color: AppColors.textTertiary, fontSize: 11)),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Row(children: [
                Icon(
                  m.battery > 20 ? Icons.battery_full : Icons.battery_alert,
                  size: 14,
                  color: m.battery > 50 ? AppColors.primary : m.battery > 20 ? AppColors.warning : AppColors.error,
                ),
                const SizedBox(width: 2),
                Text('${m.battery}%', style: TextStyle(color: AppColors.textTertiary, fontSize: 10)),
              ]),
              Container(
                margin: const EdgeInsets.only(top: 4),
                width: 6, height: 6,
                decoration: BoxDecoration(shape: BoxShape.circle, color: m.isOnline ? AppColors.primary : AppColors.textDisabled),
              ),
            ]),
          ]),
          // Safe zone status for kids
          if (m.isKid && m.isInSafeZone != null) ...[
            const SizedBox(height: 6),
            Row(children: [
              Icon(m.isInSafeZone! ? Icons.check_circle : Icons.warning_amber, size: 14, color: m.isInSafeZone! ? AppColors.success : AppColors.error),
              const SizedBox(width: 4),
              Text(m.isInSafeZone! ? 'Zona Segura' : 'Fora da Zona', style: TextStyle(color: m.isInSafeZone! ? AppColors.success : AppColors.error, fontSize: 11, fontWeight: FontWeight.w600)),
            ]),
          ],
          if (m.isOnline) ...[
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: _memberAction(Icons.near_me, 'Localizar', AppColors.primary, () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('A localizar ${m.name}...'))))),
              const SizedBox(width: 6),
              Expanded(child: _memberAction(Icons.message, 'Mensagem', AppColors.cyan, () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Mensagem para ${m.name}...'))))),
              if (m.isKid) ...[
                const SizedBox(width: 6),
                Expanded(child: _memberAction(Icons.mic, 'Ouvir', AppColors.warning, () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('A ouvir ${m.name}...'))))),
              ],
            ]),
          ],
          // Kid detail expansion
          if (m.isKid && m.isOnline) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [const Icon(Icons.location_on, size: 12, color: AppColors.primary), const SizedBox(width: 4), const Text('Localização: Ativa · Atualiza a cada 30s', style: TextStyle(color: AppColors.textSecondary, fontSize: 10))]),
                const SizedBox(height: 4),
                Row(children: [const Icon(Icons.shield, size: 12, color: AppColors.success), const SizedBox(width: 4), Text('Zona Segura: Escola (raio de 500m) — ${m.isInSafeZone == true ? 'Dentro' : 'FORA'}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 10))]),
                const SizedBox(height: 4),
                const Row(children: [Icon(Icons.notifications_active, size: 12, color: AppColors.warning), SizedBox(width: 4), Text('Alertas: Saída de zona, Bateria fraca, SOS', style: TextStyle(color: AppColors.textSecondary, fontSize: 10))]),
              ]),
            ),
          ],
        ],
      ),
    );
  }

  Widget _memberAction(IconData icon, String label, Color color, VoidCallback onTap) => Material(
    color: Colors.transparent,
    child: InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(color: color.withAlpha(20), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withAlpha(50))),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, size: 14, color: color), const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w700)),
        ]),
      ),
    ),
  );

  Widget _headerButton(IconData icon, String label, VoidCallback onTap) => Material(
    color: Colors.transparent,
    child: InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(color: AppColors.primary.withAlpha(20), borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.primary.withAlpha(50))),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: AppColors.primary), const SizedBox(width: 4),
          Text(label, style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w700)),
        ]),
      ),
    ),
  );

  void _showInvite() {
    showModalBottomSheet(
      context: context, backgroundColor: AppColors.surface, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Código de Convite', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(12)),
            child: Column(children: [
              const Text('Código de convite', style: TextStyle(color: AppColors.textTertiary, fontSize: 11)),
              const SizedBox(height: 8),
              SelectableText('ATN3X8KP', style: TextStyle(color: AppColors.primary, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 2, fontFamily: 'monospace')),
            ]),
          ),
          const SizedBox(height: 14),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: () => Navigator.pop(ctx),
            icon: const Icon(Icons.share, size: 16),
            label: const Text('COMPARTILHAR'),
          )),
        ]),
      ),
    );
  }
}

class _FamilyMember {
  final String name, relation;
  final int battery;
  final bool isOnline, isKid;
  final bool? isInSafeZone;
  final double lat, lng;
  _FamilyMember({required this.name, required this.relation, required this.battery, required this.isOnline, required this.lat, required this.lng, this.isKid = false, this.isInSafeZone});
}
