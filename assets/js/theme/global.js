import { once } from 'lodash';
import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from '../page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import cartPreview from './global/cart-preview';
import maintenanceMode from './global/maintenanceMode';
import carousel from './common/carousel';
import svgInjector from './global/svg-injector';

// papathemes added
import papathemes from '../papathemes/theme';
import beautify from '../beautify/global';

function quickView(context) {
    const load = once(() => {
        import('./global/quick-view').then(module => {
            module.default(context);
        });
    });

    $(window).one('scroll', load);
    $(document).one('touchstart mouseenter', load);
    setTimeout(load, window.supermarketThemeExtraConfig.delayJS);
}

export default class Global extends PageManager {
    onReady() {
        const {
            cartId,
        } = this.context;
        cartPreview(this.context.secureBaseUrl, this.context.cartId);
        quickSearch();
        currencySelector(cartId);
        foundation($(document));
        quickView(this.context);
        carousel();
        menu();
        mobileMenuToggle();
        maintenanceMode(this.context.maintenanceMode);
        papathemes(this.context); // papathemes added
        svgInjector();
        beautify(this.context);
    }
}
