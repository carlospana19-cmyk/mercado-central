import 'package:flutter/material.dart';
import '../../../core/utils/location_helper.dart';

class LocationPicker extends StatefulWidget {
  final Function(String province, String district) onSelected;
  const LocationPicker({super.key, required this.onSelected});

  @override
  State<LocationPicker> createState() => _LocationPickerState();
}

class _LocationPickerState extends State<LocationPicker> {
  String? _selectedProvince;
  String? _selectedDistrict;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(labelText: 'Provincia'),
          value: _selectedProvince,
          items: LocationHelper.getProvinces()
              .map((p) => DropdownMenuItem(value: p, child: Text(p)))
              .toList(),
          onChanged: (val) {
            setState(() {
              _selectedProvince = val;
              _selectedDistrict = null; // Reset district
            });
          },
        ),
        const SizedBox(height: 15),
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(labelText: 'Distrito'),
          value: _selectedDistrict,
          disabledHint: const Text('Selecciona una provincia primero'),
          items: _selectedProvince == null
              ? null
              : LocationHelper.getDistricts(_selectedProvince!)
                    .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                    .toList(),
          onChanged: (val) {
            setState(() => _selectedDistrict = val);
            if (_selectedProvince != null && val != null) {
              widget.onSelected(_selectedProvince!, val);
            }
          },
        ),
      ],
    );
  }
}
