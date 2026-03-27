/**
 * THEMAF1A STORE - Discord Module
 * Gerencia notificações e integrações Discord
 */

import { Logger, Storage } from "./utils.js";

const CONFIG = {
  DISCORD_WEBHOOK_ENDPOINT: "/.netlify/functions/discord-notify",
  DISCORD_SERVER: "https://discord.gg/2kuqgFw6S7",
};

class Discord {
  constructor() {
    this.init();
  }

  init() {
    Logger.log("Discord", "Inicializando módulo Discord");
  }

  /**
   * Envia notificação de compra para Discord
   * @param {Object} orderData - Dados da compra
   */
  async notifyPurchase(orderData) {
    if (!orderData) {
      Logger.error("Discord", "Dados de compra incompletos");
      return;
    }

    try {
      Logger.log("Discord", "Enviando notificação de compra...");

      const payload = {
        optionId: orderData.option?.optionId,
        packageName: orderData.option?.gtaLabel,
        extras: orderData.extras,
        total: orderData.total,
        eta: orderData.eta,
        timestamp: new Date().toISOString(),
        customerId: this.getOrCreateCustomerId(),
      };

      const response = await fetch(CONFIG.DISCORD_WEBHOOK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook retornou: ${response.statusText}`);
      }

      Logger.success("Discord", "Notificação enviada com sucesso!");
      return true;
    } catch (error) {
      Logger.error("Discord", "Erro ao enviar notificação", error);
      return false;
    }
  }

  /**
   * Obtém ou cria ID único do cliente
   */
  getOrCreateCustomerId() {
    let customerId = Storage.get("themaf1a_customer_id");

    if (!customerId) {
      customerId = `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      Storage.set("themaf1a_customer_id", customerId);
    }

    return customerId;
  }

  /**
   * Abre servidor Discord
   */
  openDiscordServer() {
    Logger.log("Discord", "Abrindo servidor Discord");
    window.open(CONFIG.DISCORD_SERVER, "_blank");
  }

  /**
   * Obtém instruções de resgaste
   */
  getRedemptionInstructions() {
    return {
      steps: [
        "1️⃣ Acesse nosso servidor Discord",
        "2️⃣ Crie um ticket em #tickets",
        "3️⃣ Envie seu comprovante de pagamento (Mercado Pago)",
        "4️⃣ Nossa equipe entregará seu UP em até 24h",
      ],
      discordUrl: CONFIG.DISCORD_SERVER,
    };
  }
}

export default new Discord();
