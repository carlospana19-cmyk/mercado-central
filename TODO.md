# TODO: Complete Editar Anuncio Map Integration - ✅ COMPLETED

## Progress
- [x] Review file contents and identify edit locations
- [x] Create detailed edit plan  
- [x] Get user confirmation on plan
- [x] Create TODO.md 
- [x] Execute edit_file on saveEditedAd() adData object (removed direccion_especifica, added latitud/longitud)
- [x] Verify no 'address' references remain
- [x] All changes applied successfully

**Final blocks requested:**

**Carga Inicial (loadAdData):**
```javascript
if (ad.latitud && ad.longitud) {
    inicializarMapaEdicion(ad.latitud, ad.longitud);
}
```

**Submit actualizado (saveEditedAd adData):**
```javascript
const adData = {
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    precio: parseInt(formData.get('precio'), 10),
    categoria: selectedMainCategory,
    provincia: formData.get('provincia'),
    distrito: formData.get('distrito'),
    latitud: document.getElementById('latitud').value,
    longitud: document.getElementById('longitud').value,
    contact_name: formData.get('contact_name'),
    contact_phone: formData.get('contact_phone'),
    contact_email: formData.get('contact_email')
};
```

Test: Open editar-anuncio.html, load an ad with existing lat/lng, interact with map, submit form. Verify lat/lng update in Supabase.


