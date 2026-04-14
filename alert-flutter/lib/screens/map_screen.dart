import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import '../widgets/logo_mark.dart';
import '../providers/incidents_provider.dart';
import '../providers/tracking_provider.dart';
import '../models/incident.dart';

const _categoryEmoji = <String, String>{
  'robbery': '🚨', 'accident': '💥', 'suspicious': '👁', 'hazard': '⚠️', 'police': '🚔',
  'fire': '🔥', 'medical': '🏥', 'traffic': '🚦', 'noise': '📢', 'flood': '🌊',
  'injured_animal': '🐾', 'building_risk': '🏚️', 'other': '📍',
};
const _categoryLabel = <String, String>{
  'robbery': 'Roubo', 'accident': 'Acidente', 'suspicious': 'Suspeito', 'hazard': 'Perigo',
  'police': 'Polícia', 'fire': 'Incêndio', 'medical': 'Médico', 'traffic': 'Trânsito',
  'noise': 'Ruído', 'flood': 'Inundação', 'injured_animal': 'Animal Ferido',
  'building_risk': 'Edifício em Risco', 'other': 'Outro',
};
const _severityLabels = <String, String>{'low': 'LOW', 'medium': 'MED', 'high': 'HIGH', 'critical': 'CRIT'};
const _tileUrls = [
  'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
];

