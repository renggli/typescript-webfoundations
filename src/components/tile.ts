class TileComponent extends HTMLElement {
  static observedAttributes = ["width", "height", "background"];

  private container: HTMLDivElement;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(template.content.cloneNode(true));
    this.container = shadowRoot.querySelector(".container")!;
  }

  public attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    switch (name) {
      case "width":
        this.container.style.setProperty("width", newValue);
        break;
      case "height":
        this.container.style.setProperty("height", newValue);
        break;
      case "background":
        this.container.style.setProperty(
          "background-image",
          newValue ? `url("${encodeURI(newValue)}")` : null
        );
        break;
    }
  }
}

const template = document.createElement("template");
template.innerHTML = `
  <link rel="stylesheet" href="${import.meta.resolve("./tile.css")}">
  <div class="container">
    <slot></slot>
  <div>
`;

export function registerTileComponent() {
  customElements.define("wf-tile", TileComponent);
}
