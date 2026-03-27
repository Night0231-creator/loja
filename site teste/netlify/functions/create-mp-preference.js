const fs = require("fs");
const path = require("path");

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

function getMpAccessToken() {
  if (process.env.MP_ACCESS_TOKEN) return process.env.MP_ACCESS_TOKEN;

  // Local dev: read token from a separate credential file (not for the browser).
  const credFile = path.join(__dirname, "mercado-pago-credentials.env");
  if (fs.existsSync(credFile)) {
    const env = parseEnvFile(credFile);
    return env.MP_ACCESS_TOKEN || "";
  }
  return "";
}

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

function getOriginFromEvent(event) {
  const origin = event?.headers?.origin;
  if (origin) return origin;

  const referer = event?.headers?.referer;
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore
    }
  }
  return "https://themaf11astore.netlify.app";
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(payload),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Method not allowed" });
  }

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return jsonResponse(400, { message: "Invalid JSON body" });
  }

  const optionId = Number(body.optionId || 0);
  const extras = body.extras || {};

  const product = PRODUCTS[optionId];
  if (!product) return jsonResponse(400, { message: "Produto inválido." });

  const mpToken = getMpAccessToken();
  if (!mpToken) {
    return jsonResponse(500, {
      message: "Mercado Pago: MP_ACCESS_TOKEN não configurado no backend.",
    });
  }

  const items = [
    {
      title: `THEMAF1A STORE - ${product.gtaLabel}`,
      quantity: 1,
      unit_price: Number(product.basePrice.toFixed(2)),
    },
  ];

  if (extras.fast) {
    items.push({
      title: "Entrega mais rápida (extra)",
      quantity: 1,
      unit_price: Number(EXTRA_PRICES.fast.toFixed(2)),
    });
  }
  if (extras.priority) {
    items.push({
      title: "Prioridade no atendimento (extra)",
      quantity: 1,
      unit_price: Number(EXTRA_PRICES.priority.toFixed(2)),
    });
  }
  if (extras.bonus) {
    items.push({
      title: "Bônus (extra)",
      quantity: 1,
      unit_price: Number(EXTRA_PRICES.bonus.toFixed(2)),
    });
  }

  const orderId = `TF1A-${optionId}-${Date.now()}`;
  const origin = getOriginFromEvent(event);
  const backUrl = `${origin}/#suporte`;

  const notificationUrl = process.env.MP_NOTIFICATION_URL || "";

  const preferenceBody = {
    items,
    external_reference: orderId,
    auto_return: "approved",
    back_urls: {
      success: `${backUrl}?status=success&ref=${encodeURIComponent(orderId)}`,
      pending: `${backUrl}?status=pending&ref=${encodeURIComponent(orderId)}`,
      failure: `${backUrl}?status=failure&ref=${encodeURIComponent(orderId)}`,
    },
  };

  // Se você configurar MP_NOTIFICATION_URL, o Mercado Pago chamará esse endpoint.
  if (notificationUrl) {
    preferenceBody.notification_url = notificationUrl;
  }

  const mpUrl = "https://api.mercadopago.com/checkout/preferences";

  const res = await fetch(mpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mpToken}`,
    },
    body: JSON.stringify(preferenceBody),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return jsonResponse(res.status || 400, {
      message: data?.message || "Falha ao criar preference no Mercado Pago.",
      detail: data,
    });
  }

  return jsonResponse(200, {
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
    external_reference: data.external_reference,
  });
};

