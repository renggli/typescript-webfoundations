import { registerCarouselComponent } from "../components/carousel.js";
import { registerSlideshowComponent } from "../components/slideshow.js";
import { registerTileComponent } from "../components/tile.js";
import * as dom from "../dom.js";

const app = () => {
  registerCarouselComponent();
  registerSlideshowComponent();
  registerTileComponent();

  (window as any).dom = dom;
};
document.addEventListener("DOMContentLoaded", app);