const _trackedItemColors = <String, Color>{
  'pet': Color(0xFFFFB800),
  'vehicle': Color(0xFF00D4FF),
  'tag': Color(0xFF7B61FF),
  'person': Color(0xFFFF3B7A),
};

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});
  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> with TickerProviderStateMixin {
  final _mapController = MapController();
  LatLng _userLocation = const LatLng(41.2356, -8.6200);
  bool _scanning = false;
  final double _scanRadius = 3000;
  Timer? _locationTimer;
  int _tileUrlIndex = 0;

  Incident? _selectedIncident;
  Incident? _tooltipIncident;
  Offset? _tooltipOffset;
  String? _highlightedId;

  bool _showTrackedPanel = false;
  TrackedItem? _selectedTracked;
  bool _isNavigatingToItem = false;

  late AnimationController _pulseCtrl;
  late AnimationController _trackPulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _trackPulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))..repeat(reverse: true);
    _initLocation();
    Future.microtask(() {
      ref.read(incidentsProvider.notifier).load();
      ref.read(trackingProvider.notifier).load();
    });
  }

  Future<void> _initLocation() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.deniedForever) return;
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      if (mounted) {
        setState(() => _userLocation = LatLng(pos.latitude, pos.longitude));
        _mapController.move(_userLocation, 14);
      }
    } catch (_) {}
    _locationTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        if (mounted) setState(() => _userLocation = LatLng(pos.latitude, pos.longitude));
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _pulseCtrl.dispose();
    _trackPulseCtrl.dispose();
    _mapController.dispose();
    super.dispose();
  }

  void _cycleTileSource() {
    setState(() => _tileUrlIndex = (_tileUrlIndex + 1) % _tileUrls.length);
    final names = ['CARTO Dark', 'CARTO Light', 'OpenStreetMap'];
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Map: ${names[_tileUrlIndex]}'), duration: const Duration(seconds: 1)));
  }

  void _selectIncident(Incident inc) {
    setState(() {
      _selectedIncident = inc;
      _tooltipIncident = null;
      _highlightedId = inc.id;
      _selectedTracked = null;
    });
    _mapController.move(LatLng(inc.latitude, inc.longitude), _mapController.camera.zoom.clamp(14, 19));
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _highlightedId == inc.id) setState(() => _highlightedId = null);
    });
  }

  void _clearSelection() => setState(() { _selectedIncident = null; _tooltipIncident = null; _highlightedId = null; _selectedTracked = null; });

  void _showTooltip(Incident inc, Offset globalPos) {
    setState(() { _tooltipIncident = inc; _tooltipOffset = globalPos; });
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _tooltipIncident?.id == inc.id) setState(() => _tooltipIncident = null);
    });
  }

  void _selectTrackedItem(TrackedItem item) {
    setState(() {
      _selectedTracked = item;
      _selectedIncident = null;
      _tooltipIncident = null;
    });
    if (item.hasLocation) {
      _mapController.move(LatLng(item.latitude!, item.longitude!), _mapController.camera.zoom.clamp(15, 18));
    }
  }

  void _startNavigationToItem(TrackedItem item) {
    if (!item.hasLocation) return;
    ref.read(trackingProvider.notifier).startTracking(item.id);
    setState(() {
      _isNavigatingToItem = true;
      _selectedTracked = item;
      _showTrackedPanel = false;
    });
    _mapController.move(LatLng(item.latitude!, item.longitude!), 16);
  }

  void _stopNavigation() {
    ref.read(trackingProvider.notifier).stopTracking();
    setState(() => _isNavigatingToItem = false);
  }

  Color _trackedColor(String type) => _trackedItemColors[type] ?? AppColors.secondary;

  @override
  Widget build(BuildContext context) {
    final incidents = ref.watch(incidentsProvider).incidents;
    final trackingState = ref.watch(trackingProvider);
    final tracked = trackingState.items;
    final activeItem = trackingState.activeItem;
    final pad = MediaQuery.of(context).padding;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.background : AppColors.lightBackground;
    final cardBg = isDark ? AppColors.background.withAlpha(220) : Colors.white.withAlpha(230);
    final screenSize = MediaQuery.of(context).size;
    final trackedWithLocation = tracked.where((t) => t.hasLocation).toList();

    return Stack(
      children: [
        Container(color: bgColor),

        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _userLocation, initialZoom: 14, maxZoom: 19, minZoom: 3,
            onTap: (_, __) => _clearSelection(),
            backgroundColor: bgColor,
          ),
          children: [
            TileLayer(urlTemplate: _tileUrls[_tileUrlIndex], maxZoom: 19, userAgentPackageName: 'io.alert.app'),

            if (_scanning)
              CircleLayer(circles: [
                CircleMarker(point: _userLocation, radius: _scanRadius,
                  color: AppColors.primary.withAlpha(15), borderColor: AppColors.primary.withAlpha(128),
                  borderStrokeWidth: 2, useRadiusInMeter: true),
              ]),

            // Navigation line from user to active tracked item
            if (_isNavigatingToItem && activeItem != null && activeItem.hasLocation)
              PolylineLayer(polylines: [
                Polyline(
                  points: [_userLocation, LatLng(activeItem.latitude!, activeItem.longitude!)],
                  color: _trackedColor(activeItem.itemType).withAlpha(180),
                  strokeWidth: 3, pattern: const StrokePattern.dotted(),
                ),
              ]),

            // Incident markers
            MarkerLayer(markers: incidents.map((inc) {
              final color = AppColors.category(inc.category);
              final emoji = _categoryEmoji[inc.category] ?? '📍';
              final isSelected = _selectedIncident?.id == inc.id;
              final isHighlighted = _highlightedId == inc.id;
              final isActive = isSelected || isHighlighted;
              return Marker(
                point: LatLng(inc.latitude, inc.longitude), width: 42, height: 50,
                child: GestureDetector(
                  onTap: () => _selectIncident(inc),
                  onLongPressStart: (d) => _showTooltip(inc, d.globalPosition),
                  onLongPressEnd: (_) => setState(() => _tooltipIncident = null),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250), curve: Curves.easeOutBack,
                      width: isActive ? 36 : 30, height: isActive ? 36 : 30,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: color.withAlpha(isActive ? 64 : 30),
                        border: Border.all(color: color, width: isActive ? 2.5 : 1.5),
                        boxShadow: isActive
                          ? [BoxShadow(color: color.withAlpha(120), blurRadius: 16, spreadRadius: 2)]
                          : [BoxShadow(color: Colors.black.withAlpha(50), blurRadius: 4)],
                      ),
                      child: Center(child: Text(emoji, style: TextStyle(fontSize: isActive ? 16 : 14))),
                    ),
                    const SizedBox(height: 1),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                      decoration: BoxDecoration(color: bgColor.withAlpha(220), borderRadius: BorderRadius.circular(3)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Container(width: 4, height: 4, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.severity(inc.severity))),
                        const SizedBox(width: 2),
                        Text(inc.category.length > 5 ? '${inc.category.substring(0, 5).toUpperCase()}..' : inc.category.toUpperCase(),
                          style: TextStyle(fontSize: 5, fontWeight: FontWeight.w800, color: color)),
                      ]),
                    ),
                  ]),
                ),
              );
            }).toList()),

            // Tracked items with enhanced markers
            MarkerLayer(markers: trackedWithLocation.map((item) {
              final color = _trackedColor(item.itemType);
              final isSelected = _selectedTracked?.id == item.id;
              final isActiveNav = activeItem?.id == item.id;
              return Marker(
                point: LatLng(item.latitude!, item.longitude!), width: isSelected ? 60 : 44, height: isSelected ? 68 : 52,
                child: GestureDetector(
                  onTap: () => _selectTrackedItem(item),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _TrackedMarkerDot(
                      color: color,
                      icon: _trackedIcon(item.itemType),
                      isSelected: isSelected,
                      isActiveNav: isActiveNav,
                      pulseCtrl: _trackPulseCtrl,
                    ),
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: bgColor.withAlpha(230),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: color.withAlpha(100), width: 0.5),
                      ),
                      child: Text(
                        item.name.length > 8 ? '${item.name.substring(0, 8)}..' : item.name,
                        style: TextStyle(fontSize: 7, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.3),
                      ),
                    ),
                  ]),
                ),
              );
            }).toList()),

            // User dot
            MarkerLayer(markers: [Marker(point: _userLocation, width: 32, height: 32, child: _PulsingDot(ctrl: _pulseCtrl))]),

            Align(alignment: Alignment.bottomRight, child: Padding(
              padding: const EdgeInsets.only(right: 4, bottom: 2),
              child: Text('© OpenStreetMap', style: TextStyle(color: isDark ? const Color(0x88FFFFFF) : const Color(0x66000000), fontSize: 8)),
            )),
          ],
        ),

        // Top bar
        Positioned(top: pad.top + 8, left: 12, right: 12,
          child: Row(children: [
            GlassCard(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8), borderRadius: BorderRadius.circular(14),
              child: Row(children: [
                const LogoMark(size: 24), const SizedBox(width: 8),
                Text('ALERT.IO', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 2, fontFamily: 'monospace')),
              ])),
            const Spacer(),
            if (tracked.isNotEmpty)
              _MapButton(
                icon: Icons.track_changes,
                label: '${trackedWithLocation.length}',
                color: AppColors.secondary,
                active: _showTrackedPanel,
                onTap: () => setState(() { _showTrackedPanel = !_showTrackedPanel; if (_showTrackedPanel) _selectedIncident = null; }),
                cardBg: cardBg, isDark: isDark,
              ),
            if (tracked.isNotEmpty) const SizedBox(width: 6),
            _MapButton(icon: Icons.layers, onTap: _cycleTileSource, cardBg: cardBg, isDark: isDark),
            const SizedBox(width: 6),
            _MapButton(icon: Icons.my_location, onTap: () => _mapController.move(_userLocation, 16), cardBg: cardBg, isDark: isDark),
          ])),

        // Tracked items panel
        if (_showTrackedPanel)
          Positioned(
            top: pad.top + 60, right: 12,
            child: _TrackedItemsPanel(
              items: tracked,
              selectedId: _selectedTracked?.id,
              activeNavId: activeItem?.id,
              onSelect: _selectTrackedItem,
              onNavigate: _startNavigationToItem,
              onClose: () => setState(() => _showTrackedPanel = false),
              isDark: isDark,
              userLocation: _userLocation,
            ),
          ),

        // Navigation HUD overlay
        if (_isNavigatingToItem && activeItem != null)
          _buildNavigationHud(activeItem, pad, cardBg, isDark),

        // Bottom action bar
        if (!_isNavigatingToItem)
          Positioned(bottom: pad.bottom + 12, left: 12, right: 12,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              _MapButton(icon: Icons.add, label: 'Report', color: AppColors.warning, onTap: () => _showReportSheet(), cardBg: cardBg, isDark: isDark),
              const SizedBox(width: 8),
              _MapButton(icon: Icons.radar, label: 'Scan', color: AppColors.primary, active: _scanning, onTap: () => setState(() => _scanning = !_scanning), cardBg: cardBg, isDark: isDark),
              const SizedBox(width: 8),
              _MapButton(icon: Icons.near_me_outlined, label: 'Nearby', onTap: () => _showNearby(incidents), cardBg: cardBg, isDark: isDark),
            ])),

        // Selected tracked item popup
        if (_selectedTracked != null && !_isNavigatingToItem) _buildTrackedItemPopup(pad),

        // Incident detail popup
        if (_selectedIncident != null) _buildIncidentPopup(pad),

        // Floating tooltip on long-press
        if (_tooltipIncident != null && _tooltipOffset != null && _selectedIncident == null)
          _buildFloatingTooltip(screenSize),
      ],
    );
  }

  // --- Navigation HUD ---
  Widget _buildNavigationHud(TrackedItem item, EdgeInsets pad, Color cardBg, bool isDark) {
    final color = _trackedColor(item.itemType);
    final dist = item.hasLocation ? _distance(item.latitude!, item.longitude!) : 0.0;
    final distStr = dist < 1 ? '${(dist * 1000).round()}m' : '${dist.toStringAsFixed(1)}km';

    return Positioned(
      bottom: pad.bottom + 12, left: 12, right: 12,
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        glowColor: color,
        borderRadius: BorderRadius.circular(16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Row(children: [
            _AnimatedTrackIcon(color: color, icon: _trackedIcon(item.itemType), ctrl: _trackPulseCtrl),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: color.withAlpha(30), borderRadius: BorderRadius.circular(4)),
                  child: Text('NAVIGATING', style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 1)),
                ),
                const SizedBox(width: 6),
                Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.success)),
              ]),
              const SizedBox(height: 4),
              Text(item.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
            ])),
            const SizedBox(width: 8),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(distStr, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w800, fontFamily: 'monospace')),
              Text(item.lastSeenLabel, style: const TextStyle(color: AppColors.textTertiary, fontSize: 9)),
            ]),
          ]),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: Material(
              color: color.withAlpha(25),
              borderRadius: BorderRadius.circular(10),
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () {
                  if (item.hasLocation) _mapController.move(LatLng(item.latitude!, item.longitude!), 17);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withAlpha(60))),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.center_focus_strong, size: 14, color: color),
                    const SizedBox(width: 6),
                    Text('CENTER', style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w800)),
                  ]),
                ),
              ),
            )),
            const SizedBox(width: 8),
            Expanded(child: Material(
              color: AppColors.error.withAlpha(25),
              borderRadius: BorderRadius.circular(10),
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: _stopNavigation,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.error.withAlpha(60))),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.close, size: 14, color: AppColors.error),
                    const SizedBox(width: 6),
                    const Text('STOP', style: TextStyle(color: AppColors.error, fontSize: 10, fontWeight: FontWeight.w800)),
                  ]),
                ),
              ),
            )),
          ]),
        ]),
      ),
    );
  }

  // --- Tracked item popup ---
  Widget _buildTrackedItemPopup(EdgeInsets pad) {
    final item = _selectedTracked!;
    final color = _trackedColor(item.itemType);
    final dist = item.hasLocation ? _distance(item.latitude!, item.longitude!) : null;
    final distStr = dist != null ? (dist < 1 ? '${(dist * 1000).round()}m' : '${dist.toStringAsFixed(1)}km') : '—';

    return Positioned(
      bottom: pad.bottom + 72, left: 12, right: 12,
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        glowColor: color,
        borderRadius: BorderRadius.circular(14),
        child: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color.withAlpha(38), border: Border.all(color: color, width: 1.5)),
            child: Icon(_trackedIcon(item.itemType), size: 18, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Text(item.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(color: color.withAlpha(25), borderRadius: BorderRadius.circular(3)),
                child: Text(item.itemType.toUpperCase(), style: TextStyle(color: color, fontSize: 7, fontWeight: FontWeight.w800, letterSpacing: 1)),
              ),
              const SizedBox(width: 6),
              Text(item.lastSeenLabel, style: const TextStyle(color: AppColors.textTertiary, fontSize: 9)),
            ]),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(distStr, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w800, fontFamily: 'monospace')),
          ]),
          const SizedBox(width: 8),
          if (item.hasLocation)
            Material(color: Colors.transparent, child: InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () => _startNavigationToItem(item),
              child: Container(
                width: 32, height: 32,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), color: color.withAlpha(30), border: Border.all(color: color.withAlpha(80))),
                child: Icon(Icons.navigation, size: 16, color: color),
              ),
            )),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: () => setState(() => _selectedTracked = null),
            child: const Padding(padding: EdgeInsets.all(4), child: Icon(Icons.close, size: 14, color: AppColors.textTertiary)),
          ),
        ]),
      ),
    );
  }

  // --- Floating tooltip on long-press ---
  Widget _buildFloatingTooltip(Size screen) {
    final inc = _tooltipIncident!;
    final color = AppColors.category(inc.category);
    final emoji = _categoryEmoji[inc.category] ?? '📍';
    final ago = DateTime.now().difference(inc.createdAt);
    final timeStr = ago.inMinutes < 60 ? '${ago.inMinutes.clamp(0, 999)}m' : '${ago.inHours.clamp(0, 999)}h';

    double left = (_tooltipOffset!.dx - 100).clamp(8, screen.width - 216);
    double top = (_tooltipOffset!.dy - 130).clamp(8, screen.height - 100);

    return Positioned(
      left: left, top: top,
      child: IgnorePointer(
        child: Material(
          color: Colors.transparent,
          child: AnimatedOpacity(
            opacity: 1, duration: const Duration(milliseconds: 200),
            child: Container(
              width: 200, padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor.withAlpha(240),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withAlpha(100)),
                boxShadow: [BoxShadow(color: color.withAlpha(40), blurRadius: 16), BoxShadow(color: Colors.black.withAlpha(80), blurRadius: 8)],
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Row(children: [
                  Text(emoji, style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 6),
                  Expanded(child: Text(inc.category.toUpperCase(), style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 1))),
                  Text(timeStr, style: const TextStyle(color: AppColors.textTertiary, fontSize: 9)),
                ]),
                const SizedBox(height: 6),
                Text(inc.title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Row(children: [
                  Container(width: 5, height: 5, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.severity(inc.severity))),
                  const SizedBox(width: 4),
                  Text(_severityLabels[inc.severity] ?? 'MED', style: TextStyle(color: AppColors.severity(inc.severity), fontSize: 8, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  Text('👍${inc.confirmCount}  👎${inc.denyCount}  👁${inc.views}', style: const TextStyle(color: AppColors.textTertiary, fontSize: 8)),
                ]),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  // --- Compact bottom incident bar ---
  Widget _buildIncidentPopup(EdgeInsets pad) {
    final inc = _selectedIncident!;
    final color = AppColors.category(inc.category);
    final emoji = _categoryEmoji[inc.category] ?? '📍';

    return Positioned(
      bottom: pad.bottom + 72, left: 12, right: 12,
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        glowColor: color,
        borderRadius: BorderRadius.circular(14),
        child: Row(children: [
          Container(width: 32, height: 32,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color.withAlpha(38), border: Border.all(color: color, width: 1.5)),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 15)))),
          const SizedBox(width: 8),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Text(inc.title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
            Row(children: [
              _badge(inc.category.toUpperCase(), color),
              if (inc.isVerified) ...[const SizedBox(width: 4), const Text('✓', style: TextStyle(color: AppColors.success, fontSize: 8, fontWeight: FontWeight.w800))],
            ]),
          ])),
          const SizedBox(width: 4),
          _ThumbBtn(icon: Icons.thumb_up_rounded, count: inc.confirmCount, color: AppColors.success, onTap: () {
            ref.read(incidentsProvider.notifier).confirm(inc.id);
            setState(() {});
          }),
          const SizedBox(width: 4),
          _ThumbBtn(icon: Icons.thumb_down_rounded, count: inc.denyCount, color: AppColors.error, onTap: () {
            ref.read(incidentsProvider.notifier).deny(inc.id);
            setState(() {});
          }),
          const SizedBox(width: 4),
          Material(color: Colors.transparent, child: InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: () { final i = inc; _clearSelection(); _showIncidentDetail(i); },
            child: Container(
              width: 28, height: 28,
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), color: AppColors.glass),
              child: const Icon(Icons.open_in_new, size: 14, color: AppColors.textSecondary),
            ),
          )),
          const SizedBox(width: 2),
          GestureDetector(
            onTap: _clearSelection,
            child: const Padding(padding: EdgeInsets.all(4), child: Icon(Icons.close, size: 14, color: AppColors.textTertiary)),
          ),
        ]),
      ),
    );
  }

  Widget _badge(String text, Color c) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
    decoration: BoxDecoration(color: c.withAlpha(30), borderRadius: BorderRadius.circular(4)),
    child: Text(text, style: TextStyle(color: c, fontSize: 7, fontWeight: FontWeight.w800, letterSpacing: 1)),
  );

  Widget _chip(String text) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(6)),
    child: Text(text, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
  );

  IconData _trackedIcon(String type) {
    switch (type) { case 'pet': return Icons.pets; case 'vehicle': return Icons.directions_car; case 'tag': return Icons.sell; case 'person': return Icons.person_pin; default: return Icons.location_on; }
  }

  double _distance(double lat, double lng) => const Distance().as(LengthUnit.Kilometer, _userLocation, LatLng(lat, lng));

  // --- Nearby bottom sheet ---
  void _showNearby(List<Incident> incidents) {
    final sorted = [...incidents]..sort((a, b) => _distance(a.latitude, a.longitude).compareTo(_distance(b.latitude, b.longitude)));
    final nearby = sorted.take(10).toList();
    showModalBottomSheet(context: context, backgroundColor: Colors.transparent, isScrollControlled: true,
      builder: (sheetCtx) => Container(
        height: MediaQuery.of(context).size.height * 0.45,
        decoration: BoxDecoration(color: Theme.of(context).scaffoldBackgroundColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(20)), border: const Border(top: BorderSide(color: AppColors.border))),
        child: Column(children: [
          const SizedBox(height: 8),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2))),
          Padding(padding: const EdgeInsets.all(16), child: Row(children: [
            Icon(Icons.near_me, size: 16, color: Theme.of(context).colorScheme.primary), const SizedBox(width: 8),
            const Text('Nearby', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)), const Spacer(),
            Text('${nearby.length} incidents', style: const TextStyle(color: AppColors.textTertiary, fontSize: 11)),
          ])),
          Expanded(child: ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: nearby.length,
            itemBuilder: (_, i) {
              final inc = nearby[i]; final color = AppColors.category(inc.category); final emoji = _categoryEmoji[inc.category] ?? '📍';
              final dist = _distance(inc.latitude, inc.longitude);
              final distStr = dist < 1 ? '${(dist * 1000).round()}m' : '${dist.toStringAsFixed(1)}km';
              return Material(color: Colors.transparent, child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () {
                  Navigator.pop(sheetCtx);
                  _selectIncident(inc);
                },
                child: Container(margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: Theme.of(context).cardTheme.color, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                  child: Row(children: [
                    Container(width: 32, height: 32, decoration: BoxDecoration(shape: BoxShape.circle, color: color.withAlpha(30), border: Border.all(color: color.withAlpha(76))), child: Center(child: Text(emoji, style: const TextStyle(fontSize: 15)))),
                    const SizedBox(width: 10),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(inc.title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text(inc.category.toUpperCase(), style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 1)),
                    ])),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text(distStr, style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 11, fontWeight: FontWeight.w700)),
                      Container(width: 5, height: 5, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.severity(inc.severity))),
                    ]),
                  ])),
              ));
            },
          )),
        ]),
      ),
    );
  }

  // --- Full detail sheet ---
  void _showIncidentDetail(Incident inc) {
    final color = AppColors.category(inc.category);
    showModalBottomSheet(context: context, backgroundColor: Theme.of(context).cardTheme.color, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SingleChildScrollView(padding: const EdgeInsets.all(20), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 16),
        Row(children: [_badge(_categoryLabel[inc.category] ?? inc.category.toUpperCase(), color), const SizedBox(width: 8), if (inc.isVerified) _badge('✓ VERIFICADO', AppColors.success)]),
        const SizedBox(height: 12),
        Text(inc.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        if (inc.description.isNotEmpty) ...[const SizedBox(height: 6), Text(inc.description, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))],
        const SizedBox(height: 8),
        if (inc.reporterName.isNotEmpty) Row(children: [
          const Icon(Icons.person_outline, size: 14, color: AppColors.textTertiary),
          const SizedBox(width: 4),
          Text('por ${inc.reporterName}', style: const TextStyle(color: AppColors.textTertiary, fontSize: 11)),
        ]),
        const SizedBox(height: 12),
        Row(children: [_chip('👍 ${inc.confirmCount}'), const SizedBox(width: 10), _chip('👎 ${inc.denyCount}'), const SizedBox(width: 10), _chip('👁 ${inc.views}')]),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: ElevatedButton.icon(onPressed: () { ref.read(incidentsProvider.notifier).confirm(inc.id); Navigator.pop(context); },
            icon: const Icon(Icons.thumb_up, size: 16), label: const Text('Confirmar'),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success.withAlpha(38), foregroundColor: AppColors.success))),
          const SizedBox(width: 8),
          Expanded(child: ElevatedButton.icon(onPressed: () { ref.read(incidentsProvider.notifier).deny(inc.id); Navigator.pop(context); },
            icon: const Icon(Icons.thumb_down, size: 16), label: const Text('Negar'),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error.withAlpha(38), foregroundColor: AppColors.error))),
        ]),
        const SizedBox(height: 8),
      ])),
    );
  }

  // --- Report sheet ---
  void _showReportSheet() {
    final titleCtrl = TextEditingController();
    String category = 'other';
    showModalBottomSheet(context: context, backgroundColor: Theme.of(context).cardTheme.color, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) => SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          const Text('Report Incident', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          TextField(controller: titleCtrl, decoration: const InputDecoration(hintText: 'Incident title')),
          const SizedBox(height: 12),
          Wrap(spacing: 6, runSpacing: 6, children: _categoryEmoji.entries.map((e) {
            final sel = category == e.key; final c = AppColors.category(e.key);
            return Material(color: Colors.transparent, child: InkWell(borderRadius: BorderRadius.circular(8),
              onTap: () => setS(() => category = e.key),
              child: AnimatedContainer(duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), color: sel ? c.withAlpha(50) : AppColors.glass, border: Border.all(color: sel ? c : AppColors.border)),
                child: Text('${e.value} ${e.key}', style: TextStyle(fontSize: 10, color: sel ? c : AppColors.textSecondary)))));
          }).toList()),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: () {
              if (titleCtrl.text.isEmpty) return;
              ref.read(incidentsProvider.notifier).create({'title': titleCtrl.text, 'category': category, 'severity': 'medium', 'latitude': _userLocation.latitude, 'longitude': _userLocation.longitude});
              Navigator.pop(ctx);
            },
            child: const Text('SUBMIT REPORT'),
          )),
        ]),
      )),
    );
  }
}

