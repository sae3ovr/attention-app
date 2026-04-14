import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/incident.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

final _rng = Random();
const _demoCenter = [41.2356, -8.6200];
const _categories = ['robbery', 'accident', 'suspicious', 'fire', 'medical', 'traffic', 'noise', 'other'];
const _titles = {
  'robbery': ['Tentativa de assalto', 'Furto de telemóvel', 'Roubo de carteira', 'Assalto a viatura'],
  'accident': ['Colisão entre 2 viaturas', 'Atropelamento de peão', 'Despiste de motociclo'],
  'suspicious': ['Veículo suspeito estacionado', 'Pessoa com comportamento errático', 'Drone não autorizado'],
  'fire': ['Foco de incêndio em terreno', 'Fumo visível em prédio', 'Alarme de incêndio'],
  'medical': ['Pessoa inconsciente no passeio', 'Queda de idoso', 'Reação alérgica grave'],
  'traffic': ['Congestionamento na VCI', 'Semáforo avariado', 'Via cortada por acidente'],
  'noise': ['Festa com música alta', 'Obras fora de horário', 'Alarme de carro a tocar'],
  'other': ['Situação suspeita', 'Necessita verificação', 'Reporte geral'],
};

List<Incident> _generateMockIncidents() {
  return List.generate(30, (i) {
    final cat = _categories[_rng.nextInt(_categories.length)];
    final titles = _titles[cat]!;
    return Incident(
      id: 'mock-$i',
      title: '${titles[_rng.nextInt(titles.length)]} — Rua ${_rng.nextInt(200) + 1}',
      category: cat,
      severity: ['low', 'medium', 'high', 'critical'][_rng.nextInt(4)],
      latitude: _demoCenter[0] + (_rng.nextDouble() - 0.5) * 0.06,
      longitude: _demoCenter[1] + (_rng.nextDouble() - 0.5) * 0.06,
      isVerified: _rng.nextDouble() > 0.6,
      confirmCount: _rng.nextInt(20),
      denyCount: _rng.nextInt(5),
      views: _rng.nextInt(100),
      createdAt: DateTime.now().subtract(Duration(minutes: _rng.nextInt(180))),
    );
  });
}

class IncidentsState {
  final List<Incident> incidents;
  final bool isLoading;
  IncidentsState({this.incidents = const [], this.isLoading = false});
}

class IncidentsNotifier extends StateNotifier<IncidentsState> {
  final ApiService _api;
  IncidentsNotifier(this._api) : super(IncidentsState());

  Future<void> load() async {
    state = IncidentsState(incidents: state.incidents, isLoading: true);
    try {
      final res = await _api.getIncidents();
      final list = (res.data as List).map((j) => Incident.fromJson(j)).toList();
      state = IncidentsState(incidents: list);
    } catch (_) {
      if (state.incidents.isEmpty) {
        state = IncidentsState(incidents: _generateMockIncidents());
      } else {
        state = IncidentsState(incidents: state.incidents);
      }
    }
  }

  Future<void> create(Map<String, dynamic> data) async {
    try {
      await _api.createIncident(data);
      await load();
    } catch (_) {
      final mock = Incident(
        id: 'local-${DateTime.now().millisecondsSinceEpoch}',
        title: data['title'] ?? 'Novo incidente',
        category: data['category'] ?? 'other',
        severity: data['severity'] ?? 'medium',
        latitude: (data['latitude'] as num?)?.toDouble() ?? _demoCenter[0],
        longitude: (data['longitude'] as num?)?.toDouble() ?? _demoCenter[1],
      );
      state = IncidentsState(incidents: [mock, ...state.incidents]);
    }
  }

  Future<void> confirm(String id) async {
    try { await _api.confirmIncident(id); } catch (_) {}
    state = IncidentsState(incidents: state.incidents.map((i) =>
      i.id == id ? Incident(id: i.id, title: i.title, category: i.category, severity: i.severity,
        latitude: i.latitude, longitude: i.longitude, isVerified: i.isVerified,
        confirmCount: i.confirmCount + 1, denyCount: i.denyCount, views: i.views, createdAt: i.createdAt)
      : i).toList());
  }

  Future<void> deny(String id) async {
    try { await _api.denyIncident(id); } catch (_) {}
    state = IncidentsState(incidents: state.incidents.map((i) =>
      i.id == id ? Incident(id: i.id, title: i.title, category: i.category, severity: i.severity,
        latitude: i.latitude, longitude: i.longitude, isVerified: i.isVerified,
        confirmCount: i.confirmCount, denyCount: i.denyCount + 1, views: i.views, createdAt: i.createdAt)
      : i).toList());
  }
}

final incidentsProvider = StateNotifierProvider<IncidentsNotifier, IncidentsState>((ref) {
  return IncidentsNotifier(ref.read(apiProvider));
});
