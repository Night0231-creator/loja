/**
 * THEMAF1A STORE - Utils Module
 * Funções utilitárias compartilhadas
 */

export const DOM = {
  select: (selector) => document.querySelector(selector),
  selectAll: (selector) => Array.from(document.querySelectorAll(selector)),
  on: (element, event, handler) => element?.addEventListener(event, handler),
  off: (element, event, handler) => element?.removeEventListener(event, handler),
  addClass: (element, className) => element?.classList.add(className),
  removeClass: (element, className) => element?.classList.remove(className),
  toggleClass: (element, className) => element?.classList.toggle(className),
  hasClass: (element, className) => element?.classList.contains(className),
};

export const Currency = {
  format: (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value),

  parse: (text) => parseFloat(text.replace(/[^0-9.-]+/g, "")),
};

export const Logger = {
  log: (context, message, data) => {
    console.log(`[${context}] ${message}`, data || "");
  },

  error: (context, message, error) => {
    console.error(`[❌ ${context}] ${message}`, error || "");
  },

  success: (context, message) => {
    console.log(`[✅ ${context}] ${message}`);
  },
};

export const Storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};

export const Animations = {
  fadeIn: (element, duration = 300) => {
    element.style.opacity = "0";
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    setTimeout(() => {
      element.style.opacity = "1";
    }, 10);
  },

  fadeOut: (element, duration = 300) => {
    element.style.opacity = "1";
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = "0";
  },

  slideIn: (element, from = "bottom", duration = 400) => {
    const positions = {
      bottom: ["translateY(30px)", "translateY(0)"],
      top: ["translateY(-30px)", "translateY(0)"],
      left: ["translateX(-30px)", "translateX(0)"],
      right: ["translateX(30px)", "translateX(0)"],
    };

    const [start, end] = positions[from] || positions.bottom;
    element.style.transform = start;
    element.style.opacity = "0";
    element.style.transition = `all ${duration}ms ease-out`;

    setTimeout(() => {
      element.style.transform = end;
      element.style.opacity = "1";
    }, 10);
  },
};

export const EventEmitter = {
  events: {},

  on: (event, callback) => {
    if (!EventEmitter.events[event]) EventEmitter.events[event] = [];
    EventEmitter.events[event].push(callback);
  },

  emit: (event, data) => {
    if (EventEmitter.events[event]) {
      EventEmitter.events[event].forEach((callback) => callback(data));
    }
  },

  off: (event, callback) => {
    if (EventEmitter.events[event]) {
      EventEmitter.events[event] = EventEmitter.events[event].filter(
        (cb) => cb !== callback
      );
    }
  },
};

export default {
  DOM,
  Currency,
  Logger,
  Storage,
  Animations,
  EventEmitter,
};
