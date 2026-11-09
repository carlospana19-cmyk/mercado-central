// ============================================================
//  MercadosCentral · Edge Function "busqueda-visual"
// ------------------------------------------------------------
//  Recibe una foto (data URL), la analiza con OpenAI gpt-4o-mini
//  y devuelve el texto de búsqueda + categoría para el buscador.
//
//  Requisitos:
//  1) Secret OPENAI_API_KEY cargado en Supabase (Paso 2 del LEEME).
//  2) Desplegar con nombre exacto: busqueda-visual
// ============================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

const MAX_CHARS_IMAGEN = 5 * 1024 * 1024; // ~5 MB de data URL (el cliente ya comprime a 1024px)

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido." }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json(
      { ok: false, error: "Falta el secret OPENAI_API_KEY en Supabase (Paso 2 del LEEME)." },
      500,
    );
  }

  try {
    const { imagen, categorias } = await req.json();

    if (!imagen || typeof imagen !== "string" || !imagen.startsWith("data:image/")) {
      return json(
        { ok: false, error: "Envía 'imagen' como data URL (data:image/...)." },
        400,
      );
    }
    if (imagen.length > MAX_CHARS_IMAGEN) {
      return json({ ok: false, error: "La imagen es muy grande (máx 5 MB)." }, 413);
    }

    // Lista de categorías: el cliente envía las reales del <select>.
    // Esta lista de respaldo replica las categorías visibles del inicio.
    const respaldo = "Bienes Raíces | Vehículos | Electrónica | Hogar | Moda | Servicios";
    const listaCats =
      Array.isArray(categorias) && categorias.length > 0
        ? categorias.map((c: unknown) => String(c).trim()).filter(Boolean).join(" | ")
        : respaldo;

    const prompt = [
      "Mira la foto: una persona la sube a un marketplace de Panamá porque quiere encontrar un producto o servicio como el que aparece.",
      `Categorías válidas del sitio: ${listaCats}.`,
      "Responde SOLO con un objeto JSON válido, sin texto adicional, con esta forma exacta:",
      '{"texto_busqueda": "<2 a 6 palabras concretas para un buscador>", "categoria": "<una categoría de la lista, escrita EXACTAMENTE igual>"}',
      'Ejemplo: {"texto_busqueda": "iPhone 13 128gb", "categoria": "Electrónica"}',
    ].join("\n");

    const oa = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // El mismo modelo barato que ya usan las descripciones; lee fotos.
        // Si algún día quieres más precisión, cámbialo por "gpt-4o" aquí.
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 120,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Eres el asistente de búsqueda visual de MercadosCentral, un marketplace de Panamá. " +
              "Respondes siempre con JSON válido, breve y en español.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              // detail "low" = costo mínimo por foto (modo económico).
              { type: "image_url", image_url: { url: imagen, detail: "low" } },
            ],
          },
        ],
      }),
    });

    if (!oa.ok) {
      const detalle = await oa.text();
      if (oa.status === 429 && detalle.includes("insufficient_quota")) {
        return json(
          {
            ok: false,
            error:
              "La cuenta de OpenAI se quedó sin saldo. Recarga créditos en platform.openai.com → Billing.",
          },
          502,
        );
      }
      console.error("OpenAI error:", oa.status, detalle.slice(0, 500));
      return json({ ok: false, error: `OpenAI respondió con error ${oa.status}.` }, 502);
    }

    const data = await oa.json();
    const contenido: string = data?.choices?.[0]?.message?.content ?? "";

    // Limpieza defensiva por si el modelo envía ```json ... ```
    const limpio = contenido.replace(/```json|```/g, "").trim();

    let parsed: { texto_busqueda?: string; categoria?: string };
    try {
      parsed = JSON.parse(limpio);
    } catch {
      return json(
        { ok: false, error: "La IA no devolvió un formato válido. Inténtalo de nuevo." },
        502,
      );
    }

    const textoBusqueda = String(parsed.texto_busqueda ?? "").slice(0, 80).trim();
    const categoria = String(parsed.categoria ?? "").trim();

    if (!textoBusqueda) {
      return json(
        { ok: false, error: "No pude identificar qué se busca en la foto. Prueba con otra imagen." },
        422,
      );
    }

    return json({ ok: true, texto_busqueda: textoBusqueda, categoria });
  } catch (_e) {
    return json({ ok: false, error: "Error interno procesando la solicitud." }, 500);
  }
});
