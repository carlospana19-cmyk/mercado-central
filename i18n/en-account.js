mcI18nAdd("en", {
/* ===== Login / registro / recuperar contraseña ===== */
"Login - Mercados Central": "Login - Mercados Central", "Iniciar Sesión": "Log In", "Entrar": "Sign in",
"Iniciar sesión con Google": "Sign in with Google", "¿No tienes cuenta?": "Don't have an account?",
"Regístrate": "Sign up", "¿Olvidaste tu contraseña?": "Forgot your password?", "Contraseña": "Password",
"Correo electrónico": "Email", "Email": "Email", "Google logo": "Google logo", "o": "or",
"Registro - Mercados Central": "Sign up - Mercados Central", "Crear una Cuenta": "Create an Account",
"Nombre de tu negocio": "Your business name", "Mínimo 8 caracteres": "Minimum 8 characters", "Registrarse": "Sign up",
"¿Ya tienes una cuenta?": "Already have an account?", "Inicia sesión aquí": "Log in here",
"Recuperar Contraseña - Mercados Central": "Recover Password - Mercados Central", "Recuperar Contraseña": "Recover Password",
"Ingresa tu correo electrónico y te enviaremos un enlace para resetear tu contraseña.": "Enter your email and we'll send you a link to reset your password.",
"Enviar Enlace de Recuperación": "Send Recovery Link", "Volver al login": "Back to login",
"Resetear Contraseña - Mercados Central": "Reset Password - Mercados Central", "Crear Nueva Contraseña": "Create New Password",
"Ingresa tu nueva contraseña.": "Enter your new password.", "Cambiar Contraseña": "Change Password",
"Nueva contraseña": "New password", "Confirmar contraseña": "Confirm password",
"Por favor ingresa email y contraseña": "Please enter your email and password", "Desconocido": "Unknown",
"La contraseña debe tener al menos 8 caracteres": "The password must be at least 8 characters long",
"Ese correo ya tiene cuenta — inicia sesión": "That email already has an account — log in",
"¡Registro exitoso! Redirigiendo al panel...": "Registration successful! Redirecting to the dashboard...",
"Te enviamos un código de verificación a tu correo": "We sent a verification code to your email",
"Código de verificación": "Verification code", "Verificar": "Verify", "Reenviar código": "Resend code",
"Ingresa el código de verificación.": "Enter the verification code.", "Verificando código...": "Verifying code...",
"Código incorrecto o vencido": "Incorrect or expired code", "¡Correo verificado! Continuando...": "Email verified! Continuing...",
"No se pudo reenviar el código. Intenta de nuevo en un momento.": "The code could not be resent. Please try again in a moment.",
"Código reenviado. Revisa tu correo.": "Code resent. Check your email.",
"Por favor ingresa tu correo electrónico": "Please enter your email",
"Si la cuenta existe, recibirás un enlace de recuperación en tu correo.\n\nRevisa tu bandeja de entrada y carpeta de spam.": "If the account exists, you will receive a recovery link in your email.\n\nCheck your inbox and spam folder.",
"Por favor ingresa y confirma tu nueva contraseña": "Please enter and confirm your new password",
"Las contraseñas no coinciden": "Passwords do not match",
"¡Contraseña cambiada exitosamente! Por favor inicia sesión nuevamente.": "Password changed successfully! Please log in again.",
"Error al iniciar sesión con Google:": "Error signing in with Google:",
"Procesamiento de Pago - MercadoCentral": "Payment Processing - MercadoCentral"
});
mcI18nPattern("en", /^Página (\d+)$/, function (m) { return "Page " + m[1]; });
mcI18nPattern("en", /^Error: (.+)$/, function (m, t) { var r = t(m[1]); return r ? "Error: " + r : null; });

