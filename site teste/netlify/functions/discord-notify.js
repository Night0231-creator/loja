/**
 * THEMAF1A STORE - Discord Notify Function
 * Envia notificações para Discord após compra
 * URL: /.netlify/functions/discord-notify
 */

const discordService = require("./services/discordService");

exports.handler = async (event) => {
  console.log("[DISCORD-NOTIFY] Iniciando...");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" }),
    };
  }

  try {
    const {
      optionId,
      packageName,
      extras,
      total,
      eta,
      timestamp,
      customerId,
    } = JSON.parse(event.body || "{}");

    // Validar dados mínimos
    if (!packageName || total === undefined) {
      throw new Error("Dados de notificação incompletos");
    }

    console.log("[DISCORD-NOTIFY] Enviando embed...", {
      package: packageName,
      total,
      customerId,
    });

    // Criar e enviar embed
    await discordService.notifyPurchaseOnDiscord({
      package: packageName,
      extras: extras || {},
      total,
      eta,
      customerId,
      timestamp,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Notificação enviada" }),
    };
  } catch (error) {
    console.error("[DISCORD-NOTIFY] ❌ Erro:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
