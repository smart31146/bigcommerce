import _ from 'lodash';
import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';
import ProductDetails from '../common/product-details';
import { defaultModal } from './modal';
import 'slick-carousel';

export default function (context) {
    // Supermarket - Instantload feature
    if (context.instantload) {
        return;
    }

    const modal = defaultModal();

    // supermarket add .quickview-alt to support Choose Options show quickview
    $('body').on('click', '.quickview, .quickview-alt', event => {
        event.preventDefault();

        const productId = $(event.currentTarget).data('productId');

        modal.open({ size: 'large' });

        // papathemes-beautify
        const config = {
            product: {
                videos: context.productpage_videos_count,
                reviews: context.productpage_reviews_count,
            },
        };

        utils.api.product.getById(productId, { template: 'products/quick-view', config }, (err, response) => {
            modal.updateContent(response);

            modal.$content.find('.productView').addClass('productView--quickView');

            modal.$content.find('[data-slick]').slick();

            // Papathemes Also Bought MOD {{{
            const $quickView = modal.$content.find('.quickView');
            let product;
            if ($('[data-also-bought] .productView-alsoBought-item', $quickView).length > 0) {
                product = new ProductDetails($quickView, _.extend(context, { enableAlsoBought: true }));
            } else {
                product = new ProductDetails($quickView, context);
            }

            $('body').trigger('loaded.quickview', [product]);

            return product;
            // }}}
        });
    });
}
