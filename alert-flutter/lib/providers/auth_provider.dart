import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/api_service.dart';

final apiProvider = Provider<ApiService>((ref) => ApiService());

class AuthState {
  final UserProfile? user;
  final bool isLoading;
  final String? error;
  AuthState({this.user, this.isLoading = false, this.error});
  bool get isAuthenticated => user != null;
  AuthState copyWith({UserProfile? user, bool? isLoading, String? error, bool clearError = false}) =>
      AuthState(user: user ?? this.user, isLoading: isLoading ?? this.isLoading, error: clearError ? null : (error ?? this.error));
}

bool _isConnectionError(Object e) {
  if (e is DioException) {
    return e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.receiveTimeout;
  }
  if (e is SocketException) return true;
  return false;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _api;
  AuthNotifier(this._api) : super(AuthState());

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await _api.login(email, password);
      await _api.saveToken(res.data['token']);
      state = AuthState(user: UserProfile.fromJson(res.data['user']));
      return true;
    } catch (e) {
      if (_isConnectionError(e)) {
        state = AuthState(error: 'Sem conexão com o servidor. Verifique sua rede.');
        return false;
      }
      state = AuthState(error: 'Credenciais inválidas');
      return false;
    }
  }

  Future<bool> register(String email, String password, String name) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await _api.register(email, password, name);
      await _api.saveToken(res.data['token']);
      state = AuthState(user: UserProfile.fromJson(res.data['user']));
      return true;
    } catch (e) {
      if (_isConnectionError(e)) {
        state = AuthState(error: 'Sem conexão com o servidor. Verifique sua rede.');
        return false;
      }
      state = AuthState(error: 'Erro ao criar conta');
      return false;
    }
  }

  Future<void> checkAuth() async {
    final token = await _api.getToken();
    if (token == null) return;
    try {
      final res = await _api.getMe();
      state = AuthState(user: UserProfile.fromJson(res.data));
    } catch (_) {
      await _api.clearToken();
    }
  }

  Future<void> logout() async {
    await _api.clearToken();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiProvider));
});
