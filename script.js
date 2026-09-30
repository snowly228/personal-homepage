const CONTACT_EMAIL = "chenyouxue@mail.ustc.edu.cn";

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll(".nav a")];

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function closeMenu() {
  nav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const willOpen = !nav.classList.contains("is-open");
  nav.classList.toggle("is-open", willOpen);
  menuToggle.setAttribute("aria-expanded", String(willOpen));
  menuToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
  document.body.classList.toggle("menu-open", willOpen);
});

navLinks.forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => revealObserver.observe(element));

const trackedSections = [...document.querySelectorAll("main section[id]")];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
    });
  });
}, { rootMargin: "-35% 0px -55% 0px" });
trackedSections.forEach((section) => sectionObserver.observe(section));

const filters = [...document.querySelectorAll("[data-filter]")];
const projects = [...document.querySelectorAll("[data-category]")];

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;
    filters.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    projects.forEach((project) => {
      const categories = project.dataset.category.split(" ");
      project.hidden = selected !== "all" && !categories.includes(selected);
    });
  });
});

const form = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const subject = encodeURIComponent(`Portfolio message from ${data.get("name")}`);
  const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`);
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();

document.querySelectorAll(".robogame-photo img").forEach((image) => {
  image.addEventListener("error", () => {
    image.closest(".robogame-photo")?.classList.add("image-pending");
    image.remove();
  });
});

const canvas = document.querySelector("#lattice-canvas");
const stage = document.querySelector("[data-lattice-stage]");
const context = canvas.getContext("2d");
let pointer = { x: -1000, y: -1000 };
let latticeSize = { width: 0, height: 0, scale: 1 };

function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  latticeSize = { width: rect.width, height: rect.height, scale };
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  drawLattice();
}

function nodePosition(column, row, spacingX, spacingY) {
  const baseX = column * spacingX - spacingX;
  const baseY = row * spacingY - spacingY;
  const distance = Math.hypot(baseX - pointer.x, baseY - pointer.y);
  const influence = Math.max(0, 1 - distance / 170);
  const angle = Math.atan2(baseY - pointer.y, baseX - pointer.x);
  return {
    x: baseX + Math.cos(angle) * influence * 20,
    y: baseY + Math.sin(angle) * influence * 20,
    influence
  };
}

function drawLattice() {
  const { width, height } = latticeSize;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#17201e";
  context.fillRect(0, 0, width, height);

  const spacingX = width < 600 ? 58 : 74;
  const spacingY = spacingX * 0.86;
  const columns = Math.ceil(width / spacingX) + 3;
  const rows = Math.ceil(height / spacingY) + 3;
  const nodes = [];

  for (let row = 0; row < rows; row += 1) {
    nodes[row] = [];
    for (let column = 0; column < columns; column += 1) {
      const offset = row % 2 ? spacingX / 2 : 0;
      nodes[row][column] = nodePosition(column, row, spacingX, spacingY);
      nodes[row][column].x += offset;
    }
  }

  context.lineWidth = 1.15;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const current = nodes[row][column];
      const neighbors = [];
      if (column + 1 < columns) neighbors.push(nodes[row][column + 1]);
      if (row + 1 < rows) {
        neighbors.push(nodes[row + 1][column]);
        if (row % 2 === 0 && column > 0) neighbors.push(nodes[row + 1][column - 1]);
        if (row % 2 === 1 && column + 1 < columns) neighbors.push(nodes[row + 1][column + 1]);
      }
      neighbors.forEach((neighbor) => {
        const active = Math.max(current.influence, neighbor.influence);
        context.strokeStyle = active > 0.2 ? `rgba(230, 91, 69, ${0.45 + active * 0.5})` : "rgba(244, 241, 233, .24)";
        context.beginPath();
        context.moveTo(current.x, current.y);
        context.lineTo(neighbor.x, neighbor.y);
        context.stroke();
      });
    }
  }

  nodes.flat().forEach((node) => {
    context.fillStyle = node.influence > 0.2 ? "#e65b45" : "#f4f1e9";
    context.beginPath();
    context.arc(node.x, node.y, node.influence > 0.2 ? 2.8 : 1.6, 0, Math.PI * 2);
    context.fill();
  });
}

stage.addEventListener("pointermove", (event) => {
  const rect = stage.getBoundingClientRect();
  pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  drawLattice();
});
stage.addEventListener("pointerleave", () => {
  pointer = { x: -1000, y: -1000 };
  drawLattice();
});
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const tireCanvas = document.querySelector("#tire-canvas");
const tireStage = document.querySelector("[data-tire-stage]");

if (tireCanvas && tireStage) {
  const tireContext = tireCanvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tirePointer = { x: -1000, y: -1000, active: false };
  let tireSize = { width: 0, height: 0, scale: 1 };
  let animationFrame = 0;

  function drawEllipse(x, y, radiusX, radiusY) {
    tireContext.beginPath();
    tireContext.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  }

  function angularDistance(first, second) {
    return Math.abs(Math.atan2(Math.sin(first - second), Math.cos(first - second)));
  }

  function drawTire(time = 0) {
    const { width, height } = tireSize;
    if (!width || !height) return;

    tireContext.clearRect(0, 0, width, height);
    const backdrop = tireContext.createLinearGradient(0, 0, width, height);
    backdrop.addColorStop(0, "#06080e");
    backdrop.addColorStop(.52, "#0b1520");
    backdrop.addColorStop(1, "#04070b");
    tireContext.fillStyle = backdrop;
    tireContext.fillRect(0, 0, width, height);

    tireContext.strokeStyle = "rgba(96, 205, 255, .07)";
    tireContext.lineWidth = 1;
    const grid = width < 600 ? 38 : 56;
    for (let x = -height; x < width + height; x += grid) {
      tireContext.beginPath();
      tireContext.moveTo(x, 0);
      tireContext.lineTo(x + height * .7, height);
      tireContext.stroke();
    }
    for (let y = 0; y < height; y += grid) {
      tireContext.beginPath();
      tireContext.moveTo(0, y);
      tireContext.lineTo(width, y);
      tireContext.stroke();
    }

    const center = {
      x: width * (width < 600 ? .5 : .51),
      y: height * (width < 600 ? .44 : .46)
    };
    const outerRadius = Math.min(width * (width < 600 ? .37 : .25), height * .35, 248);
    const outerY = outerRadius * .92;
    const innerRadius = outerRadius * .55;
    const innerY = outerY * .55;
    const depth = Math.max(20, outerRadius * .14);
    const tilt = -.13;
    const pointerAngle = tirePointer.active
      ? Math.atan2(tirePointer.y - center.y, tirePointer.x - center.x) - tilt
      : 1.08 + Math.sin(time * .00032) * .25;
    const pointerDistance = tirePointer.active
      ? Math.hypot(tirePointer.x - center.x, tirePointer.y - center.y)
      : outerRadius;
    const pointerInfluence = tirePointer.active ? Math.max(0, 1 - Math.abs(pointerDistance - outerRadius) / 170) : .28;

    const ambientGlow = tireContext.createRadialGradient(center.x, center.y, outerRadius * .25, center.x, center.y, outerRadius * 1.65);
    ambientGlow.addColorStop(0, "rgba(37, 232, 255, .16)");
    ambientGlow.addColorStop(.56, "rgba(127, 53, 255, .1)");
    ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    tireContext.fillStyle = ambientGlow;
    tireContext.fillRect(0, 0, width, height);

    const contactY = center.y + outerY + depth * .62;
    const contactGlow = tireContext.createRadialGradient(center.x, contactY, 2, center.x, contactY, outerRadius * .62);
    contactGlow.addColorStop(0, "rgba(255, 54, 179, .72)");
    contactGlow.addColorStop(.42, "rgba(34, 229, 255, .28)");
    contactGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    tireContext.fillStyle = contactGlow;
    drawEllipse(center.x, contactY, outerRadius * .68, Math.max(16, outerRadius * .12));
    tireContext.fill();

    tireContext.save();
    tireContext.translate(center.x, center.y);
    tireContext.rotate(tilt);

    for (let layer = depth; layer >= 0; layer -= 3) {
      const offsetX = layer * .78;
      const offsetY = -layer * .18;
      const shade = 12 + Math.round((1 - layer / depth) * 16);
      tireContext.strokeStyle = `rgb(${shade}, ${shade + 4}, ${shade + 8})`;
      tireContext.lineWidth = 5;
      drawEllipse(offsetX, offsetY, outerRadius, outerY);
      tireContext.stroke();
    }

    const ring = new Path2D();
    ring.ellipse(0, 0, outerRadius, outerY, 0, 0, Math.PI * 2);
    ring.ellipse(0, 0, innerRadius, innerY, 0, 0, Math.PI * 2);
    const rubber = tireContext.createRadialGradient(-outerRadius * .22, -outerY * .3, innerRadius * .4, 0, 0, outerRadius);
    rubber.addColorStop(0, "#59616a");
    rubber.addColorStop(.42, "#242a31");
    rubber.addColorStop(.78, "#101419");
    rubber.addColorStop(1, "#05070a");
    tireContext.fillStyle = rubber;
    tireContext.fill(ring, "evenodd");

    const treadCount = width < 600 ? 34 : 46;
    for (let step = 0; step < treadCount; step += 1) {
      const angle = (step / treadCount) * Math.PI * 2;
      const spread = Math.PI * 2 / treadCount * .32;
      const innerTread = outerRadius * .79;
      const outerTread = outerRadius * .965;
      const localInfluence = Math.max(0, 1 - angularDistance(angle, pointerAngle) / .62) * pointerInfluence;
      const colorCycle = (step + Math.floor(time * .006)) % 3;
      const activeColor = colorCycle === 0 ? "47, 240, 255" : colorCycle === 1 ? "255, 55, 181" : "255, 184, 45";

      tireContext.beginPath();
      tireContext.moveTo(Math.cos(angle - spread) * innerTread, Math.sin(angle - spread) * innerTread * .92);
      tireContext.lineTo(Math.cos(angle - spread * .35) * outerTread, Math.sin(angle - spread * .35) * outerTread * .92);
      tireContext.lineTo(Math.cos(angle + spread) * outerTread, Math.sin(angle + spread) * outerTread * .92);
      tireContext.lineTo(Math.cos(angle + spread * .35) * innerTread, Math.sin(angle + spread * .35) * innerTread * .92);
      tireContext.closePath();
      tireContext.fillStyle = localInfluence > .02 ? `rgba(${activeColor}, ${.22 + localInfluence * .6})` : step % 2 ? "#171c22" : "#20262d";
      tireContext.fill();
      tireContext.strokeStyle = localInfluence > .02 ? `rgba(${activeColor}, ${.5 + localInfluence * .5})` : "rgba(130, 148, 158, .25)";
      tireContext.lineWidth = localInfluence > .02 ? 1.8 : .8;
      tireContext.stroke();
    }

    [outerRadius * .7, outerRadius * .755, outerRadius * .79].forEach((radius, index) => {
      tireContext.strokeStyle = index === 1 ? "rgba(47, 240, 255, .26)" : "rgba(210, 224, 230, .14)";
      tireContext.lineWidth = index === 1 ? 2 : 1;
      drawEllipse(0, 0, radius, radius * .92);
      tireContext.stroke();
    });

    const rimGradient = tireContext.createRadialGradient(-innerRadius * .3, -innerY * .38, 4, 0, 0, innerRadius);
    rimGradient.addColorStop(0, "#f7fbff");
    rimGradient.addColorStop(.22, "#8fa4b2");
    rimGradient.addColorStop(.58, "#26333d");
    rimGradient.addColorStop(1, "#080d12");
    tireContext.fillStyle = rimGradient;
    drawEllipse(0, 0, innerRadius * .94, innerY * .94);
    tireContext.fill();
    tireContext.strokeStyle = "rgba(82, 232, 255, .72)";
    tireContext.lineWidth = 2;
    tireContext.stroke();

    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = spoke / 6 * Math.PI * 2 + time * .00012;
      tireContext.save();
      tireContext.rotate(angle);
      const spokeGradient = tireContext.createLinearGradient(0, 0, innerRadius * .82, 0);
      spokeGradient.addColorStop(0, "#dceaf1");
      spokeGradient.addColorStop(.5, "#657786");
      spokeGradient.addColorStop(1, "#17232c");
      tireContext.fillStyle = spokeGradient;
      tireContext.beginPath();
      tireContext.moveTo(innerRadius * .12, -innerRadius * .09);
      tireContext.lineTo(innerRadius * .78, -innerRadius * .16);
      tireContext.lineTo(innerRadius * .82, innerRadius * .05);
      tireContext.lineTo(innerRadius * .16, innerRadius * .11);
      tireContext.closePath();
      tireContext.fill();
      tireContext.restore();
    }

    const hub = tireContext.createRadialGradient(-8, -8, 2, 0, 0, innerRadius * .23);
    hub.addColorStop(0, "#ffffff");
    hub.addColorStop(.34, "#8eeeff");
    hub.addColorStop(.7, "#33434d");
    hub.addColorStop(1, "#0a0d11");
    tireContext.fillStyle = hub;
    drawEllipse(0, 0, innerRadius * .23, innerY * .23);
    tireContext.fill();

    const stressColors = ["#2ff0ff", "#ff37b5", "#ffb82d"];
    stressColors.forEach((color, index) => {
      tireContext.strokeStyle = color;
      tireContext.globalAlpha = .76 - index * .12;
      tireContext.lineWidth = 3.6 - index * .7;
      tireContext.shadowColor = color;
      tireContext.shadowBlur = 14;
      tireContext.beginPath();
      tireContext.ellipse(0, 0, outerRadius * (1.015 - index * .045), outerY * (1.015 - index * .045), 0, pointerAngle - .58 - index * .2, pointerAngle + .62 + index * .15);
      tireContext.stroke();
    });
    tireContext.globalAlpha = 1;
    tireContext.shadowBlur = 0;

    tireContext.strokeStyle = "rgba(226, 240, 246, .22)";
    tireContext.lineWidth = 1;
    tireContext.setLineDash([2, 8]);
    drawEllipse(0, 0, outerRadius * 1.08, outerY * 1.08);
    tireContext.stroke();
    tireContext.setLineDash([]);
    tireContext.restore();

    if (tirePointer.active) {
      const markerGlow = tireContext.createRadialGradient(tirePointer.x, tirePointer.y, 1, tirePointer.x, tirePointer.y, 42);
      markerGlow.addColorStop(0, "rgba(255, 255, 255, .9)");
      markerGlow.addColorStop(.18, "rgba(47, 240, 255, .52)");
      markerGlow.addColorStop(1, "rgba(47, 240, 255, 0)");
      tireContext.fillStyle = markerGlow;
      tireContext.beginPath();
      tireContext.arc(tirePointer.x, tirePointer.y, 42, 0, Math.PI * 2);
      tireContext.fill();
    }

    tireContext.fillStyle = "rgba(185, 221, 232, .52)";
    tireContext.font = "10px Inter, Segoe UI, sans-serif";
    tireContext.fillText("NONLINEAR CONTACT / FULL-FIELD RESPONSE", 24, 34);
    tireContext.textAlign = "right";
    tireContext.fillText("LOAD PATH  ·  WEAR  ·  DEFORMATION", width - 24, 34);
    tireContext.textAlign = "left";
  }

  function resizeTire() {
    const rect = tireStage.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    tireSize = { width: rect.width, height: rect.height, scale };
    tireCanvas.width = Math.round(rect.width * scale);
    tireCanvas.height = Math.round(rect.height * scale);
    tireContext.setTransform(scale, 0, 0, scale, 0, 0);
    drawTire(performance.now());
  }

  tireStage.addEventListener("pointermove", (event) => {
    const rect = tireStage.getBoundingClientRect();
    tirePointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
    if (reducedMotion) drawTire(performance.now());
  });
  tireStage.addEventListener("pointerleave", () => {
    tirePointer = { x: -1000, y: -1000, active: false };
    if (reducedMotion) drawTire(performance.now());
  });
  window.addEventListener("resize", resizeTire);
  resizeTire();

  if (!reducedMotion) {
    const animateTire = (time) => {
      drawTire(time);
      animationFrame = window.requestAnimationFrame(animateTire);
    };
    animationFrame = window.requestAnimationFrame(animateTire);
    window.addEventListener("pagehide", () => window.cancelAnimationFrame(animationFrame), { once: true });
  }
}
