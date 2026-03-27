/**
 * THEMAF1A STORE - UI Module
 * Componentes e manipulações de interface
 */

import { DOM, Logger, Animations, EventEmitter } from "./utils.js";

class UI {
  constructor() {
    this.init();
  }

  init() {
    Logger.log("UI", "Inicializando módulo UI");
    this.setupMobileMenu();
    this.setupScrollReveal();
    this.setupCounterAnimations();
    this.setupPackageNavigation();
    this.setupSmoothScroll();
  }

  setupMobileMenu() {
    const mobileMenuBtn = DOM.select("#mobileMenuBtn");
    const mobileMenu = DOM.select("#mobileMenu");

    if (mobileMenuBtn && mobileMenu) {
      DOM.on(mobileMenuBtn, "click", () => {
        DOM.toggleClass(mobileMenu, "hidden");
      });

      DOM.selectAll("[data-close-menu]").forEach((el) => {
        DOM.on(el, "click", () => {
          DOM.addClass(mobileMenu, "hidden");
        });
      });

      Logger.log("UI", "Menu mobile configurado");
    }
  }

  setupScrollReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            DOM.addClass(entry.target, "is-visible");
            Animations.slideIn(entry.target, "bottom", 600);
          }
        });
      },
      { threshold: 0.14 }
    );

    DOM.selectAll(".reveal").forEach((el) => observer.observe(el));
    Logger.log("UI", "Scroll reveal configurado");
  }

  setupCounterAnimations() {
    const animateCounter = (el, targetValue, duration = 1000) => {
      const startValue = 0;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.round(startValue + (targetValue - startValue) * progress);

        el.textContent = String(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
    };

    const clientsCounter = DOM.select("#clientsCounter");
    if (clientsCounter) animateCounter(clientsCounter, 500, 1200);

    const clientsBigCounter = DOM.select("#clientsBigCounter");
    if (clientsBigCounter) animateCounter(clientsBigCounter, 500, 1500);

    Logger.log("UI", "Counters animados");
  }

  setupPackageNavigation() {
    const packageCards = DOM.selectAll(".package-card");

    DOM.selectAll(".package-cta").forEach((btn) => {
      DOM.on(btn, "click", (e) => {
        const card = e.target.closest(".package-card");
        this.navigateToBuilder(card, packageCards);
      });
    });

    DOM.selectAll("[data-quick]").forEach((btn) => {
      DOM.on(btn, "click", () => {
        const packageKey = btn.getAttribute("data-quick");
        const card = packageCards.find((c) => c.getAttribute("data-package") === packageKey);
        this.navigateToBuilder(card, packageCards);
      });
    });

    Logger.log("UI", "Navegação de pacotes configurada");
  }

  navigateToBuilder(card, packageCards) {
    if (!card) return;

    const packageQty = Number(card.getAttribute("data-qty") || "0");
    const valueOptions = DOM.selectAll(".value-option");

    // Encontrar opção mais próxima
    let closestOption = null;
    let bestDiff = Number.POSITIVE_INFINITY;

    valueOptions.forEach((el) => {
      const optionQty = Number(el.dataset.optionId || "0");
      const diff = Math.abs(optionQty - packageQty);
      const isMostSold = el.dataset.mostSold === "true";

      if (diff < bestDiff || (diff === bestDiff && isMostSold)) {
        closestOption = el;
        bestDiff = diff;
      }
    });

    if (closestOption) {
      closestOption.click();

      const builderSection = DOM.select("#monte");
      if (builderSection) {
        setTimeout(() => {
          builderSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }

  setupSmoothScroll() {
    DOM.selectAll("a[href^='#']").forEach((link) => {
      DOM.on(link, "click", (e) => {
        const href = link.getAttribute("href");
        if (href !== "#") {
          e.preventDefault();
          const target = DOM.select(href);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });

    Logger.log("UI", "Scroll suave configurado");
  }

  showNotification(message, type = "success", duration = 4000) {
    const notification = document.createElement("div");
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white text-sm z-50 ${
      type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    Animations.slideIn(notification, "bottom", 300);

    setTimeout(() => {
      Animations.fadeOut(notification, 300);
      setTimeout(() => notification.remove(), 300);
    }, duration);

    Logger.log("UI", `Notificação: ${message} (${type})`);
  }

  showLoading(elementId, show = true) {
    const element = DOM.select(`#${elementId}`);
    if (!element) return;

    if (show) {
      const spinner = document.createElement("div");
      spinner.className = "inline-block animate-spin";
      spinner.innerHTML = '<svg class="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
      element.appendChild(spinner);
    } else {
      const spinner = element.querySelector(".animate-spin");
      if (spinner) spinner.remove();
    }
  }

  highlight(elementId, duration = 2000) {
    const element = DOM.select(`#${elementId}`);
    if (!element) return;

    DOM.addClass(element, "ring-2 ring-neon2 ring-offset-2");

    setTimeout(() => {
      DOM.removeClass(element, "ring-2 ring-neon2 ring-offset-2");
    }, duration);
  }
}

export default new UI();
