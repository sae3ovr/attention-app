import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import '../widgets/logo_mark.dart';

const _memberTypes = {
  'friend': {'icon': Icons.person, 'color': 0xFF2196FF, 'label': 'Amigo', 'hint': 'ex: Patrícia'},
  'pet': {'icon': Icons.pets, 'color': 0xFFFF9800, 'label': 'Pet', 'hint': 'ex: Rex'},
  'vehicle': {'icon': Icons.directions_car, 'color': 0xFF00E676, 'label': 'Veículo', 'hint': 'ex: Audi A3'},
  'device': {'icon': Icons.phone_android, 'color': 0xFFAB47BC, 'label': 'Dispositivo', 'hint': 'ex: AirTag Chaves'},
};

class _MockMember {
  final String name, status, type;
  final int? battery;
  final double? lat, lng;
  _MockMember({required this.name, required this.status, required this.type, this.battery, this.lat, this.lng});
}

class _MockMessage {
  final String sender, content, type;
  final DateTime time;
  final bool isMe;
  _MockMessage({required this.sender, required this.content, this.type = 'text', required this.time, this.isMe = false});
}

class _MockAlert {
  final String title, message, sender;
  final DateTime time;
  _MockAlert({required this.title, required this.message, required this.sender, required this.time});
}

class ChainScreen extends ConsumerStatefulWidget {
  const ChainScreen({super.key});
  @override
  ConsumerState<ChainScreen> createState() => _ChainScreenState();
}

class _ChainScreenState extends ConsumerState<ChainScreen> with SingleTickerProviderStateMixin {
  bool _hasChain = true;
  final String _chainName = 'My Safety Chain';
  final String _chainCode = 'ATN001';
  int _tabIndex = 0;
  final _msgCtrl = TextEditingController();
  String _addType = 'friend';
  final _addNameCtrl = TextEditingController();
  final _addNotesCtrl = TextEditingController();

  late AnimationController _sosPulse;

  final _members = [
    _MockMember(name: 'Patricia Querino', status: 'online', type: 'friend', battery: 63, lat: 41.237, lng: -8.621),
    _MockMember(name: 'Rex', status: 'online', type: 'pet', lat: 41.234, lng: -8.618),
    _MockMember(name: 'Audi A3', status: 'online', type: 'vehicle', lat: 41.240, lng: -8.625),
    _MockMember(name: 'AirTag - Keys', status: 'online', type: 'device'),
  ];

  final _messages = <_MockMessage>[
    _MockMessage(sender: 'Patricia Querino', content: 'Olá! Estou a caminho de casa', time: DateTime.now().subtract(const Duration(minutes: 5))),
    _MockMessage(sender: 'Eduardo Q.', content: 'Ok, cuidado!', time: DateTime.now().subtract(const Duration(minutes: 3)), isMe: true),
    _MockMessage(sender: 'Patricia Querino', content: 'Shared current location', type: 'location', time: DateTime.now().subtract(const Duration(minutes: 1))),
  ];

  final _alerts = <_MockAlert>[
    _MockAlert(title: 'SOS Alert', message: 'Emergency signal from Eduardo Q.', sender: 'Eduardo Q.', time: DateTime.now().subtract(const Duration(hours: 2))),
  ];

  @override
  void initState() {
    super.initState();
    _sosPulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _sosPulse.dispose();
    _msgCtrl.dispose();
    _addNameCtrl.dispose();
    _addNotesCtrl.dispose();
    super.dispose();
  }

  String _timeAgo(DateTime t) {
    final d = DateTime.now().difference(t);
    if (d.inMinutes < 1) return 'agora';
    if (d.inMinutes < 60) return '${d.inMinutes}m';
    if (d.inHours < 24) return '${d.inHours}h';
    return '${d.inDays}d';
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasChain) return _buildEmpty();

    final tabs = ['Membros', 'Chat', 'Alertas', 'Adicionar'];

