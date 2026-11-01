import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../core/utils/location_helper.dart';
import '../../../theme/mc_colores.dart';

typedef MapPointChanged = void Function(
  double? lat,
  double? lng,
  String? address,
);

/// Mapa para elegir la ubicación exacta del anuncio (equivale al mapa de publicar.html).
class LocationMapPicker extends StatefulWidget {
  final String? province;
  final String? district;
  final double? initialLat;
  final double? initialLng;
  final String? initialAddress;
  final MapPointChanged onChanged;

  const LocationMapPicker({
    super.key,
    required this.province,
    required this.district,
    required this.onChanged,
    this.initialLat,
    this.initialLng,
    this.initialAddress,
  });

  @override
  State<LocationMapPicker> createState() => _LocationMapPickerState();
}

class _LocationMapPickerState extends State<LocationMapPicker> {
  final _searchController = TextEditingController();
  final _geocoding = Geocoding();
  GoogleMapController? _controller;
  LatLng? _selected;
  String? _address;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialLat != null && widget.initialLng != null) {
      _selected = LatLng(widget.initialLat!, widget.initialLng!);
    }
    _address = widget.initialAddress;
  }

  @override
  void didUpdateWidget(covariant LocationMapPicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    final placeChanged = oldWidget.province != widget.province ||
        oldWidget.district != widget.district;
    if (placeChanged && _selected == null) _moveToRegion();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _controller?.dispose();
    super.dispose();
  }

  CameraPosition get _initialCamera {
    if (_selected != null) return CameraPosition(target: _selected!, zoom: 16);
    final c = LocationHelper.mapCenter(widget.province, widget.district);
    return CameraPosition(target: LatLng(c.$1, c.$2), zoom: c.$3);
  }

  void _moveToRegion() {
    final c = LocationHelper.mapCenter(widget.province, widget.district);
    _controller?.animateCamera(
      CameraUpdate.newLatLngZoom(LatLng(c.$1, c.$2), c.$3),
    );
  }

  Future<void> _select(LatLng point,
      {String? address, bool move = false}) async {
    setState(() {
      _selected = point;
      _address = address;
    });
    if (move) {
      _controller?.animateCamera(CameraUpdate.newLatLngZoom(point, 17));
    }
    widget.onChanged(point.latitude, point.longitude, address);

    if (address != null) return;
    try {
      final places = await _geocoding.placemarkFromCoordinates(
        point.latitude,
        point.longitude,
      );
      if (!mounted || _selected != point || places.isEmpty) return;
      final text = _formatPlacemark(places.first);
      if (text.isEmpty) return;
      setState(() => _address = text);
      widget.onChanged(point.latitude, point.longitude, text);
    } catch (e) {
      debugPrint('Geocodificación inversa falló: $e');
    }
  }

  String _formatPlacemark(Placemark p) => [
        p.street,
        p.subLocality,
        p.locality,
      ].where((s) => s != null && s.trim().isNotEmpty).join(', ');

  Future<void> _search() async {
    final query = _searchController.text.trim();
    if (query.length < 4) return;
    FocusScope.of(context).unfocus();
    setState(() => _busy = true);
    try {
      final full = [
        query,
        widget.district,
        widget.province,
        'Panamá',
      ].where((s) => s != null && s.trim().isNotEmpty).join(', ');
      final results = await _geocoding.locationFromAddress(full);
      if (!mounted) return;
      if (results.isEmpty) {
        _showMessage('No se encontró esa dirección.');
      } else {
        final r = results.first;
        await _select(
          LatLng(r.latitude, r.longitude),
          address: query,
          move: true,
        );
      }
    } catch (_) {
      if (mounted) _showMessage('No se encontró esa dirección.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _clear() {
    setState(() {
      _selected = null;
      _address = null;
    });
    widget.onChanged(null, null, null);
    _moveToRegion();
  }

  void _showMessage(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.map_outlined, size: 18, color: Mc.naranja),
            SizedBox(width: 8),
            Text(
              'Ubicación en el mapa',
              style: TextStyle(fontWeight: FontWeight.w700, color: Mc.texto),
            ),
          ],
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _searchController,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => _search(),
          decoration: InputDecoration(
            hintText: 'Buscar dirección o lugar',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _busy
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : IconButton(
                    icon: const Icon(Icons.arrow_forward),
                    onPressed: _search,
                  ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Mc.grisBorde),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Mc.grisBorde),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Mc.naranja, width: 1.6),
            ),
          ),
        ),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(
            height: 280,
            child: GoogleMap(
              initialCameraPosition: _initialCamera,
              onMapCreated: (c) => _controller = c,
              onTap: (p) => _select(p),
              markers: {
                if (_selected != null)
                  Marker(
                    markerId: const MarkerId('ad'),
                    position: _selected!,
                    draggable: true,
                    onDragEnd: (p) => _select(p),
                  ),
              },
              myLocationButtonEnabled: false,
              zoomControlsEnabled: true,
              mapToolbarEnabled: false,
              gestureRecognizers: {
                Factory<OneSequenceGestureRecognizer>(
                  () => EagerGestureRecognizer(),
                ),
              },
            ),
          ),
        ),
        const SizedBox(height: 8),
        if (_selected == null)
          const Text(
            'Toca el mapa o busca una dirección para marcar el punto exacto.',
            style: TextStyle(color: Colors.grey, fontSize: 12),
          )
        else
          Row(
            children: [
              const Icon(Icons.check_circle, size: 18, color: Colors.green),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _address ??
                      '${_selected!.latitude.toStringAsFixed(5)}, ${_selected!.longitude.toStringAsFixed(5)}',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
              TextButton(onPressed: _clear, child: const Text('Quitar')),
            ],
          ),
      ],
    );
  }
}
