import { registerCarouselComponent } from '../src/components/carousel.js';
import { registerSlideshowComponent } from '../src/components/slideshow.js';
import { registerTileComponent } from '../src/components/tile.js';
import * as dom from '../src/dom.js';

const app = () => {
  registerCarouselComponent();
  registerSlideshowComponent();
  registerTileComponent();

  (window as any).dom = dom;
}
document.addEventListener('DOMContentLoaded', app);
