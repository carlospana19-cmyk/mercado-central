# PLAN APROBADO: Campos Dinámicos SOLO para Vehículos en editar-anuncio-logic.js

## Información Gathered:
- **publish-logic.js**: Contiene `vehicleSubcategories` exacto:
  ```
  "Autos": ["marca", "modelo", "anio", "kilometraje", "transmision", "combustible", "color", "condicion"],
  "Motos": ["marca", "modelo", "anio", "kilometraje", "cilindraje", "tipo_moto", "color", "condicion"],
  "Camiones": ["marca", "modelo", "anio", "kilometraje", "transmision", "combustible", "capacidad_carga", "condicion"],
  "Otros Vehículos": ["marca", "modelo", "anio", "tipo_vehiculo", "condicion"]
  ```
- **editar-anuncio-logic.js**: Tiene `vehicleDetails`, `showDynamicFields()` muestra block pero campos estáticos. No tiene `vehicleFields`, `vehicleSubcategories` ni `showVehicleFields()`.
- **editar-anuncio.html**: `#vehicle-details` existe con campos estáticos (marca, modelo, etc). No `#vehicle-fields`. Usaremos `#vehicle-details` como contenedor, limpiando contenido estático.
- Otras categorías (Inmuebles, etc.) intactas.
- Patrón: funciones como `showElectronicsFields()` usan array de fields, limpian `*-fields`, añaden título `#0a2342`, generan inputs/selects.

## Plan (3 pasos exactos):
### Paso 1: Configuración (línea ~400, después de `communitySubcategories`)
```
const vehicleSubcategories = {
    "Autos": ["marca", "modelo", "anio", "kilometraje", "transmision", "combustible", "color", "condicion"],
    "Motos": ["marca", "modelo", "anio", "kilometraje", "cilindraje", "tipo_moto", "color", "condicion"],
    "Camiones": ["marca", "modelo", "anio", "kilometraje", "transmision", "combustible", "capacidad_carga", "condicion"],
    "Otros Vehículos": ["marca", "modelo", "anio", "tipo_vehiculo", "condicion"]
};
```

### Paso 2: Función `showVehicleFields()` (después de `showCommunityFields()`)
```
function showVehicleFields() {
    const fields = vehicleSubcategories[selectedSubcategory];
    if (!fields) return console.log('No fields for:', selectedSubcategory);

    const vehicleFields = document.getElementById('vehicle-fields');
    if (!vehicleFields) {
        // Crear contenedor si no existe
        const container = document.createElement('div');
        container.id = 'vehicle-fields';
        vehicleDetails.appendChild(container);
    } else {
        vehicleFields.innerHTML = '';
    }

    // Título EXACTO
    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = `<h4 style="color: #0a2342; margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
    vehicleFields.appendChild(titleDiv);

    // Generar fields como electronics
    fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group';
        let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let inputType = 'text';
        let placeholder = `Ej: ${labelText}`;

        // Selects específicos (copiados de publish pattern)
        if (field === 'transmision') {
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `<option value="">Selecciona</option><option value="Automática">Automática</option><option value="Manual">Manual</option>`;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'combustible') {
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `<option value="">Selecciona</option><option value="Gasolina">Gasolina</option><option value="Diesel">Diesel</option><option value="Híbrido">Híbrido</option><option value="Eléctrico">Eléctrico</option>`;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'condicion') {
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `<option value="">Selecciona</option><option value="Nuevo">Nuevo</option><option value="Usado - Excelente">Usado - Excelente</option><option value="Usado - Bueno">Usado - Bueno</option><option value="Usado - Regular">Usado - Regular</option>`;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'anio' || field === 'kilometraje' || field === 'cilindraje' || field === 'capacidad_carga') {
            inputType = 'number';
        } else {
            // Text input
        }

        if (field !== 'transmision' && field !== 'combustible' && field !== 'condicion') {
            const input = document.createElement('input');
            input.type = inputType;
            input.id = `attr-${field}`;
            input.name = field;
            input.placeholder = placeholder;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(input);
        }

        vehicleFields.appendChild(fieldDiv);
    });
}
```

### Paso 3: Conectar en `showDynamicFields()` (vehicle if block)
Replace:
```
if (vehicleDetails) vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
```
With:
```
if (vehicleDetails) {
    vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    if (selectedSubcategory) showVehicleFields();
}
```

## Dependent Files:
- Ninguno. Solo editar-anuncio-logic.js.

## Followup steps:
1. Editar editar-anuncio-logic.js con los 3 cambios.
2. Test: Abrir editar-anuncio.html?id=ALGUN_ID_VEHICULO, seleccionar subcategoría Auto/Moto → limpiar static, mostrar dynamic fields con título #0a2342.
3. Verificar no rompe Inmuebles/otras (colores, lógica).

✅ **PLAN APROBADO Y LISTO PARA IMPLEMENTAR**

