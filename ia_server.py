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
CORS(app, origins=[
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'https://mercado-central-9yqf.onrender.com',
    'https://mercadoscentral.com',
    'https://www.mercadoscentral.com'
])

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "ok": True,
        "modelo": "gpt-4o-mini",
        "key_set": bool(os.getenv("OPENAI_API_KEY"))
    })

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

# DEFENSA PARSEO: recupera el JSON aunque venga envuelto en fences ```json ``` o en texto
def extraer_json(texto):
    m = re.search(r'\{.*\}', texto, re.DOTALL)
    return json.loads(m.group(0) if m else texto)

# DEFENSA LIMPIEZA: filtra etiquetas tipo "json:", "titulo:", "descripcion:" al inicio
def limpiar(texto):
    if not texto: return ""
    t = str(texto)
    t = re.sub(r'(?i)^\s*(json\b|titulo|título|descripcion|descripción)\s*[:\-]?\s*', '', t)
    return re.sub(r'[^a-zA-Z0-9\s.,!?;:\-áéíóúñÁÉÍÓÚÑ]', '', t).strip()

@app.route('/optimizar', methods=['POST'])
def optimizar():
    try:  # Capa 1: Seguridad Total
        datos_entrada = request.json
        titulo = datos_entrada.get('titulo', '')
        descripcion = datos_entrada.get('descripcion', '')
        plan = datos_entrada.get('plan', 'free')
        
        system_prompt = PROMPTS.get(plan, PROMPTS['free'])
        
        # NUEVO MENSAJE CLARO - SIN 'SOLO TEXTO PLANO'
        user_prompt = f"Optimiza estos campos por separado. Título original: {titulo}. Descripción original: {descripcion}. Devuelve un JSON con las llaves 'titulo' (máx 60 chars) y 'descripcion' (máx 900 chars). Responde ÚNICAMENTE con el objeto JSON, sin texto antes ni después, sin markdown y sin bloques de código."
        
        mensajes = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=mensajes,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        respuesta_ia_cruda = response.choices[0].message.content
        
        try:  # Capa 2: Parse JSON
            resultado = extraer_json(respuesta_ia_cruda)

            titulo_final = limpiar(resultado.get('titulo', ''))[:60]
            desc_final = limpiar(resultado.get('descripcion', ''))[:900]

            return jsonify({
                "titulo": titulo_final.strip(),
                "descripcion": desc_final.strip(),
                "usados": 1,
                "limite": LIMITS.get(plan, 0)
            })

        except Exception:
            # DEFENSA FALLBACK: nunca volcar prosa cruda al formulario
            m_t = re.search(r'(?i)titulo\s*[:\-]\s*(.+?)(?=\s*descripcion|descripción\s*[:\-]|$)', respuesta_ia_cruda, re.DOTALL)
            m_d = re.search(r'(?i)(?:descripcion|descripción)\s*[:\-]\s*(.+)$', respuesta_ia_cruda, re.DOTALL)
            if m_t and m_d:
                return jsonify({
                    "titulo": limpiar(m_t.group(1))[:60],
                    "descripcion": limpiar(m_d.group(1))[:900],
                    "usados": 1,
                    "limite": LIMITS.get(plan, 0)
                })
            return jsonify({"error": "IA no pudo formatear la respuesta, intenta de nuevo"}), 502
            
    except Exception as e:
        print(f"ERROR FATAL: {str(e)}")
        return jsonify({"error": "Error servidor"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)

