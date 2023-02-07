/*
 Import all product specific js
 */
import PageManager from '../page-manager';
import Review from './product/reviews';
import collapsibleFactory from './common/collapsible';
import ProductDetails from './common/product-details';
import videoGallery from './product/video-gallery';
import { classifyForm } from './common/utils/form-utils';
// import { autoExpandCategoryMenu } from '../papathemes/theme-utils'; // Supermarket

export default class Product extends PageManager {
    constructor(context) {
        super(context);
        this.url = window.location.href;
        this.$reviewLink = $('[data-reveal-id="modal-review-form"]');
        this.$bulkPricingLink = $('[data-reveal-id="modal-bulk-pricing"]');
    }

    onReady() {
        // autoExpandCategoryMenu(this.context); // Supermarket

        // Listen for foundation modal close events to sanitize URL after review.
        $(document).on('close.fndtn.reveal', () => {
            if (this.url.indexOf('#write_review') !== -1 && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, document.title, window.location.pathname);
            }
        });

        let validator;

        // Init collapsible
        collapsibleFactory();

        this.productDetails = new ProductDetails($('.productView-scope'), this.context, window.BCData.product_attributes); // Supermarket Mod
        this.productDetails.setProductVariant();

        videoGallery();

        const $reviewForm = classifyForm('.writeReview-form');
        const review = new Review($reviewForm);

        $('body').on('click', '[data-reveal-id="modal-review-form"]', () => {
            validator = review.registerValidation(this.context);
        });

        $reviewForm.on('submit', () => {
            if (validator) {
                validator.performCheck();
                return validator.areAll('valid');
            }

            return false;
        });

        this.productReviewHandler();
        this.bulkPricingHandler();
        loadCurrentRelatedProduct();

        $('.productView .option_box .productOptionBox .product-container .select-down-arrow .down-arrow').click(function(){
            console.log("clicked");
            if($(this).hasClass("is-open")){
                $(this).removeClass("is-open");
                $(this).parents('.productOptionBox').find(".dropdown-box-container").removeClass("is-open");
            }else{
                $(this).addClass("is-open");
                $(this).parents('.productOptionBox').find(".dropdown-box-container").addClass("is-open");
            }
        });

        $('#tab-videos .videoGallery-item').click(function(e){
            e.preventDefault();
            console.log("Play button");
            if($(window).width() > 1023) {
                $('html, body').animate({
                    scrollTop: $('#tab-videos').offset().top - 60
                }, 800);
            } else {
                $('html, body').animate({
                    scrollTop: $('#tab-videos').offset().top - 100
                }, 800);
            }
            
        });

        $('.playbutton-container').click(function(e){
            e.preventDefault();
            console.log("Play button");
            $('html, body').animate({
                scrollTop: $('#tab-videos').offset().top
            }, 800);
        });
    }

    productReviewHandler() {
        if (this.url.indexOf('#write_review') !== -1) {
            this.$reviewLink.trigger('click');
        }
    }

    bulkPricingHandler() {
        if (this.url.indexOf('#bulk_pricing') !== -1) {
            this.$bulkPricingLink.trigger('click');
        }
    }
}
