import 'package:flutter/material.dart';

/// Confirmación para eliminar la cuenta: el usuario debe escribir ELIMINAR.
/// Devuelve true si confirma.
class DeleteAccountDialog extends StatefulWidget {
  const DeleteAccountDialog({super.key});

  static Future<bool> mostrar(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => const DeleteAccountDialog(),
    );
    return ok == true;
  }

  @override
  State<DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<DeleteAccountDialog> {
  static const String _palabra = 'ELIMINAR';
  final _controller = TextEditingController();
  bool _coincide = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('¿Eliminar tu cuenta?'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Esta acción es permanente. Se borrarán tu perfil, tus anuncios '
            'y sus fotos, tus favoritos, reseñas y conversaciones. '
            'No se puede deshacer.',
          ),
          const SizedBox(height: 14),
          const Text('Escribe ELIMINAR para confirmar:'),
          const SizedBox(height: 8),
          TextField(
            controller: _controller,
            autofocus: true,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: _palabra,
            ),
            onChanged: (value) {
              final coincide = value.trim().toUpperCase() == _palabra;
              if (coincide != _coincide) setState(() => _coincide = coincide);
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _coincide ? () => Navigator.pop(context, true) : null,
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: const Text('Eliminar cuenta'),
        ),
      ],
    );
  }
}