// --- Tracked items side panel ---
class _TrackedItemsPanel extends StatelessWidget {
  final List<TrackedItem> items;
  final String? selectedId;
  final String? activeNavId;
  final void Function(TrackedItem) onSelect;
  final void Function(TrackedItem) onNavigate;
  final VoidCallback onClose;
  final bool isDark;
  final LatLng userLocation;

  const _TrackedItemsPanel({
    required this.items, this.selectedId, this.activeNavId,
    required this.onSelect, required this.onNavigate, required this.onClose,
    required this.isDark, required this.userLocation,
  });

  double _dist(TrackedItem item) {
    if (!item.hasLocation) return double.infinity;
    return const Distance().as(LengthUnit.Kilometer, userLocation, LatLng(item.latitude!, item.longitude!));
  }

  @override
  Widget build(BuildContext context) {
    final bg = isDark ? AppColors.background.withAlpha(240) : Colors.white.withAlpha(245);
    return Container(
      width: 220,
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.secondary.withAlpha(50)),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(60), blurRadius: 16)],
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 8, 6),
          child: Row(children: [
            Icon(Icons.track_changes, size: 14, color: AppColors.secondary),
            const SizedBox(width: 6),
            const Expanded(child: Text('TRACKED ITEMS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1))),
            GestureDetector(onTap: onClose, child: const Icon(Icons.close, size: 16, color: AppColors.textTertiary)),
          ]),
        ),
        const Divider(height: 1, color: AppColors.border),
        Flexible(
          child: ListView.builder(
            shrinkWrap: true,
            padding: const EdgeInsets.symmetric(vertical: 4),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final item = items[i];
              final color = _trackedItemColors[item.itemType] ?? AppColors.secondary;
              final isSelected = selectedId == item.id;
              final isNav = activeNavId == item.id;
              final dist = _dist(item);
              final distStr = dist == double.infinity ? 'No GPS' : (dist < 1 ? '${(dist * 1000).round()}m' : '${dist.toStringAsFixed(1)}km');

              return Material(
                color: isSelected ? color.withAlpha(20) : Colors.transparent,
                child: InkWell(
                  onTap: () => onSelect(item),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: isSelected ? BoxDecoration(border: Border(left: BorderSide(color: color, width: 3))) : null,
                    child: Row(children: [
                      Container(
                        width: 28, height: 28,
                        decoration: BoxDecoration(shape: BoxShape.circle, color: color.withAlpha(25), border: Border.all(color: color.withAlpha(80))),
                        child: Icon(_iconForType(item.itemType), size: 14, color: color),
                      ),
                      const SizedBox(width: 8),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(item.name, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                        Row(children: [
                          if (isNav) ...[
                            Container(width: 5, height: 5, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.success)),
                            const SizedBox(width: 3),
                          ],
                          Text(isNav ? 'Tracking' : distStr, style: TextStyle(color: isNav ? AppColors.success : AppColors.textTertiary, fontSize: 8, fontWeight: isNav ? FontWeight.w700 : FontWeight.w400)),
                        ]),
                      ])),
                      if (item.hasLocation)
                        GestureDetector(
                          onTap: () => onNavigate(item),
                          child: Container(
                            width: 24, height: 24,
                            decoration: BoxDecoration(borderRadius: BorderRadius.circular(6), color: color.withAlpha(20), border: Border.all(color: color.withAlpha(50))),
                            child: Icon(Icons.navigation, size: 12, color: color),
                          ),
                        ),
                    ]),
                  ),
                ),
              );
            },
          ),
        ),
      ]),
    );
  }

  IconData _iconForType(String type) {
    switch (type) { case 'pet': return Icons.pets; case 'vehicle': return Icons.directions_car; case 'tag': return Icons.sell; case 'person': return Icons.person_pin; default: return Icons.location_on; }
  }
}

