import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000');

  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService() : _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 3),
    receiveTimeout: const Duration(seconds: 5),
    headers: {'Content-Type': 'application/json'},
  )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
    ));
  }

  Future<void> saveToken(String token) => _storage.write(key: 'auth_token', value: token);
  Future<void> clearToken() => _storage.delete(key: 'auth_token');
  Future<String?> getToken() => _storage.read(key: 'auth_token');

  // Auth
  Future<Response> login(String email, String password) =>
      _dio.post('/auth/login', data: {'email': email, 'password': password});

  Future<Response> register(String email, String password, String displayName) =>
      _dio.post('/auth/register', data: {'email': email, 'password': password, 'displayName': displayName});

  Future<Response> getMe() => _dio.get('/auth/me');

  // Incidents
  Future<Response> getIncidents() => _dio.get('/incidents');

  Future<Response> createIncident(Map<String, dynamic> data) => _dio.post('/incidents', data: data);

  Future<Response> confirmIncident(String id) => _dio.patch('/incidents/$id/confirm');
  Future<Response> denyIncident(String id) => _dio.patch('/incidents/$id/deny');

  // Family
  Future<Response> getFamilyGroups() => _dio.get('/family/groups');
  Future<Response> createFamilyGroup(String name) => _dio.post('/family/groups', data: {'name': name});
  Future<Response> joinFamily(String code) => _dio.post('/family/join', data: {'inviteCode': code});
  Future<Response> getFamilyMembers() => _dio.get('/family/members');
  Future<Response> updateMemberLocation(String id, double lat, double lng, int battery) =>
      _dio.patch('/family/members/$id/location', data: {'latitude': lat, 'longitude': lng, 'batteryLevel': battery, 'isOnline': true});

  // Chains
  Future<Response> getChains() => _dio.get('/chains');
  Future<Response> createChain(String name) => _dio.post('/chains', data: {'name': name});
  Future<Response> joinChain(String code) => _dio.post('/chains/join', data: {'inviteCode': code});

  // Tracking
  Future<Response> getTrackedItems() => _dio.get('/tracked-items');
  Future<Response> addTrackedItem(String name, String type, {String? icon}) =>
      _dio.post('/tracked-items', data: {'name': name, 'itemType': type, 'icon': icon ?? 'map-marker'});
  Future<Response> updateItemLocation(String id, double lat, double lng) =>
      _dio.patch('/tracked-items/$id/location', data: {'latitude': lat, 'longitude': lng});
  Future<Response> deleteTrackedItem(String id) => _dio.delete('/tracked-items/$id');

  // SOS
  Future<Response> sendSOS(double lat, double lng, {String? contact}) =>
      _dio.post('/sos/alert', data: {'latitude': lat, 'longitude': lng, 'contactName': contact});
  Future<Response> sendFamilyPanic(double lat, double lng) =>
      _dio.post('/sos/family-panic', data: {'latitude': lat, 'longitude': lng});

  // Cameras
  Future<Response> getCameras() => _dio.get('/cameras');
}
