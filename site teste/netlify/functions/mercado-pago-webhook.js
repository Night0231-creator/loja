/**
 * Netlify Function: mercado-pago-webhook
 * 
 * Webhook do Mercado Pago para notificar compras
 * SEGURO: Apenas envia notificação ao Discord quando pagamento é APROVADO
 *
 * POST /.netlify/functions/mercado-pago-webhook
 */

const { notifyPurchaseOnDiscord } = require("./services/discordService");
const fs = require("fs");
const path = require("path");

/**
 * Parser seguro para .env
 */
function parseEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    const out = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
      out[key] = val;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Obtém webhook URL
 */
function getDiscordWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL) {
    return process.env.DISCORD_WEBHOOK_URL;
  }

  try {
    const envFile = path.join(__dirname, "../.env");
    const envData = parseEnvFile(envFile);
    if (envData.DISCORD_WEBHOOK_URL) {
      return envData.DISCORD_WEBHOOK_URL;
    }
  } catch {}

  return null;
}

/**
 * Resposta JSON
 */
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

/**
 * Dados dos produtos
 */
const PRODUCTS = {
  40: { gtaLabel: "40M GTA$", basePrice: 7.9 },
  100: { gtaLabel: "100M GTA$", basePrice: 17.9 },
  200: { gtaLabel: "200M GTA$", basePrice: 29.9 },
  400: { gtaLabel: "400M GTA$", basePrice: 54.9 },
  600: { gtaLabel: "600M GTA$", basePrice: 79.9 },
};

const EXTRA_PRICES = {
  fast: 5.0,
  priority: 10.0,
  bonus: 4.0,
};

/**
 * Remove prefixo de JSON inválido
 */
function sanitizeJson(obj) {
  if (typeof obj !== "object" || obj === null) return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

/**
 * Extrai dados do external_reference (formato: optionId:extras1,extras2)
 * Exemplo: "200:priority,bonus"
 */
function parseExternalReference(ref) {
  if (!ref || typeof ref !== "string") {
    return { optionId: null, extras: [] };
  }

  const parts = ref.split(":");
  const optionId = parts[0];
  const extras = parts[1] ? parts[1].split(",").filter(Boolean) : [];

  return { optionId: parseInt(optionId, 10), extras };
}

/**
 * Formata extras em texto legível
 */
function formatExtrasText(extras) {
  if (!extras || extras.length === 0) return "Nenhum";

  const extrasMap = {
    fast: "⚡ Entrega Rápida",
    priority: "🎯 Prioridade",
    bonus: "🎁 Bônus",
  };

  return extras.map((e) => extrasMap[e] || e).join(", ");
}

/**
 * Calcula prazo de entrega
 */
function computeEta(extras) {
  const hasExtraFast = extras && extras.includes("fast");
  const hasExtraPriority = extras && extras.includes("priority");

  if (hasExtraFast) return "24h a 48h";
  if (hasExtraPriority) return "48h a 72h";
  return "4 a 5 dias úteis";
}

/**
 * Handler principal
 */
exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, { success: true });
  }

  // Apenas POST
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Método não permitido" });
  }

  try {
    // Recebe notificação do Mercado Pago
    const body = JSON.parse(event.body || "{}");
    const cleanBody = sanitizeJson(body);

    console.log("📨 Webhook Mercado Pago recebido:", cleanBody);

    // Topic pode ser "payment", "merchant_order", etc
    if (cleanBody.type !== "payment") {
      return jsonResponse(200, {
        success: true,
        message: "Não é notificação de pagamento, ignorado",
      });
    }

    const paymentId = cleanBody.data?.id;
    if (!paymentId) {
      return jsonResponse(400, {
        error: "ID de pagamento não encontrado",
      });
    }

    // Busca detalhes do pagamento na API do Mercado Pago
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return jsonResponse(500, {
        error: "Token MP não configurado",
      });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
      },
    });

    if (!mpRes.ok) {
      return jsonResponse(500, {
        error: "Falha ao buscar pagamento no MP",
        status: mpRes.status,
      });
    }

    const paymentData = await mpRes.json();

    // SEGURANÇA: Apenas notifica se pagamento foi APROVADO
    const status = paymentData.status;
    if (status !== "approved") {
      console.log(`ℹ️ Pagamento ${paymentId} com status "${status}", notificação ignorada`);
      return jsonResponse(200, {
        success: true,
        message: `Pagamento com status "${status}", não enviado (aguardando aprovação)`,
      });
    }

    // Extrai dados do external_reference
    const externalRef = paymentData.external_reference;
    const { optionId, extras } = parseExternalReference(externalRef);

    if (!optionId || !PRODUCTS[optionId]) {
      return jsonResponse(400, {
        error: "optionId inválido no external_reference",
        received: optionId,
      });
    }

    // Monta dados do pedido
    const product = PRODUCTS[optionId];
    const extrasPrice = extras.reduce(
      (sum, extra) => sum + (EXTRA_PRICES[extra] || 0),
      0
    );
    const totalPrice = Math.round((product.basePrice + extrasPrice) * 100) / 100;
    const eta = computeEta(extras);
    const extrasFormatted = formatExtrasText(extras);

    const orderData = {
      package: product.gtaLabel,
      price: totalPrice,
      extras: extrasFormatted,
      eta,
      orderId: `#${paymentId}`, // Usa ID do pagamento como referência
    };

    // Obtém webhook URL do Discord
    const discordWebhookUrl = getDiscordWebhookUrl();
    if (!discordWebhookUrl) {
      return jsonResponse(500, {
        error: "Discord webhook não configurado",
      });
    }

    // Envia notificação ao Discord
    const result = await notifyPurchaseOnDiscord(discordWebhookUrl, orderData);

    return jsonResponse(200, {
      success: true,
      message: "✅ Pagamento aprovado! Notificação enviada ao Discord",
      paymentId,
      orderData,
    });
  } catch (error) {
    console.error("❌ Erro no webhook Mercado Pago:", error);
    return jsonResponse(500, {
      error: "Erro ao processar webhook",
      message: error.message,
    });
  }
};
