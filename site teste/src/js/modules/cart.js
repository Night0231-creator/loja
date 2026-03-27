/**
 * THEMAF1A STORE - Cart Module
 * Gerencia seleção de pacotes e extras
 */

import { DOM, Currency, Logger, EventEmitter } from "./utils.js";

const EXTRA_PRICES = {
  fast: 5.0,
  priority: 10.0,
  bonus: 4.0,
};

const ETA_LABELS_BY_TIER = [
  "até 24h",
  "2 a 3 dias",
  "4 a 5 dias",
  "8 a 10 dias",
  "12 a 15 dias",
];

class Cart {
  constructor() {
    this.selectedOption = null;
    this.extras = {
      fast: false,
      priority: false,
      bonus: false,
    };
    this.init();
  }

  init() {
    Logger.log("Cart", "Inicializando gerenciador de carrinho");
    this.setupEventListeners();
    this.selectDefaultOption();
  }

  setupEventListeners() {
    const valueOptions = DOM.selectAll(".value-option");
    valueOptions.forEach((el) => {
      DOM.on(el, "click", () => this.selectOption(el));
    });

    const extraCheckboxes = {
      fast: DOM.select("#extraFast"),
      priority: DOM.select("#extraPriority"),
      bonus: DOM.select("#extraBonus"),
    };

    Object.entries(extraCheckboxes).forEach(([key, checkbox]) => {
      if (checkbox) {
        DOM.on(checkbox, "change", () => {
          this.extras[key] = checkbox.checked;
          this.updateUI();
          EventEmitter.emit("cart:updated", this.getTotal());
        });
      }
    });
  }

  selectDefaultOption() {
    const mostSoldOption = DOM.selectAll(".value-option").find(
      (el) => el.dataset.mostSold === "true"
    );
    this.selectOption(mostSoldOption);
  }

  selectOption(optionEl) {
    if (!optionEl) return;

    this.selectedOption = {
      gtaLabel: optionEl.dataset.gtaLabel || "",
      basePrice: Number(optionEl.dataset.basePrice || "0"),
      etaTier: Number(optionEl.dataset.etaTier || "0"),
      optionId: Number(optionEl.dataset.optionId || "0"),
      mostSold: optionEl.dataset.mostSold === "true",
    };

    // Reset extras quando seleciona novo pacote
    this.extras = { fast: false, priority: false, bonus: false };
    Object.entries(DOM.select("#extraFast") ? { fast: "#extraFast", priority: "#extraPriority", bonus: "#extraBonus" } : {}).forEach(
      ([, selector]) => {
        const el = DOM.select(selector);
        if (el) el.checked = false;
      }
    );

    this.updateUISelection();
    this.updateUI();
    EventEmitter.emit("cart:changed", this.selectedOption);
    Logger.log("Cart", `Pacote selecionado: ${this.selectedOption.gtaLabel}`);
  }

  updateUISelection() {
    DOM.selectAll(".value-option").forEach((el) => {
      const isSelected = el === this.selectedOption;
      DOM.toggleClass(el, "is-selected", isSelected);
      el.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  computeExtrasPrice() {
    return (
      (this.extras.fast ? EXTRA_PRICES.fast : 0) +
      (this.extras.priority ? EXTRA_PRICES.priority : 0) +
      (this.extras.bonus ? EXTRA_PRICES.bonus : 0)
    );
  }

  computeETA() {
    let tier = this.selectedOption?.etaTier || 0;

    // Extras reduzem 1 nível cada
    if (this.extras.fast) tier -= 1;
    if (this.extras.priority) tier -= 1;

    tier = Math.max(0, Math.min(ETA_LABELS_BY_TIER.length - 1, tier));
    return ETA_LABELS_BY_TIER[tier];
  }

  computeExtrasText() {
    const list = [];
    if (this.extras.fast) list.push("Entrega mais rápida");
    if (this.extras.priority) list.push("Prioridade");
    if (this.extras.bonus) list.push("Bônus");
    return list.length ? list.join(", ") : "Sem extras";
  }

  getTotal() {
    if (!this.selectedOption) return 0;
    return Math.round((this.selectedOption.basePrice + this.computeExtrasPrice()) * 100) / 100;
  }

  updateUI() {
    if (!this.selectedOption) return;

    const elements = {
      builderQtyLabel: DOM.select("#builderQtyLabel"),
      builderEtaLabel: DOM.select("#builderEtaLabel"),
      builderEtaLabelMobile: DOM.select("#builderEtaLabelMobile"),
      builderPriceLabel: DOM.select("#builderPriceLabel"),
      summaryQty: DOM.select("#summaryQty"),
      summaryExtras: DOM.select("#summaryExtras"),
      summaryEta: DOM.select("#summaryEta"),
      summaryPrice: DOM.select("#summaryPrice"),
      checkoutPricePreview: DOM.select("#checkoutPricePreview"),
      checkoutEtaPreview: DOM.select("#checkoutEtaPreview"),
    };

    const etaText = this.computeETA();
    const totalText = Currency.format(this.getTotal());
    const extrasText = this.computeExtrasText();

    Object.entries(elements).forEach(([, el]) => {
      if (!el) return;
      if (el.id.includes("Qty")) el.textContent = this.selectedOption.gtaLabel;
      else if (el.id.includes("Eta")) el.textContent = etaText;
      else if (el.id.includes("Price")) el.textContent = totalText;
      else if (el.id.includes("Extras")) el.textContent = extrasText;
    });
  }

  getCheckoutData() {
    return {
      option: this.selectedOption,
      extras: this.extras,
      total: this.getTotal(),
      eta: this.computeETA(),
      extrasText: this.computeExtrasText(),
    };
  }
}

export default new Cart();
