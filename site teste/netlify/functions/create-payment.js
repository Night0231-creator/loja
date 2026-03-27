/**
 * THEMAF1A STORE - Create Payment Function
 * Cria preferência de pagamento no Mercado Pago
 * URL: /.netlify/functions/create-payment
 */

const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
      env[key] = val;
    }
    return env;
  } catch (err) {
    return {};
  }
}

const getMpAccessToken = () => {
  if (process.env.MP_ACCESS_TOKEN) return process.env.MP_ACCESS_TOKEN;

  const credFile = path.join(__dirname, "mercado-pago-credentials.env");
  if (fs.existsSync(credFile)) {
    const env = parseEnvFile(credFile);
    return env.MP_ACCESS_TOKEN || "";
  }
  return "";
};

const PRODUCTS = {
  40: { gtaLabel: "40M GTA$", basePrice: 7.9, tier: 0 },
  100: { gtaLabel: "100M GTA$", basePrice: 17.9, tier: 1 },
  200: { gtaLabel: "200M GTA$", basePrice: 29.9, tier: 2 },
  400: { gtaLabel: "400M GTA$", basePrice: 54.9, tier: 3 },
  600: { gtaLabel: "600M GTA$", basePrice: 79.9, tier: 4 },
};

const EXTRAS_COST = {
  fast: 5.0,
  priority: 10.0,
  bonus: 4.0,
};

exports.handler = async (event) => {
  console.log("[CREATE-PAYMENT] Iniciando...", { body: event.body });

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" }),
    };
  }

  try {
    const { title, description, price, quantity = 1, optionId } = JSON.parse(event.body || "{}");

    // Validar campos obrigatórios
    if (!title || price === undefined || price <= 0) {
      throw new Error("Dados de pagamento inválidos");
    }

    const MP_TOKEN = getMpAccessToken();
    if (!MP_TOKEN) {
      throw new Error("Token Mercado Pago não configurado");
    }

    // Criar preference no Mercado Pago
    const preferenceData = {
      items: [
        {
          title: title,
          description: description || "Serviço THEMAF1A",
          quantity: quantity,
          unit_price: price,
          picture_url: "https://via.placeholder.com/300x300?text=THEMAF1A",
        },
      ],
      payer: {
        email: "customer@example.com",
      },
      back_urls: {
        success: `${process.env.SITE_URL || "http://localhost:8888"}/pages/success.html?status=approved`,
        failure: `${process.env.SITE_URL || "http://localhost:8888"}/?payment=failed`,
        pending: `${process.env.SITE_URL || "http://localhost:8888"}/?payment=pending`,
      },
      statement_descriptor: "THEMAF1A",
      external_reference: `ORDER_${Date.now()}_${optionId || ""}`,
      notification_url: `${process.env.SITE_URL || "http://localhost:8888"}/.netlify/functions/mercado-pago-webhook`,
      auto_return: "approved",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error("[CREATE-PAYMENT] Mercado Pago error:", errorData);
      throw new Error(`Mercado Pago error: ${mpResponse.statusText}`);
    }

    const preference = await mpResponse.json();

    console.log("[CREATE-PAYMENT] ✅ Preferência criada:", preference.id);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferenceId: preference.id,
        checkoutUrl: preference.init_point,
      }),
    };
  } catch (error) {
    console.error("[CREATE-PAYMENT] ❌ Erro:", error.message);

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error.message || "Erro ao processar pagamento",
      }),
    };
  }
};
