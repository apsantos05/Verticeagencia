/* Vértice Social Media — interações do site */
(function () {
  "use strict";

  // >>> Configuração do site. Troque aqui o número do WhatsApp (DDI + DDD + número, só dígitos).
  const CONFIG = {
    whatsapp: "5511900000000",
    defaultMessage: "Olá, vim pelo site da Vértice!"
  };

  // Serviço pré-selecionado no formulário ao escolher cada plano
  const PLAN_SERVICE = {
    "Essencial": "Gestão de Instagram",
    "Crescimento": "Gestão de Instagram",
    "Presença total": "Instagram + site"
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const waUrl = (text) => "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text);

  // ano do rodapé
  function initYear() {
    const yr = $("#yr");
    if (yr) yr.textContent = new Date().getFullYear();
  }

  // todo link com [data-wa] aponta para o número configurado
  function initWhatsAppLinks() {
    $$("[data-wa]").forEach((a) => { a.href = waUrl(CONFIG.defaultMessage); });
  }

  // menu mobile
  function initMenu() {
    const btn = $("#menuBtn");
    const nav = $("#nav");
    if (!btn || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Fechar" : "Menu";
    };

    btn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  // escolher plano preenche o formulário
  function initPlanPicker() {
    const msg = $("#f-msg");
    const serv = $("#f-serv");
    if (!msg || !serv) return;

    // se a pessoa editar a mensagem, não sobrescrevemos mais
    msg.addEventListener("input", () => { delete msg.dataset.auto; });

    $$("[data-plan]").forEach((a) => {
      a.addEventListener("click", () => {
        const plan = a.dataset.plan;
        serv.value = PLAN_SERVICE[plan] || serv.value;
        if (!msg.value.trim() || msg.dataset.auto) {
          msg.value = "Tenho interesse no plano " + plan + ".";
          msg.dataset.auto = "1";
        }
      });
    });
  }

  // copiar contatos
  function initCopyButtons() {
    $$(".copy").forEach((b) => {
      let timer;
      const flash = (label) => {
        b.textContent = label;
        clearTimeout(timer);
        timer = setTimeout(() => { b.textContent = "Copiar"; }, 1600);
      };

      b.addEventListener("click", () => {
        const el = document.getElementById(b.dataset.copy);
        if (!el) return;

        // sem acesso à área de transferência: seleciona o texto para copiar manualmente
        const selectText = () => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          flash("Selecionado");
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(el.textContent.trim()).then(() => flash("Copiado"), selectText);
        } else {
          selectText();
        }
      });
    });
  }

  // formulário -> mensagem pronta para WhatsApp
  function initLeadForm() {
    const form = $("#leadForm");
    if (!form) return;
    const out = $("#formOut");
    const err = $("#formErr");
    const f = form.elements;

    f.nome.addEventListener("input", () => { err.textContent = ""; });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nome = f.nome.value.trim();
      if (!nome) {
        err.textContent = "Escreva seu nome para montarmos a mensagem.";
        f.nome.focus();
        return;
      }
      err.textContent = "";

      const tipo = (form.querySelector('input[name="tipo"]:checked') || {}).value || "";
      const ig = f.ig.value.trim();
      const extra = f.msg.value.trim();

      const text = "Olá! Sou " + nome + " (" + tipo + ").\nPreciso de: " + f.servico.value + "." +
        (ig ? "\nMeu Instagram: " + ig : "") +
        (extra ? "\n\n" + extra : "");

      const p = document.createElement("p");
      p.textContent = "Mensagem pronta, " + nome.split(" ")[0] + ". ";
      const a = document.createElement("a");
      a.href = waUrl(text);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Abrir conversa no WhatsApp →";
      p.appendChild(a);

      out.replaceChildren(p);
      out.classList.add("show");
      a.focus();
    });
  }

  initYear();
  initWhatsAppLinks();
  initMenu();
  initPlanPicker();
  initCopyButtons();
  initLeadForm();
})();
