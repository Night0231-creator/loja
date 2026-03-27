/**
 * THEMAF1A STORE - Checkout Module
 * Gerencia fluxo de pagamento e integração Mercado Pago
 */

import { DOM, Currency, Logger, Storage, EventEmitter } from "./utils.js";
import Cart from "./cart.js";

const CONFIG = {
  MP_ENDPOINT: "/.netlify/functions/create-payment",
  DISCORD_ENDPOINT: "/.netlify/functions/discord-notify",
  SUCCESS_PAGE: "/pages/success.html",
};

class Checkout {
  constructor() {
    this.modal = DOM.select("#checkoutModal");
    this.isProcessing = false;
    this.init();
  }

  init() {
    Logger.log("Checkout", "Inicializando módulo de checkout");
    this.setupEventListeners();
  }

  setupEventListeners() {
    const finalizeBtn = DOM.select("#finalizeBtn");
    const closeModalBtn = DOM.select("#closeModalBtn");
    const confirmPayBtn = DOM.select("#confirmPayBtn");

    if (finalizeBtn) DOM.on(finalizeBtn, "click", () => this.openModal());
    if (closeModalBtn) DOM.on(closeModalBtn, "click", () => this.closeModal());
    if (confirmPayBtn) DOM.on(confirmPayBtn, "click", () => this.processPayment());

    // Fechar com ESC
    DOM.on(document, "keydown", (e) => {
      if (e.key === "Escape") this.closeModal();
    });

    // Fechar clicando fora
    if (this.modal) {
      DOM.on(this.modal, "click", (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }
  }

  openModal() {
    if (!this.modal) return;

    const cartData = Cart.getCheckoutData();
    if (!cartData.option) {
      Logger.error("Checkout", "Nenhuma opção selecionada");
      return;
    }

    // Preencher modal
    const modalQty = DOM.select("#modalQty");
    const modalExtras = DOM.select("#modalExtras");
    const modalEta = DOM.select("#modalEta");
    const modalPrice = DOM.select("#modalPrice");

    if (modalQty) modalQty.textContent = cartData.option.gtaLabel;
    if (modalExtras) modalExtras.textContent = cartData.extrasText;
    if (modalEta) modalEta.textContent = cartData.eta;
    if (modalPrice) modalPrice.textContent = Currency.format(cartData.total);

    DOM.removeClass(this.modal, "hidden");
    DOM.addClass(this.modal, "flex");

    Logger.log("Checkout", "Modal de checkout aberto");
  }

  closeModal() {
    if (!this.modal) return;
    DOM.addClass(this.modal, "hidden");
    DOM.removeClass(this.modal, "flex");
    Logger.log("Checkout", "Modal de checkout fechado");
  }

  async processPayment() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const cartData = Cart.getCheckoutData();
    const confirmPayBtn = DOM.select("#confirmPayBtn");
    const modalMsg = DOM.select("#modalMsg");

    // Desabilitar botão
    if (confirmPayBtn) {
      confirmPayBtn.disabled = true;
      confirmPayBtn.textContent = "Processando...";
    }

    try {
      Logger.log("Checkout", "Iniciando pagamento...");

      // 1. Criar preferência no Mercado Pago
      const paymentData = {
        title: `THEMAF1A - ${cartData.option.gtaLabel}`,
        description: cartData.extrasText,
        price: cartData.total,
        quantity: 1,
        optionId: cartData.option.optionId,
      };

      const paymentResponse = await fetch(CONFIG.MP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!paymentResponse.ok) {
        throw new Error(`Erro ao criar pagamento: ${paymentResponse.statusText}`);
      }

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.checkoutUrl) {
        throw new Error("URL de checkout não recebida");
      }

      // 2. Salvar dados da compra no localStorage para pós-pagamento
      Storage.set("current_order", {
        option: cartData.option,
        extras: cartData.extras,
        total: cartData.total,
        timestamp: new Date().toISOString(),
        paymentId: paymentResult.preferenceId,
      });

      Logger.success("Checkout", "Redirecionando para pagamento...");

      // 3. Redirecionar para Mercado Pago
      window.location.href = paymentResult.checkoutUrl;
    } catch (error) {
      Logger.error("Checkout", "Erro ao processar pagamento", error);

      if (modalMsg) {
        modalMsg.textContent = `❌ Erro: ${error.message}`;
        modalMsg.classList.add("text-red-400");
      }
    } finally {
      this.isProcessing = false;

      if (confirmPayBtn) {
        confirmPayBtn.disabled = false;
        confirmPayBtn.textContent = "CONFIRMAR E PAGAR";
      }
    }
  }

  // Função para processar retorno do Mercado Pago
  async handlePaymentReturn(status) {
    const order = Storage.get("current_order");

    if (status === "approved" && order) {
      Logger.success("Checkout", "Pagamento aprovado!");

      try {
        // Notificar Discord
        await fetch(CONFIG.DISCORD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            option: order.option,
            extras: order.extras,
            total: order.total,
          }),
        });

        Logger.success("Checkout", "Discord notificado");
      } catch (error) {
        Logger.error("Checkout", "Erro ao notificar Discord", error);
      }

      // Redirecionar para tela de sucesso
      window.location.href = CONFIG.SUCCESS_PAGE;
    } else if (status === "pending") {
      Logger.log("Checkout", "Pagamento pendente");
      alert("Seu pagamento está em análise. Você receberá uma confirmação em breve!");
    } else {
      Logger.log("Checkout", "Pagamento cancelado ou falhou");
      alert("Seu pagamento foi cancelado ou falhou. Tente novamente!");
    }
  }
}

export default new Checkout();
