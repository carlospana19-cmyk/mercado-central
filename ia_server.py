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
CORS(app)

@app.route('/optimizar', methods=['POST'])
def optimizar():
    try:
        data = request.json
        titulo = data.get('titulo', '')
        descripcion = data.get('descripcion', '')
        
        mensajes = [
            {
                "role": "system", 
                "content": "Actúa como un experto en marketing de ventas. Tu respuesta debe ser una descripción detallada, atractiva, profesional y persuasiva de al menos 150 a 200 palabras, estructurada en párrafos cortos. No uses emojis. Responde en formato JSON con dos campos: 'titulo' y 'descripcion'."
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
            
            return jsonify({
                "titulo": titulo_limpio.strip(),
                "descripcion": desc_limpia.strip()
            })
            
        except Exception as e:
            return jsonify({"error": "Error al procesar"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
