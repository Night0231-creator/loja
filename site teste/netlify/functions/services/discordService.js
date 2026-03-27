/**
 * Discord Notification Service
 * Responsável por formatar e enviar mensagens ao Discord via webhook
 */

function generateOrderId() {
  return `#${Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0")}`;
}

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Cria um embed formatado para Discord
 * @param {Object} orderData - Dados do pedido
 * @param {string} orderData.package - Pacote (ex: "200M GTA$")
 * @param {number} orderData.price - Preço em reais
 * @param {string} orderData.extras - Extras selecionados
 * @param {string} orderData.eta - Prazo de entrega
 * @param {string} orderData.orderId - ID do pedido (opcional)
 * @returns {Object} Embed formatado para Discord
 */
function createOrderEmbed(orderData = {}) {
  const {
    package: packageName,
    price,
    extras,
    eta,
    orderId = generateOrderId(),
  } = orderData;

  const now = new Date().toISOString();
  const formattedPrice = formatBRL(price);

  // Cor: roxo neon (#7c3aed = 8126957 em decimal)
  const embed = {
    title: "💰 NOVA COMPRA REALIZADA",
    description: `Pedido recebido e em processamento.`,
    color: 8126957, // roxo neon
    fields: [
      {
        name: "🆔 ID do Pedido",
        value: orderId,
        inline: true,
      },
      {
        name: "📦 Pacote",
        value: packageName || "Não especificado",
        inline: true,
      },
      {
        name: "💵 Valor da Compra",
        value: formattedPrice || "N/A",
        inline: true,
      },
      {
        name: "⚡ Extras",
        value: extras && extras.length > 0 ? extras : "Nenhum",
        inline: false,
      },
      {
        name: "⏱ Prazo de Entrega",
        value: eta || "A confirmar",
        inline: true,
      },
      {
        name: "🕐 Data/Hora",
        value: new Date(now).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        }),
        inline: true,
      },
    ],
    footer: {
      text: "THEMAF1A STORE | Sistema Automático",
    },
    timestamp: now,
  };

  return embed;
}

/**
 * Envia uma mensagem para o Discord via webhook
 * @param {string} webhookUrl - URL do webhook
 * @param {Object} embed - Embed a ser enviado
 * @returns {Promise<Object>} Resultado da requisição
 */
async function sendDiscordMessage(webhookUrl, embed) {
  if (!webhookUrl) {
    throw new Error("Discord webhook URL não configurada");
  }

  const payload = {
    embeds: [embed],
    // Adiciona um "pong" silencioso para garantir que a mensagem foi enviada
    content: "",
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Discord webhook retornou ${response.status}: ${response.statusText}`
      );
    }

    return {
      success: true,
      message: "Mensagem enviada ao Discord com sucesso",
    };
  } catch (error) {
    throw new Error(`Erro ao enviar mensagem ao Discord: ${error.message}`);
  }
}

/**
 * Função completa para notificar compra no Discord
 * @param {string} webhookUrl - URL do webhook
 * @param {Object} orderData - Dados do pedido
 * @returns {Promise<Object>} Resultado
 */
async function notifyPurchaseOnDiscord(webhookUrl, orderData) {
  const embed = createOrderEmbed(orderData);
  const result = await sendDiscordMessage(webhookUrl, embed);
  return {
    ...result,
    orderId: orderData.orderId,
  };
}

module.exports = {
  createOrderEmbed,
  sendDiscordMessage,
  notifyPurchaseOnDiscord,
  generateOrderId,
  formatBRL,
};
