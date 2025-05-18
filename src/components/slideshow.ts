class SlideshowComponent extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

const template = document.createElement("template");
template.innerHTML = `
<link rel="stylesheet" href="${import.meta.resolve("./slideshow.css")}">
<div class="container">
  <div class="items>
    <slot></slot>
  </div>
  <div class="scroll">
  </div>
</div>
`;

export function registerSlideshowComponent() {
  customElements.define("wf-slideshow", SlideshowComponent);
}
