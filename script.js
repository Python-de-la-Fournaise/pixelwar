// ===============================
// 🔹 Configuration Firebase
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyB2aFjkYqtpCOV95GydPGIqFCH3ujL917U",
  authDomain: "pixelwar-947d9.firebaseapp.com",
  projectId: "pixelwar-947d9",
  storageBucket: "pixelwar-947d9.firebasestorage.app",
  messagingSenderId: "799142607185",
  appId: "1:799142607185:web:751e621a431691c5e3fb70",
  measurementId: "G-VTNRE9B1SM",
  databaseURL: "https://pixelwar-947d9-default-rtdb.europe-west1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===============================
// 🔹 Variables principales
// ===============================
const grid = document.getElementById("grid");
const colorPicker = document.getElementById("colorPicker");
const cooldownDisplay = document.getElementById("cooldown");

let isLoading = true;
let canDraw = true;
const size = 70; 
const cooldownTime = 5000; // ms

let activePopup = null; // Pour éviter plusieurs popups en même temps

// ✅ Message au démarrage
cooldownDisplay.textContent = "⏳Chargement de la map⏳";

// ===============================
// 🔹 Création de la grille
// ===============================
for (let i = 0; i < size * size; i++) {
  const pixel = document.createElement("div");
  pixel.classList.add("pixel");
  pixel.dataset.index = i;
  pixel.addEventListener("click", (e) => showPopup(i, e));
  grid.appendChild(pixel);
}

// ===============================
// 🔹 Afficher popup de validation
// ===============================
function showPopup(index, event) {
  if (!canDraw || isLoading) return;

  // Supprimer popup existante
  if (activePopup) {
    activePopup.remove();
    document.querySelectorAll(".pixel.pending").forEach(p => p.classList.remove("pending"));
  }

  const pixel = grid.children[index];
  pixel.classList.add("pending");

  const popup = document.createElement("div");
  popup.classList.add("popup");
  popup.innerHTML = `
    <span>Valider ?</span>
    <div class="buttons">
      <button class="confirm">Oui</button>
      <button class="cancel">Non</button>
    </div>
  `;
  document.body.appendChild(popup);

  // Positionner la popup au-dessus du pixel
  const rect = pixel.getBoundingClientRect();
  popup.style.left = `${rect.left + window.scrollX +20}px`; // ajuste X
  popup.style.top = `${rect.top + window.scrollY - 55}px`;   // ajuste Y

  // Boutons
  popup.querySelector(".confirm").addEventListener("click", () => {
    placePixel(index);
    cleanup();
  });
  popup.querySelector(".cancel").addEventListener("click", () => {
    cleanup();
  });

  activePopup = popup;

  function cleanup() {
    pixel.classList.remove("pending");
    if (popup) popup.remove();
    activePopup = null;
  }
}

// ===============================
// 🔹 Placer un pixel
// ===============================
function placePixel(index) {
  const color = colorPicker.value;

  // Mise à jour visuelle immédiate
  grid.children[index].style.background = color;

  // Enregistrement Firebase
  db.ref("pixels/" + index).set(color);

  // ✅ Passage en cooldown
  canDraw = false;
  cooldownDisplay.style.color = "#b61a16";
  cooldownDisplay.textContent = `⏳Cooldown en cours...⏳`;
  setTimeout(() => {
    canDraw = true;
    cooldownDisplay.style.color = "#457028";
    cooldownDisplay.textContent = `✅Prêt à dessiner✅`;
  }, cooldownTime);
}

// ===============================
// 🔹 Initialisation si grille vide
// ===============================
db.ref("pixels").once("value").then(snapshot => {
  if (!snapshot.exists()) {
    const initial = {};
    for (let i = 0; i < size * size; i++) initial[i] = "#E3E3E3";
    db.ref("pixels").set(initial);
  }
});

// ===============================
// 🔹 Mise à jour en temps réel
// ===============================
db.ref("pixels").on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;

  Object.keys(data).forEach(i => {
    grid.children[i].style.background = data[i];
  });

  // ✅ Une fois la grille reçue → activer le système normal
  isLoading = false;
  if (canDraw) {
    cooldownDisplay.style.color = "#457028";
    cooldownDisplay.textContent = "✅Prêt à dessiner✅";
  }
});


