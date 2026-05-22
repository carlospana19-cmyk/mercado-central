import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'login_page.dart';
import 'home_page.dart';
import 'upload_page.dart'; // UploadPage para publicar

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://ldtomnicwnwituyensmn.supabase.co',
    anonKey: 'sb_publishable_IhsU4XOQCR8R83oZEXhVAA_W_8v6Fik',
  );

  runApp(const MercadoCentralApp());
}

class MercadoCentralApp extends StatelessWidget {
  const MercadoCentralApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Mercado Central',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF00c2cb)),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginPage(),
        '/home': (context) => const HomePage(),
        '/upload': (context) => const UploadPage(),
      },
    );
  }
}