// --- Animated tracked marker on the map ---
class _TrackedMarkerDot extends StatelessWidget {
  final Color color;
  final IconData icon;
  final bool isSelected;
  final bool isActiveNav;
  final AnimationController pulseCtrl;

  const _TrackedMarkerDot({required this.color, required this.icon, required this.isSelected, required this.isActiveNav, required this.pulseCtrl});

  @override
  Widget build(BuildContext context) {
    final size = isSelected ? 40.0 : 32.0;
    if (isActiveNav) {
      return _AnimBuilder2(
        listenable: pulseCtrl,
        builder: (_, __) {
          final v = pulseCtrl.value;
          return Container(
            width: size + v * 8, height: size + v * 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withAlpha(30 + (v * 20).round()),
              border: Border.all(color: color, width: 2.5),
              boxShadow: [BoxShadow(color: color.withAlpha(60 + (v * 60).round()), blurRadius: 12 + v * 8, spreadRadius: v * 3)],
            ),
            child: Icon(icon, size: isSelected ? 20 : 16, color: color),
          );
        },
      );
    }
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      width: size, height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withAlpha(isSelected ? 50 : 30),
        border: Border.all(color: color, width: isSelected ? 2.5 : 1.5),
        boxShadow: isSelected
          ? [BoxShadow(color: color.withAlpha(80), blurRadius: 12, spreadRadius: 2)]
          : [BoxShadow(color: Colors.black.withAlpha(40), blurRadius: 4)],
      ),
      child: Icon(icon, size: isSelected ? 20 : 16, color: color),
    );
  }
}

