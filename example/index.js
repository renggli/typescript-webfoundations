import { registerCarouselComponent } from '../components/carousel.js';
import { registerSlideshowComponent } from '../components/slideshow.js';
import { registerTileComponent } from '../components/tile.js';

const app = () => {
  registerCarouselComponent();
  registerSlideshowComponent();
  registerTileComponent();
}
document.addEventListener('DOMContentLoaded', app);
