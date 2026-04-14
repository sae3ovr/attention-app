import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (_name.text.isEmpty || _email.text.isEmpty || _password.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Por favor, preencha todos os campos (senha mín. 8 caracteres)')));
      return;
    }
    final ok = await ref.read(authProvider.notifier).register(_email.text.trim(), _password.text, _name.text.trim());
    if (ok && mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Criar Conta'), leading: const BackButton()),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(children: [
                TextField(controller: _name, decoration: const InputDecoration(hintText: 'Nome de Exibição', prefixIcon: Icon(Icons.person_outline, size: 20))),
                const SizedBox(height: 14),
                TextField(controller: _email, decoration: const InputDecoration(hintText: 'Email', prefixIcon: Icon(Icons.email_outlined, size: 20)), keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 14),
                TextField(controller: _password, decoration: const InputDecoration(hintText: 'Senha (mín. 8 caracteres)', prefixIcon: Icon(Icons.lock_outline, size: 20)), obscureText: true),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(onPressed: auth.isLoading ? null : _register, child: const Text('CRIAR CONTA')),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
