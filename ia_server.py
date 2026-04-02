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

# Límites por plan
LIMITS = {
    'free': 0,
    'basico': 1,
    'premium': 3,
    'destacado': 5
}

# Prompts con REGLAS DE ACERO
PROMPTS = {
    'destacado': """REGLA OBLIGATORIA: El "titulo" NO puede pasar de 60 caracteres. Si te pasas, el anuncio fallará. REGLA OBLIGATORIA: NO incluyas "Título:" o "Descripción:" dentro de los valores del JSON. Solo contenido directo. Genera TÍTULO impactante (máx 60 chars, palabras poder: Increíble, Oportunidad, Único). Descripción max 900 chars. No elimines detalles. JSON {\"titulo\": \"CONTENIDO\", \"descripcion\": \"CONTENIDO\"}. NO emojis.""",
    
    'premium': """REGLA OBLIGATORIA: "titulo" máximo 60 chars o fallará. NO pongas "Título:" o "Descripción:" en los valores JSON. Solo texto limpio. Título llamativo (Oferta, Nuevo, Excelente). Descripción persuasiva max 900 chars. JSON {\"titulo\": \"TEXTO\", \"descripcion\": \"TEXTO\"}. No emojis.""",
    
    'basico': """REGLA OBLIGATORIA: título máximo 60 chars. NO incluir "Título:" "Descripción:" en valores. Título corto y claro. Descripción max 900 chars. JSON {\"titulo\": \"...\", \"descripcion\": \"...\"}. No emojis.""",
    
    'free': "{\"titulo\": \"\", \"descripcion\": \"\"}"
}

@app.route('/optimizar', methods=['POST'])
def optimizar():
    try:  # Capa 1: Seguridad Total
        datos_entrada = request.json
        titulo = datos_entrada.get('titulo', '')
        descripcion = datos_entrada.get('descripcion', '')
        plan = datos_entrada.get('plan', 'free')
        
        system_prompt = PROMPTS.get(plan, PROMPTS['free'])
        
        # NUEVO MENSAJE CLARO - SIN 'SOLO TEXTO PLANO'
        user_prompt = f"Optimiza estos campos por separado. Título original: {titulo}. Descripción original: {descripcion}. Devuelve un JSON con las llaves 'titulo' (máx 60 chars) y 'descripcion' (máx 900 chars)."
        
        mensajes = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=mensajes,
            temperature=0.1
        )
        
        respuesta_ia_cruda = response.choices[0].message.content
        
        try:  # Capa 2: Parse JSON
            resultado = json.loads(respuesta_ia_cruda)
            
            def limpiar(texto):
                if not texto: return ""
                # Filtro completo tildes + Ñ mayúsc/minúsc
                return re.sub(r'[^a-zA-Z0-9\s.,!?;:\-áéíóúñÁÉÍÓÚÑ]', '', str(texto))
            
            titulo_final = limpiar(resultado.get('titulo', ''))[:60]
            desc_final = limpiar(resultado.get('descripcion', ''))[:900]
            
            return jsonify({
                "titulo": titulo_final.strip(),
                "descripcion": desc_final.strip(),
                "usados": 1,
                "limite": LIMITS.get(plan, 0)
            })
            
        except:
            # Fallback limpio
            clean_raw = re.sub(r'[^a-zA-Z0-9\s.,!?;:\-áéíóúñÁÉÍÓÚÑ]', '', respuesta_ia_cruda)
            return jsonify({
                "titulo": clean_raw[:60].strip(),
                "descripcion": clean_raw[60:960].strip()
            })
            
    except Exception as e:
        print(f"❌ ERROR FATAL: {str(e)}")
        return jsonify({"error": "Error servidor"}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)

