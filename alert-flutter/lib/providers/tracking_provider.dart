import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/incident.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

class TrackingState {
  final List<TrackedItem> items;
  final bool isLoading;
  TrackingState({this.items = const [], this.isLoading = false});
}

class TrackingNotifier extends StateNotifier<TrackingState> {
  final ApiService _api;
  TrackingNotifier(this._api) : super(TrackingState());

  Future<void> load() async {
    state = TrackingState(items: state.items, isLoading: true);
    try {
      final res = await _api.getTrackedItems();
      final list = (res.data as List).map((j) => TrackedItem.fromJson(j)).toList();
      state = TrackingState(items: list);
    } catch (_) {
      state = TrackingState(items: state.items);
    }
  }

  Future<void> add(String name, String type, {String? icon}) async {
    try { await _api.addTrackedItem(name, type, icon: icon); await load(); } catch (_) {}
  }

  Future<void> updateLocation(String id, double lat, double lng) async {
    try { await _api.updateItemLocation(id, lat, lng); await load(); } catch (_) {}
  }

  Future<void> remove(String id) async {
    try { await _api.deleteTrackedItem(id); await load(); } catch (_) {}
  }
}

final trackingProvider = StateNotifierProvider<TrackingNotifier, TrackingState>((ref) {
  return TrackingNotifier(ref.read(apiProvider));
});
