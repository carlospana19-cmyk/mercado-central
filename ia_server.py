import os
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app, origins=['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'])

# Base de datos en memoria para registrar uso de IA
# Formato: {token_id: {'plan': plan, 'usados': cantidad}}
usage_db = {}

# Prompts por plan
PROMPTS = {
    'destacado': "Eres un experto de élite en marketing de ventas. Tu respuesta debe ser una descripción detallada, atractiva, profesional y persuasiva de AL MENOS 180 a 200 palabras, estructurada en párrafos cortos. Usa técnicas SEO avanzadas para posicionamiento en buscadores. No uses emojis. Responde en formato JSON con dos campos: 'titulo' y 'descripcion'.",
    'premium': "Eres un redactor profesional de ventas. Tu respuesta debe ser una descripción detallada, atractiva, profesional y persuasiva de al menos 150 a 180 palabras, estructurada en párrafos cortos. No uses emojis. Responde en formato JSON con dos campos: 'titulo' y 'descripcion'.",
    'basico': "Eres un asistente básico de ventas. Reescribe de forma clara y simple. No uses emojis. Responde en formato JSON con dos campos: 'titulo' y 'descripcion'.",
    'bronce': "Eres un asistente básico de ventas. Reescribe de forma clara y simple. No uses emojis. Responde en formato JSON con dos campos: 'titulo' y 'descripcion'.",
    'free': "Eres un asistente básico de ventas. Reescribe de forma clara y simple. No uses emojis. Responde en formato JSON con dos campos: 'titulo' y 'descripcion'."
}

# Límites por plan
LIMITS = {
    'free': 999,
    'basico': 999,
    'bronce': 999,
    'premium': 999,
    'destacado': 999
}

@app.route('/optimizar', methods=['POST'])
def optimizar():
    try:
        data = request.json
        titulo = data.get('titulo', '')
        descripcion = data.get('descripcion', '')
        token_id = data.get('token_id', '')
        plan = data.get('plan', 'free')
        
        # Obtener la IP del cliente como identificador alternativo
        client_ip = request.remote_addr or 'unknown'
        
        # Obtener el prompt según el plan
        system_prompt = PROMPTS.get(plan, PROMPTS['free'])
        limite = LIMITS.get(plan, 0)
        
        # Usar token_id si existe, sino usar IP del cliente
        if token_id:
            db_key = f"token_{token_id}_{plan}"
        else:
            # Sin token: usar IP + plan como identificador
            db_key = f"ip_{client_ip}_{plan}"
        
        # Inicializar si es nuevo
        if db_key not in usage_db:
            usage_db[db_key] = {'plan': plan, 'usados': 0}
        
        # Verificar si el plan cambió (nueva compra)
        if usage_db[db_key]['plan'] != plan:
            usage_db[db_key] = {'plan': plan, 'usados': 0}
        
        usados = usage_db[db_key]['usados']
        
        # DESARROLLO: SIN LÍMITES - SIEMPRE PASA
        # (Comentado para desarrollo ilimitado)
        # if limite > 0 and usados >= limite:
        #     if plan == 'destacado':
        #         mensaje = "Has agotado tu límite"
        #     else:
        #         mensaje = "Has agotado tu límite. ¡Sube a un plan superior para más!"
        #     return jsonify({
        #         "error": mensaje,
        #         "bloqueado": True,
        #         "usados": usados,
        #         "limite": limite
        #     }), 403
        
        # Resetear contador cada vez (desarrollo)
        if limite > 0:
            usage_db[db_key]['usados'] = 0
        
        mensajes = [
            {
                "role": "system", 
                "content": system_prompt
            },
            {
                "role": "user", 
                "content": f"Titulo: {titulo}. Descripcion: {descripcion}. Reescribe con palabras diferentes, mas atractivo para vender, pero SOLO TEXTO PLANO."
            }
        ]
        
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=mensajes,
            temperature=0.1 
        )
        
        respuesta_ia = response.choices[0].message.content
        
        try:
            data = json.loads(respuesta_ia)
            
            # Filtro que incluye letras acentuadas en español
            def limpiar(texto):
                if not texto: return ""
                # Solo permite: letras (incluye acentos), numeros, espacios y puntuacion basica
                return re.sub(r'[^a-zA-Z0-9\s.,!?;:\-áéíóúñ]', '', texto)
            
            titulo_limpio = limpiar(data.get('titulo', ''))
            desc_limpia = limpiar(data.get('descripcion', ''))
            
            # Siempre incrementar el contador (para token o IP)
            if limite > 0:
                if db_key in usage_db:
                    usage_db[db_key]['usados'] += 1
            
            return jsonify({
                "titulo": titulo_limpio.strip(),
                "descripcion": desc_limpia.strip(),
                "usados": usage_db.get(db_key, {}).get('usados', 0),
                "limite": limite
            })
            
        except Exception as e:
            return jsonify({"error": "Error al procesar"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)

