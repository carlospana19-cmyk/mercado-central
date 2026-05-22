import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_colors.dart';
import 'edit_ad_page.dart'; // 🚨 ¡ASEGÚRATE DE TENER ESTA LÍNEA!

class MyAdsPage extends StatefulWidget {
  const MyAdsPage({super.key});

  @override
  State<MyAdsPage> createState() => _MyAdsPageState();
}

class _MyAdsPageState extends State<MyAdsPage> {
  final _supabase = Supabase.instance.client;
  late Future<List<Map<String, dynamic>>> _myAdsFuture;

  @override
  void initState() {
    super.initState();
    // Iniciamos la carga de anuncios al abrir la pantalla
    _myAdsFuture = _fetchMyAds();
  }

  // 🔄 Función maestra para recargar la pantalla
  void _refreshList() {
    setState(() {
      _myAdsFuture = _fetchMyAds();
    });
  }

  Future<List<Map<String, dynamic>>> _fetchMyAds() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception("No hay sesión iniciada");

      final response = await _supabase
          .from('anuncios')
          .select('*, imagenes(url_imagen)')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint("Error cargando Mis Anuncios: $e");
      return [];
    }
  }

  Future<void> _deleteAd(dynamic id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('¿Eliminar anuncio?'),
        content: const Text('Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCELAR'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'ELIMINAR',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      // Usamos el ID dinámico directo
      await _supabase.from('anuncios').delete().eq('id', id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Anuncio eliminado con éxito 🗑️')),
        );
        _refreshList(); // Recargamos visualmente
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al eliminar: $e'),
            backgroundColor: Colors.red,
          ),
        );
    }
  }

  // 🔵 LÓGICA SINCRONIZADA CON TU WEB
  Future<void> _markAsSold(dynamic id, bool currentlySold) async {
    try {
      final newSoldStatus =
          !currentlySold; // Invertimos: de vendido a no vendido y viceversa

      // 🚨 AQUÍ ESTÁ LA MAGIA: USAMOS 'is_sold' IGUAL QUE EN VERCEL
      await _supabase
          .from('anuncios')
          .update({'is_sold': newSoldStatus})
          .eq('id', id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newSoldStatus
                  ? 'Marcado como vendido 🔴'
                  : 'Anuncio reactivado 🟢',
            ),
            backgroundColor: newSoldStatus ? Colors.orange : Colors.green,
          ),
        );
        _refreshList();
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Mis Anuncios',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _myAdsFuture, // Usamos la variable controlada
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }

          final ads = snapshot.data ?? [];

          if (ads.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.inventory_2_outlined,
                    size: 80,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 15),
                  const Text(
                    'Aún no tienes anuncios publicados',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(15),
            itemCount: ads.length,
            separatorBuilder: (context, index) =>
                const Divider(height: 30, color: Color(0xFFF0F0F0)),
            itemBuilder: (context, index) {
              final ad = ads[index];
              final bool isSold = ad['is_sold'] == true;

              String? imageUrl;
              if (ad['url_portada'] != null &&
                  ad['url_portada'].toString().isNotEmpty) {
                imageUrl = ad['url_portada'].toString();
              } else if (ad['imagenes'] != null &&
                  (ad['imagenes'] as List).isNotEmpty) {
                imageUrl = ad['imagenes'][0]['url_imagen'].toString();
              }

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: imageUrl != null
                          ? Image.network(
                              imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (c, e, s) => const Icon(
                                Icons.broken_image,
                                color: Colors.grey,
                              ),
                            )
                          : const Icon(Icons.camera_alt, color: Colors.grey),
                    ),
                  ),
                  const SizedBox(width: 15),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          ad['titulo'] ?? 'Sin título',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          '\$${ad['precio']}',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 5),

                        // 🚨 LA ETIQUETA VISUAL
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: (isSold ? Colors.grey : Colors.green)
                                .withOpacity(0.1),
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(
                            isSold ? 'VENDIDO' : 'ACTIVO',
                            style: TextStyle(
                              color: isSold ? Colors.grey : Colors.green,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  PopupMenuButton<String>(
                    onSelected: (value) async {
                      if (value == 'delete') {
                        _deleteAd(ad['id']); // Pasamos el ID directamente
                      } else if (value == 'sold') {
                        _markAsSold(
                          ad['id'],
                          isSold,
                        ); // Pasamos 'isSold', NO isActive
                      } else if (value == 'edit') {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => EditAdPage(ad: ad),
                          ),
                        );
                        // Si el usuario guardó los cambios, recargamos la lista
                        if (result == true) {
                          _refreshList();
                        }
                      }
                    },
                    itemBuilder: (context) {
                      return [
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit, size: 20, color: Colors.grey),
                              SizedBox(width: 10),
                              Text('Editar'),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'sold',
                          child: Row(
                            children: [
                              Icon(
                                Icons.sell,
                                size: 20,
                                color: isSold ? Colors.green : Colors.orange,
                              ),
                              SizedBox(width: 10),
                              Text(isSold ? 'Reactivar' : 'Marcar Vendido'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete, size: 20, color: Colors.red),
                              SizedBox(width: 10),
                              Text(
                                'Eliminar',
                                style: TextStyle(color: Colors.red),
                              ),
                            ],
                          ),
                        ),
                      ];
                    },
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}
