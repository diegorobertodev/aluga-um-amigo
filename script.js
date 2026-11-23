// Preenche os URLs HTTPS quando os teus serviços estiverem disponíveis.
// O webhook recebe { name, email, role, activity, message }.
// role identifica o papel escolhido; activity identifica a ocasião.
// O chat recebe { message } e deve devolver { answer: "texto da resposta" }.
// Os serviços devem permitir CORS para o domínio do site.
// Este ficheiro é público: não coloques aqui tokens ou chaves secretas.
const CONFIG = {
  bookingWebhook: "",
  chatEndpoint: ""
};

const REQUEST_TIMEOUT_MS = 20000;
const bookingForm = document.getElementById("bookingForm");
const bookingStatus = document.getElementById("bookingStatus");
const bookingButton = bookingForm.querySelector('button[type="submit"]');
const chatPanel = document.getElementById("chatPanel");
const chatToggle = document.getElementById("chatToggle");
const chatClose = document.getElementById("chatClose");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatButton = chatForm.querySelector('button[type="submit"]');
const messages = document.getElementById("messages");
let bookingPending = false;
let chatPending = false;

document.getElementById("year").textContent = new Date().getFullYear();

const greeting = messages.querySelector(".msg");
if (greeting) {
  greeting.textContent = CONFIG.chatEndpoint
    ? "Olá! 👋 Que companhia procuras para a tua ocasião?"
    : "Olá! 👋 Este chat é uma demonstração. O apoio ainda não está disponível.";
}

// A confirmação do formulário aceita qualquer resposta HTTP de sucesso,
// incluindo 204 (sem conteúdo). Apenas o chat precisa de uma resposta JSON.
async function postJson(url, payload, expectJson = false) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return expectJson ? await response.json() : null;
  } finally {
    clearTimeout(timeout);
  }
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (bookingPending) return;

  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  if (!CONFIG.bookingWebhook) {
    bookingStatus.textContent = "Este é um formulário de demonstração. O teu pedido não foi enviado.";
    return;
  }

  const payload = Object.fromEntries(new FormData(form));
  bookingPending = true;
  bookingButton.disabled = true;
  form.setAttribute("aria-busy", "true");
  bookingStatus.textContent = "A enviar o teu pedido…";

  try {
    await postJson(CONFIG.bookingWebhook, payload);
    form.reset();
    bookingStatus.textContent = "Pedido enviado com sucesso!";
  } catch (error) {
    bookingStatus.textContent = error.name === "AbortError"
      ? "A confirmação demorou demasiado. Não foi possível confirmar o envio."
      : "Não foi possível confirmar o envio. Tenta novamente mais tarde.";
  } finally {
    bookingPending = false;
    bookingButton.disabled = false;
    form.setAttribute("aria-busy", "false");
  }
});

function toggleChat(open) {
  chatPanel.classList.toggle("open", open);
  chatToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    chatInput.focus();
  } else {
    chatToggle.focus();
  }
}

chatToggle.addEventListener("click", () => {
  toggleChat(!chatPanel.classList.contains("open"));
});

chatClose.addEventListener("click", () => toggleChat(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && chatPanel.classList.contains("open")) {
    event.preventDefault();
    toggleChat(false);
  }
});

function scrollMessages() {
  messages.scrollTop = messages.scrollHeight;
}

function addMessage(text, fromUser = false) {
  const node = document.createElement("div");
  node.className = fromUser ? "msg me" : "msg";
  node.textContent = text;
  messages.append(node);
  scrollMessages();
  return node;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (chatPending) return;

  const message = chatInput.value.trim();
  if (!message || !chatForm.reportValidity()) return;

  addMessage(message, true);
  chatInput.value = "";

  if (!CONFIG.chatEndpoint) {
    addMessage("Este chat é uma demonstração. O apoio ainda não está disponível.");
    return;
  }

  chatPending = true;
  chatButton.disabled = true;
  chatForm.setAttribute("aria-busy", "true");
  const pendingMessage = addMessage("A escrever…");

  try {
    const data = await postJson(CONFIG.chatEndpoint, { message }, true);
    if (!data || typeof data.answer !== "string" || !data.answer.trim()) {
      throw new Error("Resposta inválida do serviço de apoio.");
    }
    pendingMessage.textContent = data.answer;
  } catch (error) {
    pendingMessage.textContent = error.name === "AbortError"
      ? "O apoio demorou demasiado a responder. Tenta novamente mais tarde."
      : "Não consegui contactar o apoio. Tenta novamente mais tarde.";
  } finally {
    chatPending = false;
    chatButton.disabled = false;
    chatForm.setAttribute("aria-busy", "false");
    scrollMessages();
  }
});
