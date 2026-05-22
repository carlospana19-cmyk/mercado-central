import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/publish_service.dart'; // NUEVO SERVICIO
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
    'atributos_clave': {},
  };
  
  final List<XFile> _selectedImages = [];
  final PublishService _publishService = PublishService(); // Instancia del servicio

  // FUNCIÓN CONECTADA A SUPABASE
  Future<void> _submitAd() async {
    // Validaciones básicas antes de enviar
    if (_adData['titulo'] == null || _adData['titulo'].toString().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Por favor ingresa un título'), backgroundColor: Colors.red));
      return;
    }
    if (_selectedImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sube al menos 1 foto'), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isPublishing = true); // Mostrar cargando

    // Llamamos al servicio que acabamos de crear
    final success = await _publishService.publishAd(
      adData: _adData,
      images: _selectedImages,
      selectedPlan: _selectedPlan,
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
        const SnackBar(content: Text('Error al publicar. Intenta de nuevo.'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Publicar Anuncio', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(icon: const Icon(Icons.close, color: Colors.black), onPressed: () => Navigator.pop(context)),
      ),
      // SI ESTÁ PUBLICANDO, MOSTRAMOS UN CARGANDO GIGANTE, SI NO, EL STEPPER
      body: _isPublishing 
        ? const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(color: AppColors.primary),
                SizedBox(height: 20),
                Text('Subiendo fotos y publicando anuncio...', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
              ],
            ),
          )
        : Stepper(
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
                          backgroundColor: isLastStep ? Colors.green : AppColors.primary,
                          minimumSize: const Size(0, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: details.onStepContinue,
                        child: Text(isLastStep ? 'PUBLICAR AHORA' : 'CONTINUAR', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    if (_currentStep > 0) ...[
                      const SizedBox(width: 15),
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(minimumSize: const Size(0, 50)),
                          onPressed: details.onStepCancel,
                          child: const Text('VOLVER', style: TextStyle(color: Colors.grey)),
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
                title: const Text('Plan', style: TextStyle(fontSize: 12)),
                content: PlanSelectionStep(
                  selectedPlan: _selectedPlan,
                  onPlanSelected: (plan) => setState(() => _selectedPlan = plan),
                ),
                isActive: _currentStep >= 0,
                state: _currentStep > 0 ? StepState.complete : StepState.indexed,
              ),
              Step(
                title: const Text('Detalles', style: TextStyle(fontSize: 12)),
                content: DetailsFormStep(
                  formData: _adData,
                  onDataChanged: () {},
                ), 
                isActive: _currentStep >= 1,
                state: _currentStep > 1 ? StepState.complete : StepState.indexed,
              ),
              Step(
                title: const Text('Fotos', style: TextStyle(fontSize: 12)),
                content: PhotoUploadStep(
                  images: _selectedImages,
                  onImagesChanged: () => setState(() {}),
                ),
                isActive: _currentStep >= 2,
              ),
            ],
          ),
    );
  }
}
