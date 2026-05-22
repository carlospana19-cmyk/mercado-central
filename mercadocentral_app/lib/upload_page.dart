import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';

class UploadPage extends StatefulWidget {
  const UploadPage({super.key});
  @override
  State<UploadPage> createState() => _UploadPageState();
}

class _UploadPageState extends State<UploadPage> {
  int _currentStep = 0;
  bool _isLoading = false;
  bool _isTokenValidado = false;

  // Controllers
  final _tituloController = TextEditingController();
  final _precioController = TextEditingController();
  final _descController = TextEditingController();
  final _tokenController = TextEditingController();

  String _selectedPlan = 'free';
  String _selectedProvincia = 'Panamá';
  XFile? _portadaFile;
  List<XFile> _galeriaFiles = [];

  // Configuración de planes (Basado en tu imagen)
  final Map<String, dynamic> _planes = {
    'free': {'nombre': 'Gratis', 'precio': 0, 'color': Colors.grey},
    'bronce': {'nombre': 'Bronce', 'precio': 10, 'color': Colors.orange},
    'plata': {'nombre': 'Plata', 'precio': 20, 'color': Colors.blueGrey},
    'oro': {'nombre': 'Oro', 'precio': 30, 'color': Colors.amber},
    'top': {'nombre': 'Top/Destacado', 'precio': 50, 'color': Colors.redAccent},
  };

  // --- VALIDAR TOKEN ---
  Future<void> _validarToken() async {
    if (_tokenController.text.isEmpty) return;
    
    setState(() => _isLoading = true);
    try {
      final data = await Supabase.instance.client
          .from('plan_tokens')
          .select()
          .eq('codigo', _tokenController.text)
          .eq('usado', false)
          .maybeSingle();

      if (data != null) {
        setState(() {
          _isTokenValidado = true;
          _selectedPlan = data['tipo_plan']; // El token define el plan
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('¡Token de Plan ${_selectedPlan.toUpperCase()} validado! ✅'))
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Token inválido o ya usado ❌'))
        );
      }
    } catch (e) {
      print(e);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // --- PUBLICAR ---
  Future<void> _publicar() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser!.id;

      // 1. Subir Imagen Portada
      final bytes = await _portadaFile!.readAsBytes();
      final path = '$userId/portada_${DateTime.now().millisecondsSinceEpoch}.jpg';
      await supabase.storage.from('imagenes_anuncios').uploadBinary(path, bytes);
      final urlPortada = supabase.storage.from('imagenes_anuncios').getPublicUrl(path);

      // 2. Insertar Anuncio con lógica de Pago/Token
      await supabase.from('anuncios').insert({
        'titulo': _tituloController.text,
        'precio': _precioController.text,
        'descripcion': _descController.text,
        'url_portada': urlPortada,
        'provincia': _selectedProvincia,
        'selected_plan': _selectedPlan,
        'user_id': userId,
        'payment_status': _isTokenValidado ? 'completed' : (_selectedPlan == 'free' ? 'completed' : 'pending'),
        'estado': 'aprobado',
      });

      // 3. Quemar Token si se usó
      if (_isTokenValidado) {
        await supabase.from('plan_tokens').update({'usado': true}).eq('codigo', _tokenController.text);
      }

      if (mounted) Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nuevo Anuncio'), backgroundColor: const Color(0xFF00c2cb)),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Stepper(
            currentStep: _currentStep,
            onStepContinue: () {
              if (_currentStep < 2) setState(() => _currentStep++);
              else _publicar();
            },
            onStepCancel: () => _currentStep > 0 ? setState(() => _currentStep--) : null,
            steps: [
              // PASO 1: PLAN Y TOKEN (Como tu imagen)
              Step(
                title: const Text('Plan y Pago'),
                content: Column(
                  children: [
                    const Text('Selecciona tu Plan:', style: TextStyle(fontWeight: FontWeight.bold)),
                    ..._planes.entries.map((e) => RadioListTile(
                      title: Text('${e.value['nombre']} (\$${e.value['precio']})'),
                      value: e.key,
                      groupValue: _selectedPlan,
                      onChanged: _isTokenValidado ? null : (val) => setState(() => _selectedPlan = val.toString()),
                    )),
                    const Divider(),
                    const Text('¿Tienes un Token? Canjéalo aquí:', style: TextStyle(fontSize: 12)),
                    Row(
                      children: [
                        Expanded(child: TextField(controller: _tokenController, decoration: const InputDecoration(hintText: 'Código de Token'))),
                        IconButton(onPressed: _validarToken, icon: const Icon(Icons.check_circle, color: Colors.green)),
                      ],
                    ),
                    if (_isTokenValidado) const Text('✅ Token Activado', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              // PASO 2: DATOS
              Step(
                title: const Text('Detalles'),
                content: Column(
                  children: [
                    TextField(controller: _tituloController, decoration: const InputDecoration(labelText: 'Título')),
                    TextField(controller: _precioController, decoration: const InputDecoration(labelText: 'Precio'), keyboardType: TextInputType.number),
                    const SizedBox(height: 10),
                    ElevatedButton.icon(onPressed: _pickPortada, icon: const Icon(Icons.camera), label: Text(_portadaFile == null ? 'Subir Portada' : 'Foto Lista ✅')),
                  ],
                ),
              ),
              // PASO 3: CONFIRMAR
              Step(
                title: const Text('Publicar'),
                content: Text('Plan seleccionado: ${_selectedPlan.toUpperCase()}\nEstado de pago: ${_isTokenValidado ? "Validado con Token" : "Pendiente"}'),
              ),
            ],
          ),
    );
  }

  Future<void> _pickPortada() async {
    final img = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (img != null) setState(() => _portadaFile = img);
  }
}