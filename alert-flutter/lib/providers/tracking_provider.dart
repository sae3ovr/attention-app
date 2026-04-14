import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../models/incident.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

class TrackingState {
  final List<TrackedItem> items;
  final bool isLoading;
  final String? activeTrackingId;
  TrackingState({this.items = const [], this.isLoading = false, this.activeTrackingId});

  TrackingState copyWith({List<TrackedItem>? items, bool? isLoading, String? activeTrackingId, bool clearActive = false}) {
    return TrackingState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      activeTrackingId: clearActive ? null : (activeTrackingId ?? this.activeTrackingId),
    );
  }

  TrackedItem? get activeItem {
    if (activeTrackingId == null) return null;
    try { return items.firstWhere((i) => i.id == activeTrackingId); } catch (_) { return null; }
  }
}

class TrackingNotifier extends StateNotifier<TrackingState> {
  final ApiService _api;
  Timer? _pollTimer;
  StreamSubscription<Position>? _locationStream;

  TrackingNotifier(this._api) : super(TrackingState());

  Future<void> load() async {
    state = state.copyWith(isLoading: true);
    try {
      final res = await _api.getTrackedItems();
      final list = (res.data as List).map((j) => TrackedItem.fromJson(j)).toList();
      state = state.copyWith(items: list, isLoading: false);
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> add(String name, String type, {String? icon}) async {
    try { await _api.addTrackedItem(name, type, icon: icon); await load(); } catch (_) {}
  }

  Future<void> updateLocation(String id, double lat, double lng) async {
    try { await _api.updateItemLocation(id, lat, lng); await load(); } catch (_) {}
  }

  Future<void> remove(String id) async {
    if (state.activeTrackingId == id) stopTracking();
    try { await _api.deleteTrackedItem(id); await load(); } catch (_) {}
  }

  void startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) => load());
  }

  void stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  void startTracking(String itemId) {
    state = state.copyWith(activeTrackingId: itemId);
    startPolling();
  }

  void stopTracking() {
    state = state.copyWith(clearActive: true);
    stopPolling();
  }

  Future<void> pushDeviceLocationToItem(String id) async {
    try {
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      await updateLocation(id, pos.latitude, pos.longitude);
    } catch (_) {}
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _locationStream?.cancel();
    super.dispose();
  }
}

final trackingProvider = StateNotifierProvider<TrackingNotifier, TrackingState>((ref) {
  return TrackingNotifier(ref.read(apiProvider));
});