mcI18nAdd("en", {
/* ===== Panel de usuario ===== */
"Mi Panel - Mercados Central": "My Dashboard - Mercados Central", "Cambiar foto de perfil": "Change profile photo",
"Foto de Perfil": "Profile Photo", "Activos": "Active", "Vendidos": "Sold", "Mis Anuncios": "My Ads",
"Paginación de mis anuncios": "My ads pagination", "Cargando tus anuncios...": "Loading your ads...",
"Mi Perfil": "My Profile", "Editar Mi Perfil": "Edit My Profile", "Información Personal": "Personal Information",
"Nombre Completo": "Full Name", "Tu nombre completo": "Your full name", "Tu email": "Your email",
"No se puede cambiar desde aquí": "Cannot be changed here", "Teléfono": "Phone", "WhatsApp": "WhatsApp",
"Ej: +507 1234-5678": "E.g. +507 1234-5678", "Información de Negocio": "Business Information",
"Nombre del Negocio / Marca": "Business / Brand Name", "Ej: Mi Tienda Online": "E.g. My Online Store",
"Persona Natural": "Individual", "Tienda": "Store", "Empresa": "Company",
"Descripción / Bio": "Description / Bio", "Cuéntanos sobre tu negocio o marca...": "Tell us about your business or brand...",
"Ubicación": "Location", "Guardar Cambios": "Save Changes", "Mis Reseñas": "My Reviews",
"Reseñas Recibidas": "Reviews Received", "Reseñas Dadas": "Reviews Given", "Reseñas de mis compradores": "Reviews from my buyers",
"Cargando reseñas...": "Loading reviews...", "Reseñas que he dado": "Reviews I've given",
"Aquí puedes ver todas las reseñas que has dejado a otros vendedores": "Here you can see all the reviews you've left for other sellers",
"Cuenta Personal": "Personal Account", "Editar anuncio": "Edit ad", "Eliminar anuncio": "Delete ad",
"Marcar como vendido": "Mark as sold", "Reactivar anuncio": "Reactivate ad", "Reactivar": "Reactivate",
"✓ Reactivar": "✓ Reactivate", "✓ Vendido": "✓ Sold",
"Error al actualizar el estado del anuncio": "Error updating the ad status",
"¿Estás seguro de eliminar este anuncio? Esta acción no se puede deshacer.": "Are you sure you want to delete this ad? This action cannot be undone.",
"Error al eliminar el anuncio": "Error deleting the ad", "Por favor selecciona una imagen válida": "Please select a valid image",
"La imagen no debe pesar más de 5MB": "The image must not exceed 5MB",
"Error al subir la foto. Intenta de nuevo.": "Error uploading the photo. Please try again.",
"Error al procesar la foto": "Error processing the photo", "¡Perfil guardado correctamente!": "Profile saved successfully!",
"Error al guardar los cambios": "Error saving the changes", "No tienes anuncios aún.": "You don't have any ads yet.",
"¡Crea uno!": "Create one!", "Para": "To"
});

mcI18nAdd("en", {
/* ===== Pago (payment.html) ===== */
"Completa tu Compra": "Complete Your Purchase", "Selecciona tu método de pago para activar tu plan": "Select your payment method to activate your plan",
"Resumen del Plan": "Plan Summary", "Plan Seleccionado:": "Selected Plan:", "Precio Mensual:": "Monthly Price:",
"Duración:": "Duration:", "1 Mes": "1 Month", "Impuestos:": "Taxes:", "Total a Pagar:": "Total to Pay:",
"✓ Pago Seguro:": "✓ Secure Payment:", "Tus datos de pago están protegidos con cifrado SSL": "Your payment details are protected with SSL encryption",
"Información de Pago": "Payment Information", "Tarjeta": "Card", "Yappy": "Yappy", "Número de Tarjeta": "Card Number",
"Vencimiento": "Expiry", "CVV": "CVV", "Juan Pérez": "John Smith",
"El pago con Yappy se habilitará próximamente. Mientras tanto, usa el pago con tarjeta.": "Yappy payment will be available soon. In the meantime, use card payment.",
"Email de PayPal": "PayPal Email", "Serás redirigido a PayPal para completar el pago de forma segura.": "You will be redirected to PayPal to complete the payment securely.",
"Acepto los": "I accept the", "términos y condiciones": "terms and conditions", "Pagar Ahora": "Pay Now",
"Aceptamos estas tarjetas": "We accept these cards", "← Volver": "← Back", "Visa": "Visa", "MasterCard": "MasterCard",
"American Express": "American Express", "Plan Básico": "Basic Plan", "Plan Premium": "Premium Plan", "Plan Destacado": "Featured Plan",
"⚠️ Debes aceptar los términos y condiciones": "⚠️ You must accept the terms and conditions", "Procesando...": "Processing...",
"✓ Pago procesado correctamente. Redirigiendo...": "✓ Payment processed successfully. Redirecting...",
"✗ Error al procesar el pago:": "✗ Error processing the payment:",

/* ===== Perfil del vendedor ===== */
"Cargando…": "Loading…", "Aún no hay anuncios": "No ads yet",

/* ===== Provincias / ubicaciones ===== */
"Colón": "Colón", "Chiriquí": "Chiriquí", "Veraguas": "Veraguas", "Coclé": "Coclé", "Los Santos": "Los Santos",
"Herrera": "Herrera", "Darién": "Darién", "Bocas del Toro": "Bocas del Toro", "Ngäbe-Buglé": "Ngäbe-Buglé",
"Guna Yala": "Guna Yala", "Emberá": "Emberá", "Ubicación": "Location", "Lat:": "Lat:", "Lng:": "Lng:"
});