class _AnimatedTrackIcon extends StatelessWidget {
  final Color color;
  final IconData icon;
  final AnimationController ctrl;
  const _AnimatedTrackIcon({required this.color, required this.icon, required this.ctrl});

  @override
  Widget build(BuildContext context) {
    return _AnimBuilder2(
      listenable: ctrl,
      builder: (_, __) {
        final v = ctrl.value;
        return Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withAlpha(25 + (v * 15).round()),
            border: Border.all(color: color, width: 2),
            boxShadow: [BoxShadow(color: color.withAlpha(40 + (v * 40).round()), blurRadius: 8 + v * 6)],
          ),
          child: Icon(icon, size: 18, color: color),
        );
      },
    );
  }
}

// --- Reusable widgets ---

class _MapButton extends StatelessWidget {
  final IconData icon; final VoidCallback onTap; final Color? color; final String? label; final bool active; final Color cardBg; final bool isDark;
  const _MapButton({required this.icon, required this.onTap, this.color, this.label, this.active = false, required this.cardBg, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final c = color ?? (isDark ? AppColors.textSecondary : AppColors.lightMuted);
    return Material(color: Colors.transparent, child: InkWell(borderRadius: BorderRadius.circular(14), onTap: onTap,
      child: AnimatedContainer(duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(horizontal: label != null ? 14 : 10, vertical: 10),
        decoration: BoxDecoration(color: active ? c.withAlpha(38) : cardBg, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: active ? c : (isDark ? AppColors.border : AppColors.lightBorder)),
          boxShadow: [BoxShadow(color: Colors.black.withAlpha(isDark ? 76 : 25), blurRadius: 8)]),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 20, color: c),
          if (label != null) ...[const SizedBox(width: 6), Text(label!, style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w700))],
        ]))));
  }
}