    return SafeArea(child: Column(children: [
      // Header
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(children: [
          const LogoMark(size: 22),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_chainName, style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
            Text('${_members.length} membros • Código: $_chainCode', style: const TextStyle(color: AppColors.textTertiary, fontSize: 10, fontFamily: 'monospace')),
          ])),
          // SOS button
          _AnimBuilder(
            animation: _sosPulse,
            builder: (_, child) => Container(
              decoration: BoxDecoration(shape: BoxShape.circle, boxShadow: [BoxShadow(color: AppColors.error.withOpacity(0.3 + _sosPulse.value * 0.3), blurRadius: 8 + _sosPulse.value * 8)]),
              child: child,
            ),
            child: Material(
              color: AppColors.error, shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🚨 SOS enviado a todos os membros!'))),
                child: const SizedBox(width: 44, height: 44, child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.white, size: 18),
                  Text('SOS', style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.w900)),
                ])),
              ),
            ),
          ),
        ]),
      ),

      // Tabs
      Container(
        margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.border))),
        child: Row(children: List.generate(tabs.length, (i) => Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _tabIndex = i),
            child: Container(
              padding: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: _tabIndex == i ? AppColors.primary : Colors.transparent, width: 2))),
              child: Text(tabs[i], textAlign: TextAlign.center, style: TextStyle(
                color: _tabIndex == i ? AppColors.primary : AppColors.textTertiary,
                fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5,
              )),
            ),
          ),
        ))),
      ),

      // Tab content
      Expanded(child: IndexedStack(index: _tabIndex, children: [
        _buildMembersTab(),
        _buildChatTab(),
        _buildAlertsTab(),
        _buildAddTab(),
      ])),
    ]));
  }

  Widget _buildEmpty() => Center(child: Padding(
    padding: const EdgeInsets.all(32),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.link_off, size: 48, color: AppColors.textTertiary),
      const SizedBox(height: 16),
      const Text('Sistema Chain', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      const Text('Conecte amigos, pets, veículos e dispositivos numa cadeia de segurança.', style: TextStyle(color: AppColors.textTertiary, fontSize: 13), textAlign: TextAlign.center),
      const SizedBox(height: 24),
      ElevatedButton(onPressed: () => setState(() => _hasChain = true), child: const Text('Criar Nova Cadeia')),
      const SizedBox(height: 12),
      OutlinedButton(onPressed: () => setState(() => _hasChain = true), child: const Text('Entrar com Código')),
    ]),
  ));

  Widget _buildMembersTab() {
    if (_members.isEmpty) return const Center(child: Text('Nenhum membro ainda.\nAdicione amigos, pets, veículos ou dispositivos.', style: TextStyle(color: AppColors.textTertiary, fontSize: 12), textAlign: TextAlign.center));
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _members.length,
      itemBuilder: (_, i) {
        final m = _members[i];
        final meta = _memberTypes[m.type]!;
        final color = Color(meta['color'] as int);
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
          child: Row(children: [
            Container(
              width: 40, height: 40, decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(0.15), border: Border.all(color: color.withOpacity(0.4))),
              child: Icon(meta['icon'] as IconData, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(m.name, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
              Row(children: [
                Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1), decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(4), border: Border.all(color: color.withOpacity(0.3))),
                  child: Text(meta['label'] as String, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w700))),
                const SizedBox(width: 6),
                Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: m.status == 'online' ? AppColors.success : AppColors.textTertiary)),
                if (m.battery != null) ...[const SizedBox(width: 6), Icon(m.battery! > 50 ? Icons.battery_full : Icons.battery_3_bar, size: 12, color: m.battery! > 20 ? AppColors.success : AppColors.error), Text('${m.battery}%', style: const TextStyle(color: AppColors.textTertiary, fontSize: 9))],
              ]),
              if (m.lat != null) Text('📍 ${m.lat!.toStringAsFixed(4)}, ${m.lng!.toStringAsFixed(4)}', style: const TextStyle(color: AppColors.textTertiary, fontSize: 9)),
            ])),
            Column(children: [
              _miniActionBtn('IR', Icons.navigation, color, () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('A navegar para ${m.name}...')))),
              const SizedBox(height: 4),
              _miniActionBtn('PING', Icons.campaign, AppColors.warning, () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ping enviado a ${m.name}')))),
            ]),
          ]),
        );
      },
    );
  }

  Widget _miniActionBtn(String label, IconData icon, Color color, [VoidCallback? onTap]) => Material(
    color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8),
    child: InkWell(borderRadius: BorderRadius.circular(8), onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.3))),
        child: Column(children: [
          Icon(icon, size: 14, color: color),
          Text(label, style: TextStyle(color: color, fontSize: 7, fontWeight: FontWeight.w800)),
        ]),
      ),
    ),
  );

  Widget _buildChatTab() => Column(children: [
    Expanded(child: ListView.builder(
      padding: const EdgeInsets.all(12), reverse: true,
      itemCount: _messages.length,
      itemBuilder: (_, i) {
        final m = _messages[_messages.length - 1 - i];
        final isLocation = m.type == 'location';
        return Align(
          alignment: m.isMe ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            constraints: const BoxConstraints(maxWidth: 280),
            decoration: BoxDecoration(
              color: m.isMe ? AppColors.primary.withOpacity(0.12) : AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: m.isMe ? AppColors.primary.withOpacity(0.3) : AppColors.border),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (!m.isMe) Text(m.sender, style: const TextStyle(color: AppColors.textTertiary, fontSize: 9, fontWeight: FontWeight.w700)),
              Row(children: [
                if (isLocation) const Icon(Icons.location_on, size: 14, color: AppColors.cyan),
                if (isLocation) const SizedBox(width: 4),
                Flexible(child: Text(m.content, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13))),
              ]),
              Text(_timeAgo(m.time), style: const TextStyle(color: AppColors.textTertiary, fontSize: 8)),
            ]),
          ),
        );
      },
    )),
    Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.border))),
      child: Row(children: [
        Expanded(child: TextField(controller: _msgCtrl, decoration: const InputDecoration(hintText: 'Digite uma mensagem...', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)), style: const TextStyle(fontSize: 13))),
        const SizedBox(width: 8),
        IconButton(icon: const Icon(Icons.send, color: AppColors.primary, size: 20), onPressed: () {
          if (_msgCtrl.text.trim().isEmpty) return;
          setState(() { _messages.add(_MockMessage(sender: 'Eduardo Q.', content: _msgCtrl.text.trim(), time: DateTime.now(), isMe: true)); _msgCtrl.clear(); });
        }),
      ]),
    ),
  ]);

  Widget _buildAlertsTab() {
    if (_alerts.isEmpty) return const Center(child: Text('Nenhum alerta ainda.', style: TextStyle(color: AppColors.textTertiary, fontSize: 13)));
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _alerts.length,
      itemBuilder: (_, i) {
        final a = _alerts[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.error.withOpacity(0.06), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.error.withOpacity(0.2))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [const Icon(Icons.warning_amber, size: 16, color: AppColors.error), const SizedBox(width: 6), Text(a.title, style: const TextStyle(color: AppColors.error, fontSize: 13, fontWeight: FontWeight.w700))]),
            const SizedBox(height: 4),
            Text(a.message, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 4),
            Text('${_timeAgo(a.time)} • por ${a.sender}', style: const TextStyle(color: AppColors.textTertiary, fontSize: 9)),
          ]),
        );
      },
    );
  }

  Widget _buildAddTab() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Adicionar à Cadeia', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
      const SizedBox(height: 14),
      const Text('Tipo', style: TextStyle(color: AppColors.textTertiary, fontSize: 11, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      Wrap(spacing: 8, runSpacing: 8, children: _memberTypes.entries.map((e) {
        final sel = _addType == e.key;
        final color = Color(e.value['color'] as int);
        return GestureDetector(
          onTap: () => setState(() => _addType = e.key),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: sel ? color.withOpacity(0.15) : AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: sel ? color : AppColors.border)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(e.value['icon'] as IconData, size: 16, color: sel ? color : AppColors.textTertiary),
              const SizedBox(width: 6),
              Text(e.value['label'] as String, style: TextStyle(color: sel ? color : AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
            ]),
          ),
        );
      }).toList()),
      const SizedBox(height: 14),
      TextField(controller: _addNameCtrl, decoration: InputDecoration(labelText: 'Nome *', hintText: _memberTypes[_addType]!['hint'] as String)),
      const SizedBox(height: 10),
      TextField(controller: _addNotesCtrl, decoration: const InputDecoration(labelText: 'Notas (opcional)', hintText: 'Telefone, raça, placa, etc.')),
      const SizedBox(height: 16),
      SizedBox(width: double.infinity, child: ElevatedButton(
        onPressed: () {
          if (_addNameCtrl.text.isEmpty) return;
          setState(() { _members.add(_MockMember(name: _addNameCtrl.text, status: 'online', type: _addType)); _addNameCtrl.clear(); _addNotesCtrl.clear(); _tabIndex = 0; });
        },
        child: Text('Adicionar ${_memberTypes[_addType]!['label']}'),
      )),
    ]),
  );
}

class _AnimBuilder extends AnimatedWidget {
  final Widget Function(BuildContext, Widget?) builder;
  final Widget? child;
  const _AnimBuilder({required Animation<double> animation, required this.builder, this.child}) : super(listenable: animation);
  @override
  Widget build(BuildContext context) => builder(context, child);
}
