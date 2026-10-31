import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/publish_service.dart'; // NUEVO SERVICIO
import '../../../theme/mc_colores.dart';
import '../widgets/plan_selection_step.dart';
import '../widgets/details_form_step.dart';
import '../widgets/photo_upload_step.dart';

class UploadPage extends StatefulWidget {
  const UploadPage({super.key});

  @override
  State<UploadPage> createState() => _UploadPageState();
}

class _UploadPageState extends State<UploadPage> {
  int _currentStep = 0;
  String _selectedPlan = 'free';
  bool _isPublishing = false; // Controla la bolita de carga

  final Map<String, dynamic> _adData = {
    'atributos_clave': <String, dynamic>{},
  };

  Map<String, dynamic>? _tokenData;
  static const _maxPhotosByPlan = {
    'free': 5,
    'basico': 10,
    'premium': 15,
    'destacado': 20,
  };
  int get _maxPhotos => _maxPhotosByPlan[_selectedPlan] ?? 5;

  final List<XFile> _selectedImages = [];
  final PublishService _publishService =
      PublishService(); // Instancia del servicio

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  // FUNCIÓN CONECTADA A SUPABASE
  Future<void> _submitAd() async {
    // Mismas validaciones obligatorias de la web
    final title = (_adData['titulo'] ?? '').toString().trim();
    final price = double.tryParse((_adData['precio'] ?? '').toString()) ?? 0;
    if (_adData['categoria'] == null)
      return _showError('Selecciona una categoría');
    if (_adData['provincia'] == null)
      return _showError('Selecciona provincia y distrito');
    if (title.isEmpty) return _showError('Por favor ingresa un título');
    if (price < 1) return _showError('Ingresa un precio válido');
    if ((_adData['descripcion'] ?? '').toString().trim().isEmpty) {
      return _showError('Escribe una descripción');
    }
    if (_adData['terms'] != true) {
      return _showError('Debes aceptar los términos y condiciones');
    }
    if (_selectedImages.isEmpty) return _showError('Sube al menos 1 foto');

    setState(() => _isPublishing = true); // Mostrar cargando

    // Llamamos al servicio que acabamos de crear
    final success = await _publishService.publishAd(
      adData: _adData,
      images: _selectedImages,
      selectedPlan: _selectedPlan,
      token: _tokenData,
    );

    if (success) {
      setState(() => _isPublishing = false); // Apaga la bolita

      // 1. Mensaje de victoria
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('¡Anuncio publicado con éxito! 🚀'),
          backgroundColor: Colors.green,
        ),
      );

      // 2. 🚨 EL TIMÓN CORRECTO: Devolver al usuario a la pantalla principal (Home)
      // Esto cierra la pantalla de publicar y te deja en el Home de forma segura.
      Navigator.popUntil(context, (route) => route.isFirst);
    } else {
      setState(() => _isPublishing = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Error al publicar. Intenta de nuevo.'),
            backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Publicar Anuncio',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
            icon: const Icon(Icons.close, color: Colors.black),
            onPressed: () => Navigator.pop(context)),
      ),
      // SI ESTÁ PUBLICANDO, MOSTRAMOS UN CARGANDO GIGANTE, SI NO, EL STEPPER
      body: _isPublishing
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Mc.naranja),
                  SizedBox(height: 20),
                  Text('Subiendo fotos y publicando anuncio...',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.blueGrey)),
                ],
              ),
            )
          : Theme(
              data: Theme.of(context).copyWith(
                colorScheme:
                    Theme.of(context).colorScheme.copyWith(primary: Mc.naranja),
              ),
              child: Stepper(
                type: StepperType.horizontal,
                currentStep: _currentStep,
                elevation: 0,
                controlsBuilder: (context, details) {
                  final isLastStep = _currentStep == 2;
                  return Padding(
                    padding: const EdgeInsets.only(top: 20),
                    child: Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Mc.naranja,
                              minimumSize: const Size(0, 50),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(26)),
                            ),
                            onPressed: details.onStepContinue,
                            child: Text(
                                isLastStep ? 'PUBLICAR ANUNCIO' : 'CONTINUAR',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold)),
                          ),
                        ),
                        if (_currentStep > 0) ...[
                          const SizedBox(width: 15),
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                  minimumSize: const Size(0, 50)),
                              onPressed: details.onStepCancel,
                              child: const Text('VOLVER',
                                  style: TextStyle(color: Colors.grey)),
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
                onStepContinue: () {
                  if (_currentStep < 2) {
                    setState(() => _currentStep += 1);
                  } else {
                    _submitAd(); // AL TOCAR PUBLICAR AHORA, SE EJECUTA LA MAGIA
                  }
                },
                onStepCancel: () {
                  if (_currentStep > 0) setState(() => _currentStep -= 1);
                },
                steps: [
                  Step(
                    title: const Text('Planes', style: TextStyle(fontSize: 12)),
                    content: PlanSelectionStep(
                      selectedPlan: _selectedPlan,
                      onPlanSelected: (plan) => setState(() {
                        _selectedPlan = plan;
                        if (_selectedImages.length > _maxPhotos) {
                          _selectedImages.removeRange(
                              _maxPhotos, _selectedImages.length);
                        }
                      }),
                      onTokenChanged: (token) => _tokenData = token,
                    ),
                    isActive: _currentStep >= 0,
                    state: _currentStep > 0
                        ? StepState.complete
                        : StepState.indexed,
                  ),
                  Step(
                    title:
                        const Text('Detalles', style: TextStyle(fontSize: 12)),
                    content: DetailsFormStep(
                      formData: _adData,
                      onDataChanged: () {},
                    ),
                    isActive: _currentStep >= 1,
                    state: _currentStep > 1
                        ? StepState.complete
                        : StepState.indexed,
                  ),
                  Step(
                    title: const Text('Fotos', style: TextStyle(fontSize: 12)),
                    content: PhotoUploadStep(
                      images: _selectedImages,
                      maxImages: _maxPhotos,
                      onImagesChanged: () => setState(() {}),
                    ),
                    isActive: _currentStep >= 2,
                  ),
                ],
              ),
            ),
    );
  }
}