class _ThumbBtn extends StatefulWidget {
  final IconData icon; final int count; final Color color; final VoidCallback onTap;
  const _ThumbBtn({required this.icon, required this.count, required this.color, required this.onTap});
  @override
  State<_ThumbBtn> createState() => _ThumbBtnState();
}

class _ThumbBtnState extends State<_ThumbBtn> with SingleTickerProviderStateMixin {
  late AnimationController _anim;
  bool _flashed = false;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
  }

  @override
  void dispose() { _anim.dispose(); super.dispose(); }

  void _handleTap() {
    _anim.forward(from: 0).then((_) { if (mounted) setState(() => _flashed = false); });
    setState(() => _flashed = true);
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: _handleTap,
        child: _AnimBuilder2(
          listenable: _anim,
          builder: (_, __) {
            final scale = 1.0 + (_anim.value < 0.5 ? _anim.value * 0.4 : (1 - _anim.value) * 0.4);
            return Transform.scale(
              scale: scale,
              child: Container(
                width: 36, height: 28,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: _flashed ? widget.color.withAlpha(50) : AppColors.glass,
                  border: Border.all(color: _flashed ? widget.color.withAlpha(120) : AppColors.border),
                ),
                child: Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: MainAxisSize.min, children: [
                  Icon(widget.icon, size: 12, color: _flashed ? widget.color : AppColors.textSecondary),
                  const SizedBox(width: 2),
                  Text('${widget.count}', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: _flashed ? widget.color : AppColors.textTertiary)),
                ]),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _AnimBuilder2 extends AnimatedWidget {
  final Widget Function(BuildContext, Widget?) builder;
  const _AnimBuilder2({required super.listenable, required this.builder});
  @override
  Widget build(BuildContext context) => builder(context, null);
}

class _PulsingDot extends AnimatedWidget {
  const _PulsingDot({required AnimationController ctrl}) : super(listenable: ctrl);
  @override
  Widget build(BuildContext context) {
    final v = (listenable as AnimationController).value;
    return Container(decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.primary,
      border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 3),
      boxShadow: [BoxShadow(color: AppColors.primary.withAlpha((76 + v * 50).round()), blurRadius: 12 + v * 8)]));
  }
}
