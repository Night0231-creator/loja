/**
 * THEMAF1A STORE - Main Application
 * Inicializador central
 */

import Cart from "./modules/cart.js";
import Checkout from "./modules/checkout.js";
import UI from "./modules/ui.js";
import Discord from "./modules/discord.js";
import { Logger, EventEmitter, Storage } from "./modules/utils.js";

class App {
  constructor() {
    this.init();
  }

  init() {
    Logger.log("App", "🚀 Inicializando THEMAF1A STORE v2.0...");

    // Carregar módulos nesta ordem
    this.initModules();
    this.setupGlobalEvents();
    this.handleReturnFromPayment();
    this.setupYearDisplay();

    Logger.success("App", "✅ Aplicação pronta para uso");
  }

  initModules() {
    // Módulos já são singletons (exportados com new)
    Logger.log("App", "Módulos carregados");
  }

  setupGlobalEvents() {
    // Atualização de carrinho
    EventEmitter.on("cart:changed", (data) => {
      Logger.log("App", "Carrinho alterado");
    });

    EventEmitter.on("cart:updated", (total) => {
      Logger.log("App", `Total do carrinho: R$ ${total.toFixed(2)}`);
    });
  }

  handleReturnFromPayment() {
    // Verificar URL para parâmetros de retorno do Mercado Pago
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("collection_status");

    if (paymentStatus === "approved") {
      Logger.success("App", "Pagamento aprovado!");
      const order = Storage.get("current_order");

      if (order) {
        Discord.notifyPurchase(order);
      }
    }
  }

  setupYearDisplay() {
    const yearElement = document.querySelector("#year");
    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new App();
  });
} else {
  new App();
}
