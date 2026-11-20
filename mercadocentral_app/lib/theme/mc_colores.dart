import 'package:flutter/material.dart';

/// Paleta única de Mercados Central (guía maestra §2.1).
/// Regla 90/10: superficies y neutros en grises/blanco; naranja solo en
/// acciones y marca. PROHIBIDO reintroducir verde-azulado (turquesa/cian).
class Mc {
  // Acción / marca
  static const naranja = Color(0xFFFF8A3D); // #FF8A3D
  static const naranjaOscuro = Color(0xFFF2731F); // hover / presionado

  // Texto
  static const texto = Color(0xFF111827); // principal (títulos)
  static const textoListas = Color(0xFF1F2937); // único tono en listas y tarjetas

  // Grises neutros
  static const grisSuave = Color(0xFF6B7280); // secundario
  static const grisBorde = Color(0xFFD1D5DB); // bordes
  static const fondo = Color(0xFFF9FAFB); // fondo de superficies

  // Semánticos (uso restringido)
  static const whatsapp = Color(0xFF25D366); // SOLO botón WhatsApp
  static const exito = Color(0xFF16A34A); // éxito
  static const peligro = Color(0xFFDC2626); // peligro / error

  // Coronas por plan
  static const dorado = Color(0xFFD4AF37);
}
