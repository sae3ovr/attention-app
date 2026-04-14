import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';
import '../widgets/logo_mark.dart';
import '../providers/auth_provider.dart';
import 'register_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final ok = await ref.read(authProvider.notifier).login(_email.text.trim(), _password.text);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Credenciais inválidas'), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const LogoMark(size: 72),
                  const SizedBox(height: 20),
                  RichText(text: TextSpan(style: const TextStyle(fontFamily: 'monospace', fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.textPrimary, letterSpacing: 4, decoration: TextDecoration.none), children: [
                    const TextSpan(text: 'ALERT'),
                    TextSpan(text: '.IO', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w400, decoration: TextDecoration.none)),
                  ])),
                  const SizedBox(height: 6),
                  Text('FROM ALERT TO ACTION', style: TextStyle(fontFamily: 'monospace', fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.primary.withOpacity(0.5), letterSpacing: 3, decoration: TextDecoration.none)),
                  const SizedBox(height: 40),
                  TextField(
                    controller: _email,
                    decoration: const InputDecoration(hintText: 'E-mail', prefixIcon: Icon(Icons.email_outlined, size: 20, color: AppColors.textTertiary)),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _password,
                    decoration: const InputDecoration(hintText: 'Senha', prefixIcon: Icon(Icons.lock_outline, size: 20, color: AppColors.textTertiary)),
                    obscureText: true,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: auth.isLoading ? null : _login,
                      child: auth.isLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.background))
                          : const Text('ENTRAR'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                    child: Text('Não tem conta? Cadastre-se', style: TextStyle(color: AppColors.primary.withOpacity(0.7), fontSize: 13)),
                  ),
                  if (auth.error != null) ...[
                    const SizedBox(height: 12),
                    Text(auth.error!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
