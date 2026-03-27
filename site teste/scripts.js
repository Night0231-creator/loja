/* eslint-disable no-use-before-define */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ------- Mobile menu -------
  const mobileBtn = $("#mobileMenuBtn");
  const mobileMenu = $("#mobileMenu");
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
    $$("[data-close-menu]").forEach((el) => {
      el.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
      });
    });
  }

  // ------- Smooth reveal on scroll -------
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      }
    },
    { threshold: 0.14 }
  );
  $$(".reveal").forEach((el) => observer.observe(el));

  // ------- Year -------
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ------- Counter animation -------
  function animateNumber(el, to, ms = 900) {
    const from = 0;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const val = Math.round(from + (to - from) * (t * (2 - t)));
      el.textContent = String(val);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const clientsCounter = $("#clientsCounter");
  if (clientsCounter) animateNumber(clientsCounter, 500, 1000);

  // ------- Builder (novo): seleção por valores fixos -------
  const builderQtyLabel = $("#builderQtyLabel");
  const builderEtaLabel = $("#builderEtaLabel");
  const builderEtaLabelMobile = $("#builderEtaLabelMobile");
  const builderPriceLabel = $("#builderPriceLabel");

  const summaryQty = $("#summaryQty");
  const summaryExtras = $("#summaryExtras");
  const summaryEta = $("#summaryEta");
  const summaryPrice = $("#summaryPrice");

  const checkoutEtaPreview = $("#checkoutEtaPreview");
  const checkoutPricePreview = $("#checkoutPricePreview");

  const extraFast = $("#extraFast");
  const extraPriority = $("#extraPriority");
  const extraBonus = $("#extraBonus");

  const modalQty = $("#modalQty");
  const modalExtras = $("#modalExtras");
  const modalEta = $("#modalEta");
  const modalPrice = $("#modalPrice");

  const finalizeBtn = $("#finalizeBtn");
  const checkoutModal = $("#checkoutModal");
  const closeModalBtn = $("#closeModalBtn");
  const confirmPayBtn = $("#confirmPayBtn");
  const modalMsg = $("#modalMsg");

  const valueOptions = $$(".value-option");

  const formatBRL = (n) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  // Extras (valores fixos - ajuste conforme seu catálogo).
  const EXTRA_PRICES = {
    fast: 5.0,
    priority: 10.0,
    bonus: 4.0,
  };

  // Prazo por "tier" (0..4) conforme regra: 40M/dia.
  const ETA_LABELS_BY_TIER = ["até 24h", "2 a 3 dias", "4 a 5 dias", "8 a 10 dias", "12 a 15 dias"];

  let selectedOptionEl =
    valueOptions.find((el) => el.dataset.mostSold === "true") || valueOptions[0] || null;

  const getSelectedData = () => {
    if (!selectedOptionEl) return null;
    return {
      gtaLabel: selectedOptionEl.dataset.gtaLabel || "",
      basePrice: Number(selectedOptionEl.dataset.basePrice || "0"),
      etaTier: Number(selectedOptionEl.dataset.etaTier || "0"),
      optionId: Number(selectedOptionEl.dataset.optionId || "0"),
      mostSold: selectedOptionEl.dataset.mostSold === "true",
    };
  };

  const computeExtras = () => ({
    fast: !!(extraFast && extraFast.checked),
    priority: !!(extraPriority && extraPriority.checked),
    bonus: !!(extraBonus && extraBonus.checked),
  });

  const computeExtrasPrice = (extras) =>
    (extras.fast ? EXTRA_PRICES.fast : 0) +
    (extras.priority ? EXTRA_PRICES.priority : 0) +
    (extras.bonus ? EXTRA_PRICES.bonus : 0);

  const computeEtaText = (extras, etaTierBase) => {
    let tier = Number.isFinite(Number(etaTierBase)) ? Number(etaTierBase) : 0;
    // Extras podem reduzir 1 nível cada.
    if (extras.fast) tier -= 1;
    if (extras.priority) tier -= 1;
    tier = Math.max(0, Math.min(ETA_LABELS_BY_TIER.length - 1, tier));
    return ETA_LABELS_BY_TIER[tier];
  };

  const computeExtrasText = (extras) => {
    const list = [];
    if (extras.fast) list.push("Entrega mais rápida");
    if (extras.priority) list.push("Prioridade");
    if (extras.bonus) list.push("Bônus");
    return list.length ? list.join(", ") : "Sem extras";
  };

  function updateSelectionUI() {
    valueOptions.forEach((el) => {
      const isSelected = el === selectedOptionEl;
      el.classList.toggle("is-selected", isSelected);
      el.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function updateBuilderUI() {
    const selected = getSelectedData();
    if (!selected) return;
    const extras = computeExtras();

    const etaText = computeEtaText(extras, selected.etaTier);
    const extrasPrice = computeExtrasPrice(extras);
    const total = Math.round((selected.basePrice + extrasPrice) * 100) / 100;
    const totalText = formatBRL(total);
    const extrasText = computeExtrasText(extras);

    builderQtyLabel && (builderQtyLabel.textContent = selected.gtaLabel);
    builderEtaLabel && (builderEtaLabel.textContent = etaText);
    builderEtaLabelMobile && (builderEtaLabelMobile.textContent = etaText);
    builderPriceLabel && (builderPriceLabel.textContent = totalText);

    summaryQty && (summaryQty.textContent = selected.gtaLabel);
    summaryExtras && (summaryExtras.textContent = extrasText);
    summaryEta && (summaryEta.textContent = etaText);
    summaryPrice && (summaryPrice.textContent = totalText);

    checkoutPricePreview && (checkoutPricePreview.textContent = totalText);
    checkoutEtaPreview && (checkoutEtaPreview.textContent = etaText);
  }

  function selectOption(optionEl) {
    if (!optionEl) return;
    selectedOptionEl = optionEl;
    updateSelectionUI();
    updateBuilderUI();
  }

  // Clique nos cards de valor
  valueOptions.forEach((el) => {
    el.addEventListener("click", () => selectOption(el));
  });

  // Clique nos extras
  const updateOnExtras = () => updateBuilderUI();
  if (extraFast) extraFast.addEventListener("change", updateOnExtras);
  if (extraPriority) extraPriority.addEventListener("change", updateOnExtras);
  if (extraBonus) extraBonus.addEventListener("change", updateOnExtras);

  // Inicializa
  updateSelectionUI();
  updateBuilderUI();

  // ------- Pacotes -> builder (seleciona valor fixo mais próximo) -------
  const packageCards = $$(".package-card");

  function pickClosestOptionByQty(pkgQty) {
    if (!valueOptions.length) return null;
    let best = null;
    let bestDiff = Number.POSITIVE_INFINITY;

    valueOptions.forEach((el) => {
      const optQty = Number(el.dataset.optionId || "0");
      const diff = Math.abs(optQty - pkgQty);
      const isMostSold = el.dataset.mostSold === "true";

      if (diff < bestDiff) {
        best = el;
        bestDiff = diff;
        return;
      }

      // Empate: prefira "mais vendido".
      if (diff === bestDiff && isMostSold) {
        best = el;
      }
    });

    return best;
  }

  function setBuilderByPackage(card) {
    if (!card) return;
    const pkgQty = Number(card.getAttribute("data-qty") || "0");
    const closest = pickClosestOptionByQty(pkgQty);
    if (!closest) return;

    // Reset extras quando o cliente escolhe pelo pacote.
    if (extraFast) extraFast.checked = false;
    if (extraPriority) extraPriority.checked = false;
    if (extraBonus) extraBonus.checked = false;

    selectOption(closest);

    const builderSection = $("#monte");
    if (builderSection) builderSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $$(".package-cta").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".package-card");
      setBuilderByPackage(card);
    });
  });

  $$("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-quick");
      const card = packageCards.find((c) => c.getAttribute("data-package") === key);
      setBuilderByPackage(card);
    });
  });

  // ------- Modal -------
  function setModalFromSelection() {
    const selected = getSelectedData();
    if (!selected) return;

    const extras = computeExtras();
    const etaText = computeEtaText(extras, selected.etaTier);
    const extrasPrice = computeExtrasPrice(extras);
    const total = Math.round((selected.basePrice + extrasPrice) * 100) / 100;
    const extrasText = computeExtrasText(extras);

    if (modalQty) modalQty.textContent = selected.gtaLabel;
    if (modalExtras) modalExtras.textContent = extrasText;
    if (modalEta) modalEta.textContent = etaText;
    if (modalPrice) modalPrice.textContent = formatBRL(total);
  }

  function openModal() {
    if (!checkoutModal) return;
    setModalFromSelection();
    checkoutModal.classList.remove("hidden");
    checkoutModal.classList.add("flex");
    modalMsg && (modalMsg.textContent = "");
  }

  function closeModal() {
    if (!checkoutModal) return;
    checkoutModal.classList.add("hidden");
    checkoutModal.classList.remove("flex");
  }

  if (finalizeBtn) finalizeBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  if (checkoutModal) {
    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) closeModal();
    });
  }

  function getMpCheckoutUrl() {
    return "";
  }

  // ------- Discord Notification -------
  /**
   * Envia notificação de compra para o Discord
   * @param {string} optionId - ID da opção de compra
   * @param {Array} extras - Array com extras selecionados
   */
  async function sendDiscordNotification(optionId, extras) {
    try {
      const res = await fetch("/.netlify/functions/discord-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId,
          extras,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn("Discord notification falhou:", data);
        return false;
      }

      console.log("✅ Notificação enviada ao Discord:", data);
      return true;
    } catch (err) {
      console.error("Erro ao enviar notificação Discord:", err);
      return false;
    }
  }

  if (confirmPayBtn) {
    confirmPayBtn.addEventListener("click", async () => {
      if (!modalMsg || !checkoutModal || !confirmPayBtn) return;

      const selected = getSelectedData();
      if (!selected) {
        modalMsg.textContent = "Selecione um valor para continuar.";
        modalMsg.className = "mt-3 text-xs text-white/70";
        return;
      }

      const extras = computeExtras();

      confirmPayBtn.disabled = true;
      const previousLabel = confirmPayBtn.textContent;
      confirmPayBtn.textContent = "Gerando pagamento...";

      try {
        modalMsg.textContent = "Criando checkout Mercado Pago...";
        modalMsg.className = "mt-3 text-xs text-white/70";

        const res = await fetch("/.netlify/functions/create-mp-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            optionId: selected.optionId,
            extras,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.message || "Falha ao gerar pagamento.";
          throw new Error(msg);
        }

        const redirectUrl = data?.init_point || data?.sandbox_init_point;
        if (!redirectUrl) throw new Error("Checkout não retornou URL de redirecionamento.");

        // Envia notificação ao Discord (assincronamente, sem bloquear o pagamento)
        const notificationSent = await sendDiscordNotification(selected.optionId, extras);
        if (notificationSent) {
          modalMsg.textContent = "✅ Notificação enviada ao Discord!";
          modalMsg.className = "mt-3 text-xs text-neon2";
        }

        modalMsg.textContent = "Redirecionando para o pagamento...";
        modalMsg.className = "mt-3 text-xs text-white/70";

        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 450);
      } catch (err) {
        modalMsg.textContent = err?.message
          ? `Erro: ${err.message}`
          : "Erro ao gerar checkout. Tente novamente em instantes.";
        modalMsg.className = "mt-3 text-xs text-white/70";
        confirmPayBtn.disabled = false;
        confirmPayBtn.textContent = previousLabel;
      }
    });
  }
})();

