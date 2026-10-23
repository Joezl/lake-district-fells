export default async function install(app) {
  const mount = app.getMount("fell-color-ramp");
  const layer = app.layers[app.config.layerId];
  app.assert(layer, "LakeDistrictFells is not on the map.");
  await layer.load();

  const palettes = {
    "blue-red": { label: "Blue to red", colors: ["#2166ac", "#f7f7f7", "#b2182b"] },
    "blue-yellow-red": { label: "Blue, yellow, red", colors: ["#2c7bb6", "#ffffbf", "#d7191c"] },
    "purple-orange": { label: "Purple to orange", colors: ["#5e3c99", "#f7f7f7", "#e66101"] },
    "green-magenta": { label: "Green to magenta", colors: ["#1b7837", "#f7f7f7", "#762a83"] },
    "viridis": { label: "Viridis", colors: ["#440154", "#21918c", "#fde725"] }
  };

  const wrapper = document.createElement("div");
  wrapper.style.display = "grid";
  wrapper.style.gap = "12px";
  wrapper.style.padding = "4px";

  const intro = document.createElement("p");
  intro.textContent = "Choose a ramp for prominence. Triangle size continues to represent height.";
  intro.style.margin = "0";
  intro.style.color = "var(--app-text-muted)";
  intro.style.fontSize = "0.9rem";

  const label = document.createElement("label");
  label.textContent = "Color ramp";
  label.style.fontWeight = "600";

  const select = document.createElement("calcite-select");
  select.setAttribute("label", "Prominence color ramp");
  select.setAttribute("width", "full");
  for (const [value, palette] of Object.entries(palettes)) {
    const option = document.createElement("calcite-option");
    option.value = value;
    option.textContent = palette.label;
    if (value === "blue-red") option.selected = true;
    select.append(option);
  }

  const samples = document.createElement("div");
  samples.setAttribute("aria-label", "Color ramp samples");
  samples.style.display = "grid";
  samples.style.gap = "8px";

  const status = document.createElement("div");
  status.setAttribute("role", "status");
  status.style.fontSize = "0.82rem";
  status.style.color = "var(--app-text-dim)";

  function applyPalette(key) {
    const palette = palettes[key];
    if (!palette) return;
    const renderer = layer.renderer.clone();
    const variables = (renderer.visualVariables || []).map((variable) => {
      const copy = variable.clone();
      if (copy.type === "color" && copy.field === app.config.prominenceField) {
        copy.stops = [
          { value: app.config.min, color: palette.colors[0], label: `${app.config.min} m` },
          { value: app.config.mid, color: palette.colors[1], label: `${Math.round(app.config.mid)} m` },
          { value: app.config.max, color: palette.colors[2], label: `${Math.round(app.config.max)} m` }
        ];
      }
      return copy;
    });
    renderer.visualVariables = variables;
    layer.renderer = renderer;
    select.value = key;
    status.textContent = `${palette.label} applied to prominence.`;
    for (const child of samples.children) {
      child.style.outline = child.dataset.key === key ? "2px solid var(--app-accent)" : "1px solid var(--app-border)";
    }
  }

  for (const [key, palette] of Object.entries(palettes)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.key = key;
    button.setAttribute("aria-label", `Apply ${palette.label} ramp`);
    button.style.display = "grid";
    button.style.gridTemplateColumns = "1fr auto";
    button.style.alignItems = "center";
    button.style.gap = "10px";
    button.style.padding = "8px";
    button.style.border = "0";
    button.style.borderRadius = "var(--app-radius)";
    button.style.background = "var(--app-surface-raised)";
    button.style.cursor = "pointer";
    button.style.textAlign = "left";
    button.style.color = "var(--app-text)";

    const ramp = document.createElement("span");
    ramp.style.display = "block";
    ramp.style.height = "22px";
    ramp.style.borderRadius = "4px";
    ramp.style.background = `linear-gradient(90deg, ${palette.colors.join(", ")})`;
    ramp.style.border = "1px solid var(--app-border-subtle)";

    const name = document.createElement("span");
    name.textContent = palette.label;
    name.style.fontSize = "0.82rem";
    button.append(ramp, name);
    const click = () => applyPalette(key);
    button.addEventListener("click", click);
    app.onCleanup(() => button.removeEventListener("click", click));
    samples.append(button);
  }

  const onSelect = (event) => applyPalette(event.target.value);
  select.addEventListener("calciteSelectChange", onSelect);
  app.onCleanup(() => select.removeEventListener("calciteSelectChange", onSelect));

  label.append(select);
  wrapper.append(intro, label, samples, status);
  mount.replaceChildren(wrapper);
  applyPalette("blue-red");
  app.onCleanup(() => mount.replaceChildren());
}