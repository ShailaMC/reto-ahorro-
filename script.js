
const META = 10000;

const CANTIDADES = [
  200, 50, 100, 25, 150, 75, 100, 200, 25, 50,
  125, 100, 200, 75, 150, 50, 100, 25, 200, 100,
  75, 150, 50, 200, 100, 25, 125, 75, 150, 100,
  50, 200, 75, 100, 150, 25, 200, 50, 100, 125,
  75, 150, 100, 200, 50, 25, 100, 150, 75, 200,
  100, 50, 125, 150, 75, 200, 100, 25, 150, 50,
  100, 200, 75, 125, 50, 150, 100, 200, 25, 75,
  150, 100, 50, 200, 125, 75, 100, 150, 50, 200,
  200, 200, 200, 200, 200, 200, 125
];

const CLAVE = "mi-moneybox-c10000-v1";

const tablero = document.getElementById("amountGrid");
const totalAhorrado = document.getElementById("savedAmount");
const barra = document.getElementById("progressFill");
const porcentaje = document.getElementById("progressPercent");
const restante = document.getElementById("remainingAmount");
const marcadas = document.getElementById("checkedCount");
const totalCasillas = document.getElementById("totalCount");
const buscador = document.getElementById("searchAmount");
const orden = document.getElementById("sortAmounts");
const botonReiniciar = document.getElementById("resetButton");
const dialogo = document.getElementById("resetDialog");
const confirmar = document.getElementById("confirmReset");
const toast = document.getElementById("toast");

let completadas = cargarProgreso();
let temporizador;

function cargarProgreso() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");

    if (!Array.isArray(datos)) return new Set();

    return new Set(
      datos.filter(
        n => Number.isInteger(n) &&
        n >= 0 &&
        n < CANTIDADES.length
      )
    );
  } catch {
    return new Set();
  }
}

function guardarProgreso() {
  try {
    localStorage.setItem(
      CLAVE,
      JSON.stringify([...completadas])
    );
  } catch {
    mostrarMensaje("No se pudo guardar el progreso.");
  }
}

function dinero(cantidad) {
  return "C$" + cantidad.toLocaleString("es-NI");
}

function calcularTotal() {
  let total = 0;

  completadas.forEach(indice => {
    total += CANTIDADES[indice];
  });

  return total;
}

function mostrarMensaje(mensaje) {
  toast.textContent = mensaje;
  toast.classList.add("show");

  clearTimeout(temporizador);

  temporizador = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function dibujarTablero() {
  const busqueda = buscador.value.replace(/\D/g, "");
  const tipoOrden = orden.value;

  let lista = CANTIDADES.map((cantidad, indice) => ({
    cantidad,
    indice
  }));

  if (busqueda) {
    lista = lista.filter(item =>
      String(item.cantidad).includes(busqueda)
    );
  }

  if (tipoOrden === "asc") {
    lista.sort((a, b) =>
      a.cantidad - b.cantidad || a.indice - b.indice
    );
  }

  if (tipoOrden === "desc") {
    lista.sort((a, b) =>
      b.cantidad - a.cantidad || a.indice - b.indice
    );
  }

  tablero.replaceChildren();

  if (lista.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.className = "empty";
    mensaje.textContent = "No encontramos esa cantidad.";
    tablero.appendChild(mensaje);
  }

  lista.forEach(({ cantidad, indice }) => {
    const estaMarcada = completadas.has(indice);

    const casilla = document.createElement("button");
    casilla.type = "button";
    casilla.className =
      "amount-card" + (estaMarcada ? " is-checked" : "");

    casilla.setAttribute("aria-pressed", String(estaMarcada));
    casilla.setAttribute(
      "aria-label",
      dinero(cantidad) +
      (estaMarcada ? ", ahorrado" : ", pendiente")
    );

    const cantidadTexto = document.createElement("span");
    cantidadTexto.className = "amount";
    cantidadTexto.textContent = cantidad;

    casilla.appendChild(cantidadTexto);

    casilla.addEventListener("click", () => {
      if (completadas.has(indice)) {
        completadas.delete(indice);
        mostrarMensaje(dinero(cantidad) + " desmarcados.");
      } else {
        completadas.add(indice);
        mostrarMensaje(dinero(cantidad) + " ahorrados. ♡");
      }

      guardarProgreso();
      dibujarTablero();
      actualizarResumen();
    });

    tablero.appendChild(casilla);
  });

  totalCasillas.textContent = CANTIDADES.length;
}

function actualizarResumen() {
  const ahorrado = calcularTotal();
  const falta = Math.max(0, META - ahorrado);
  const progreso = Math.min(100, (ahorrado / META) * 100);

  totalAhorrado.textContent = dinero(ahorrado);
  barra.style.width = progreso + "%";

  porcentaje.textContent =
    Math.round(progreso) + "% completado";

  restante.textContent = falta === 0
    ? "¡Meta alcanzada! ♡"
    : "Faltan " + dinero(falta);

  marcadas.textContent = completadas.size;

  if (ahorrado >= META) {
    mostrarMensaje("¡Felicidades! Alcanzaste C$10,000. ♡");
  }
}

buscador.addEventListener("input", dibujarTablero);
orden.addEventListener("change", dibujarTablero);

botonReiniciar.addEventListener("click", () => {
  if (typeof dialogo.showModal === "function") {
    dialogo.showModal();
  } else if (confirm("¿Quieres reiniciar todo tu reto?")) {
    completadas.clear();
    guardarProgreso();
    dibujarTablero();
    actualizarResumen();
  }
});

confirmar.addEventListener("click", () => {
  completadas.clear();
  guardarProgreso();
  dibujarTablero();
  actualizarResumen();
  mostrarMensaje("Reto reiniciado. ¡A comenzar de nuevo!");
});

// Comprobar que las casillas sumen exactamente la meta.
const suma = CANTIDADES.reduce((a, b) => a + b, 0);

if (suma !== META) {
  console.error("Revisa las cantidades: la suma no es C$10,000.");
}

dibujarTablero();
actualizarResumen();
