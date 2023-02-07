import _, { indexOf } from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import collapsibleFactory, { CollapsibleEvents } from '../theme/common/collapsible';
import ProductDetails from '../theme/common/product-details';
import scrollToElement from 'scroll-to-element';
import { currencyFormat, extractMoney } from './utils';
import { defaultModal } from '../theme/global/modal';
import swal from 'sweetalert2';
import Mustache from 'mustache';
//
// https://javascript.info/task/delay-promise
//
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//
// https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
//
function promiseSerial(funcs) {
    return funcs.reduce(
        (promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))),
        Promise.resolve([]),
    );
}

function reportFormValidity(form) {
    let valid = true;
    if (form && form.checkValidity) {
        valid = form.checkValidity();
        if (!valid) {
            if (form.reportValidity) {
                form.reportValidity();
            } else {
                valid = true;
            }
        }
    }
    return valid;
}

export default class AlsoBought {
    constructor(parentProductDetails, {
        thumbnailTemplate = `
            <div class="productView-alsoBought-thumbnail-item {{#checked}}is-checked{{/checked}}" data-thumbnail-product-id="{{id}}">
                <div class="productView-alsoBought-item-image">
                    <a class="productView-alsoBought-thumbnail-label" href="{{url}}" target="_blank"><img class="lazyload" src="{{loadingImg}}" data-src="{{img}}" alt="{{name}}" title="{{name}}"></a>    
                </div>                
            </div>`,
        productDetailsTemplate = `
            <div class="productView-alsoBought-item-inner">
                <div class="productView-alsoBought-item-check">
                    <div class="form-field">
                        <input
                            class="form-checkbox"
                            type="checkbox" 
                            name="productView-alsoBought-item-checkbox"
                            id="productView-alsoBought-item-checkbox-{{id}}"
                            value="{{id}}"
                            {{#checked}}checked{{/checked}}
                            data-also-bought-checkbox>
                        <label class="form-label {{#checked}}is-checked{{/checked}}" for="productView-alsoBought-item-checkbox-{{id}}">
                            <div class="productView-alsoBought-item-title">{{name}}</div>
                            <div class="productView-alsoBought-item-price">
                                {{&loginPriceHtml}}
                                {{&priceHtml}}
                                {{&priceRangeHtml}}
                            </div>

                            {{&optionsToggleHtml}}
                        </label>
                        

                        <div class="form-increment" data-quantity-change> 
                            <input type="tel" class="qty-form-input" product-id="{{id}}" value="1"/>
                                <div class="buttons_box">
                                <button class="button button--icon" data-action="inc">
                                <span class="is-srOnly">Increase Quantity:</span>
                                <i class="icon" aria-hidden="true">
                                    <svg>
                                        <use xlink:href="#icon-add"></use>
                                    </svg>
                                </i>
                                </button>
                                <button class="button button--icon" data-action="dec">
                                <span class="is-srOnly">Decrease Quantity:</span>
                                <i class="icon" aria-hidden="true">
                                    <svg>
                                        <use xlink:href="#icon-remove"></use>
                                    </svg>
                                </i>
                                </button>
                            </div>                                
                        </div>
                    </div>
                </div>
                <div class="productView-alsoBought-item-form" id="productView-alsoBought-item-form-{{id}}" data-product-content>
                    {{&formHtml}}
                </div>
            </div>
        `,
        priceTemplate = `
            <div class="price-section-group price-section-group--{{taxClassPrefix}}">
                <!-- Sale price -->
                <div class="price-section price-section--{{taxClassPrefix}} price-section--main">
                    <span class="price-label" {{#nonSalePrice}}style="display: none;"{{/nonSalePrice}}>
                        {{priceLabel}}
                    </span>
                    <span class="price-now-label" {{^nonSalePrice}}style="display: none;"{{/nonSalePrice}}>
                        {{salePriceLabel}}
                    </span>
                    <span data-product-price-{{taxDataPrefix}} class="price price--{{taxClassPrefix}} price--main">{{price.formatted}}</span>
                </div>
                <!-- Non-sale price -->
                <div class="price-section price-section--{{taxClassPrefix}} non-sale-price--{{taxClassPrefix}}" {{^nonSalePrice}}style="display: none;"{{/nonSalePrice}}>
                    <span class="price-was-label">{{nonSalePriceLabel}}</span>
                    <span data-product-non-sale-price-{{taxDataPrefix}} class="price price--non-sale">
                        {{nonSalePrice.formatted}}
                    </span>
                </div>
                <!-- Retail price -->
                {{&retailPriceHtml}}
                {{&taxLabelHtml}}
            </div>
        `,
        priceRangeTemplate = `
            <div class="price-section-group price-section-group--{{taxClassPrefix}}">
                <div class="price-section price-section--{{taxClassPrefix}} price-section--main">
                    <span class="price-label">{{priceLabel}}</span>
                    <span class="price-now-label" style="display: none;">{{salePriceLabel}}</span>
                    <span data-product-price-{{taxDataPrefix}} class="price price--{{taxClassPrefix}} price--main">{{priceRange.min.formatted}} - {{priceRange.max.formatted}}</span>
                    {{&taxLabelHtml}}
                </div>
                <div class="price-section price-section--{{taxClassPrefix}} non-sale-price--{{taxClassPrefix}}" style="display: none;">
                    <span class="price-was-label">{{nonSalePriceLabel}}</span>
                    <span data-product-non-sale-price-{{taxDataPrefix}} class="price price--non-sale">
                        {{nonSalePrice.formatted}}
                    </span>
                </div>
                {{&retailPriceRangeHtml}}
                {{&retailPriceHtml}}
            </div>
        `,
        taxLabelTemplate = `
            <abbr title="{{title}}">{{text}}</abbr>
        `,
        retailPriceRangeTemplate = `
            <div class="price-section price-section--{{taxClassPrefix}} rrp-price--{{taxClassPrefix}}">
                {{retailPriceLabel}}
                <span data-product-rrp-price-{{taxDataPrefix}} class="price price--rrp">{{retailPriceRange.min.with_tax.formatted}} - {{retailPriceRange.max.with_tax.formatted}}</span>
            </div>
        `,
        retailPriceTemplate = `
            <div class="price-section price-section--{{taxClassPrefix}} rrp-price--{{taxClassPrefix}}" {{^retailPrice}}style="display: none;{{/retailPrice}}">
                {{retailPriceLabel}}
                <span data-product-rrp-{{taxDataPrefix}} class="price price--rrp">
                    {{retailPrice.formatted}}
                </span>
            </div>
        `,
        loginPriceTemplate = `
            <a class="price--login" href="{{loginUrl}}" translate>{{loginForPriceTxt}}</a>
        `,
        optionsToggleTemplate = `
            <div class="productView-alsoBought-item-formToggle"><a href="#productView-alsoBought-item-form-{{id}}" data-options-collapsible>{{chooseOptionsTxt}} <i aria-hidden="true" class="icon"><svg><use xlink:href="#icon-chevron-down"></use></svg></i></a></div>
        `,
        simpleFormTemplate = `
            <form class="form form--addToCart" method="post" action="{{addToCartUrl}}" enctype="multipart/form-data" data-cart-item-add>
                <input type="hidden" name="action" value="add">
                <input type="hidden" name="product_id" value="{{id}}"/>
                <input type="hidden" name="qty[]" value="{{qty}}"/>
            </form>
        `,
        loadingTemplate = `
            <div class="loading"><img src="{{loadingImg}}" alt="loading"/></div>
        `,
        templateCustomTags = null,
    } = {}) {
        this.parentProductDetails = parentProductDetails;
        this.thumbnailTemplate = thumbnailTemplate;
        this.productDetailsTemplate = productDetailsTemplate;
        this.priceTemplate = priceTemplate;
        this.priceRangeTemplate = priceRangeTemplate;
        this.taxLabelTemplate = taxLabelTemplate;
        this.retailPriceRangeTemplate = retailPriceRangeTemplate;
        this.retailPriceTemplate = retailPriceTemplate;
        this.loginPriceTemplate = loginPriceTemplate;
        this.optionsToggleTemplate = optionsToggleTemplate;
        this.simpleFormTemplate = simpleFormTemplate;
        this.loadingTemplate = loadingTemplate;
        this.templateCustomTags = templateCustomTags;
        this.context = this.parentProductDetails.context;
        this.numberTexts = this.context.txtAlsoBoughtNumberArray.split(',');
        this.allNumberTexts = this.context.txtAlsoBoughtAllNumberArray.split(',');
        this.$alsoBoughtEl = $('[data-also-bought]', parentProductDetails.$productViewScope);
        this.config = this.$alsoBoughtEl.data('alsoBought') || {};
        this.moneyWithTax = this.config.samplePriceWithTax ? extractMoney(this.config.samplePriceWithTax, this.context.money) : null;
        this.moneyWithoutTax = this.config.samplePriceWithoutTax ? extractMoney(this.config.samplePriceWithoutTax, this.context.money) : null;

        // try to guess any price on the page
        this.moneyFallback = this.moneyWithTax || this.moneyWithoutTax
            // is default currency?
            || (this.context.activeCurrencyCode && this.context.activeCurrencyCode === this.context.defaultCurrencyCode ? this.context.money : null)
            // any price on the page
            || $('[data-product-price-without-tax], [data-product-price-with-tax]').get()
                .reduce((_money, el) => _money || extractMoney($(el).text()), null)
            // use currency code
            || (this.context.activeCurrencyCode ? {...this.context.money, currency_token: ` ${this.context.activeCurrencyCode} ` } : this.context.money);

        this.products = [];
        this.productNodes = [];
        this.onAddAllButtonClick = this.onAddAllButtonClick.bind(this);
        this.onAddSelectedButtonClick = this.onAddSelectedButtonClick.bind(this);

        const thumbSize = this.context.alsobought_thumbnail_size.split('x');

        this.thumbnailWidth = Number(thumbSize[0]) || 100;
        this.thumbnailHeight = Number(thumbSize[1]) || 100;

        this.retrieveAlsoBoughtProducts();

        $('[data-add-all]', this.$alsoBoughtEl).on('click', this.onAddAllButtonClick);
        $('[data-add-selected]', this.$alsoBoughtEl).on('click', this.onAddSelectedButtonClick);

        const that = this;

        $(document).on("click", '.productView-alsoBought [data-action="inc"]', function(){
            
            let value = parseInt($(this).parents('.form-increment').find(".qty-form-input").val());
            //$(this).parents('.form-increment').find(".qty-form-input").attr("value", value + 1);
            $(this).parents('.form-increment').find(".qty-form-input").val(value + 1);
            //console.log($(this).parents('.form-increment').find(".qty-form-input").attr("value"));
            let id = $(this).parents('.form-increment').find(".qty-form-input").attr('product-id');
            $("#productView-alsoBought-item-form-"+id+" [name='qty[]']").val(value + 1);
            //$("#productView-alsoBought-item-form-"+id+" [name='qty[]']").attr("value", value + 1);
            //console.log($("#productView-alsoBought-item-form-"+id+" [name='qty[]']"));
            let parentproduct = $(this).parents('.form-increment').find(".qty-form-input").attr('id');
            if (parentproduct == 'custom-parentproduct') {
                 //$('.parentproduct').attr("value", value + 1);
                 $('.parentproduct').val(value + 1);
            }

            that.updateTotalPrice();
        });

        $(document).on("click", '.productView-alsoBought [data-action="dec"]', function(){
            let value = parseInt($(this).parents('.form-increment').find(".qty-form-input").val());
            //console.log(value);
            //console.log("dec");
            if(value > 1){
                $(this).parents('.form-increment').find(".qty-form-input").val(value - 1);
                //$(this).parents('.form-increment').find(".qty-form-input").attr("value", value - 1);
                let id = $(this).parents('.form-increment').find(".qty-form-input").attr('product-id');
                //console.log($(this).parents('.form-increment').find(".qty-form-input").attr("value"));
                $("#productView-alsoBought-item-form-"+id+" [name='qty[]']").val(value - 1);
                //$("#productView-alsoBought-item-form-"+id+" [name='qty[]']").attr("value", value - 1);
                let parentproduct = $(this).parents('.form-increment').find(".qty-form-input").attr('id');
                //console.log($("#productView-alsoBought-item-form-"+id+" [name='qty[]']"));
                if (parentproduct == 'custom-parentproduct') {
                     $('.parentproduct').val(value - 1);
                }
            }
            that.updateTotalPrice();
        });

        $(document).on('change','.productView-alsoBought .qty-form-input',function(){
            // $(this).val($(this).val().replace(/[^0-9\.]/g,''));
            // $(this).val($(this).val().replace(/0/g,'1'));

            let qty = $(this).val();
            if(isNaN(Number($(this).val())) || Number($(this).val()) < 1 ){
                $(this).val('1');
                let id = $(this).attr('product-id');
                $("#productView-alsoBought-item-form-"+id+" [name='qty[]']").attr("value", '1');
            }else {
                let id = $(this).attr('product-id');
                $("#productView-alsoBought-item-form-"+id+" [name='qty[]']").attr("value", qty);
            }
            that.updateTotalPrice();
        });

    }

    currencyFormat(value) {
        
        if(this.moneyWithoutTax!=null)
        {
            this.moneyWithoutTax.decimal_places=2;
        }

        if(this.moneyFallback!=null)
        {
            this.moneyFallback.decimal_places=2;
        }
        
        return currencyFormat(value, (this.config.includeTax ? this.moneyWithTax : this.moneyWithoutTax) || this.moneyFallback);
    }

    retrieveAlsoBoughtProducts() {
        const $thumbnails = $('[data-thumbnails]', this.$alsoBoughtEl);
        const options = {
            template: {
                details: 'papathemes/also-bought/product-details',
                thumbnail: 'papathemes/also-bought/product-thumbnail',
            },
        };
        const $productEls = $('[data-product-id]', this.$alsoBoughtEl).not('[data-parent-product]');
        const productIds = $productEls.get().map(el => $(el).data('productId'));

        if ($productEls.length > 0) {
            this.$alsoBoughtEl.removeClass('u-hiddenVisually');

            $.ajax({
                url: '/graphql',
                method: 'POST',
                data: JSON.stringify({
                    query: `
                        query (
                            $productIds: [Int!],
                            $productsCount: Int,
                            ${!this.config.requireLogin ? `
                                $includeTax: Boolean,
                                $currencyCode: currencyCode,
                            ` : ''}
                                $imgWidth: Int!,
                            $imgHeight: Int!
                        ) {
                            site {
                                products (
                                    entityIds: $productIds,
                                    first: $productsCount,
                                    hideOutOfStock: true
                                ) {
                                    edges {
                                        node {
                                            entityId
                                            name
                                            path
                                            addToCartUrl
                                            minPurchaseQuantity
                                            defaultImage {
                                                url (
                                                    width: $imgWidth,
                                                    height: $imgHeight
                                                )
                                            }
                                            availabilityV2 {
                                                status
                                                ... on ProductUnavailable {
                                                    message
                                                }
                                            }
                                            ${!this.config.requireLogin ? `
                                                prices (
                                                    includeTax: $includeTax,
                                                    currencyCode: $currencyCode
                                                ) {
                                                    price {
                                                        ...MoneyFields
                                                    }
                                                    salePrice {
                                                        ...MoneyFields
                                                    }
                                                    basePrice {
                                                        ...MoneyFields
                                                    }
                                                    retailPrice {
                                                        ...MoneyFields
                                                    }
                                                    mapPrice {
                                                        ...MoneyFields
                                                    }
                                                    priceRange {
                                                        ...MoneyRangeFields
                                                    }
                                                    retailPriceRange {
                                                        ...MoneyRangeFields
                                                    }
                                                }
                                            ` : ''}
                                            productOptions (
                                                first: 1
                                            ) {
                                                edges {
                                                    node {
                                                        entityId
                                                        displayName
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        ${!this.config.requireLogin ? `
                            fragment MoneyFields on Money {
                                value
                                currencyCode
                            }
                            fragment MoneyRangeFields on MoneyRange {
                                min {
                                    ...MoneyFields
                                }
                                max {
                                    ...MoneyFields
                                }
                            }
                        ` : ''}
                    `,
                    variables: {
                        productIds,
                        productsCount: productIds.length,
                        includeTax: this.config.includeTax,
                        currencyCode: this.context.activeCurrencyCode,
                        imgWidth: this.thumbnailWidth,
                        imgHeight: this.thumbnailHeight,
                    }
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.context.graphQLToken}`,
                },
                xhrFields: {
                    withCredentials: true,
                },
                success: (resp) => {
                    resp.data.site.products.edges.forEach(({ node }) => {
                        // Don't show this product if it's unavailable
                        if (node.availabilityV2 && node.availabilityV2.status === 'Unavailable') {
                            return;
                        }

                        this.productNodes.push(node);

                        const id = node.entityId;
                        const name = node.name;
                        const url = node.path;
                        const addToCartUrl = node.addToCartUrl;
                        const qty = node.minPurchaseQuantity || 1;
                        const loadingImg = this.context.loadingImg;
                        const img = node.defaultImage.url || this.context.defaultProductImage;
                        const $productEl = $productEls.filter(`[data-product-id="${id}"]`);
                        const taxClassPrefix = this.config.includeTax ? 'withTax' : 'withoutTax';
                        const taxDataPrefix = this.config.includeTax ? 'with-tax' : 'without-tax';
                        const priceLabel = this.context.pdp_price_label;
                        const salePriceLabel = this.context.pdp_sale_price_label;
                        const nonSalePriceLabel = this.context.pdp_non_sale_price_label;
                        const retailPriceLabel = this.context.pdp_retail_price_label;
                        const chooseOptionsTxt = this.context.chooseOptionsTxt;
                        const loginForPriceTxt = this.context.loginForPriceTxt;
                        const loginUrl = this.context.loginUrl || '/login.php';
                        const checked = this.context.alsobought_checked;

                        const price = !this.config.requireLogin && node.prices.price
                            ? {
                                formatted: this.currencyFormat(node.prices.price.value),
                            } : null;

                        const nonSalePrice = !this.config.requireLogin && node.prices.basePrice && node.prices.price
                            && node.prices.basePrice.value !== node.prices.price.value
                            ? {
                                formatted: this.currencyFormat(node.prices.basePrice.value),
                            } : null;

                        const retailPrice = !this.config.requireLogin && node.prices.retailPrice
                            ? {
                                formatted: this.currencyFormat(node.prices.retailPrice.value),
                            }: null;

                        const priceRange = !this.config.requireLogin && node.prices.priceRange
                            && node.prices.priceRange.min.value != node.prices.priceRange.max.value
                            ? {
                                min: {
                                    formatted: this.currencyFormat(node.prices.priceRange.min.value),
                                },
                                max: {
                                    formatted: this.currencyFormat(node.prices.priceRange.max.value),
                                }
                            }
                            : null;

                        const retailPriceRange = !this.config.requireLogin && node.prices.retailPriceRange
                            && node.prices.retailPriceRange.min.value != node.prices.retailPriceRange.max.value 
                            ? {
                                min: {
                                    formatted: this.currencyFormat(node.prices.retailPriceRange.min.value),
                                },
                                max: {
                                    formatted: this.currencyFormat(node.prices.retailPriceRange.max.value),
                                },
                            }
                            : null;

                        const loginPriceHtml = this.config.requireLogin ? Mustache.render(this.loginPriceTemplate, {
                            loginUrl,
                            loginForPriceTxt,
                        }, null, this.templateCustomTags) : '';

                        const taxLabelHtml = this.config.showTaxLabel ? Mustache.render(this.taxLabelTemplate, {
                            title: this.config.includeTax ? this.context.includingTaxTxt : this.context.excludingTaxTxt,
                            text: this.config.includeTax ? this.context.priceWithTaxTxt : this.context.priceWithoutTaxTxt,
                        }, null, this.templateCustomTags) : '';

                        const retailPriceRangeHtml = retailPriceRange ? Mustache.render(this.retailPriceRangeTemplate, {
                            taxClassPrefix,
                            taxDataPrefix,
                            retailPriceLabel,
                            retailPriceRange,
                        }, null, this.templateCustomTags) : '';

                        const retailPriceHtml = !retailPriceRange ? Mustache.render(this.retailPriceTemplate, {
                            taxClassPrefix,
                            taxDataPrefix,
                            retailPriceLabel,
                            retailPrice,
                        }, null, this.templateCustomTags) : '';

                        const priceRangeHtml = priceRange ? Mustache.render(this.priceRangeTemplate, {
                            taxClassPrefix,
                            taxDataPrefix,
                            priceLabel,
                            salePriceLabel,
                            nonSalePriceLabel,
                            priceRange,
                            nonSalePrice,
                            taxLabelHtml,
                            retailPriceRangeHtml,
                            retailPriceHtml,
                        }, null, this.templateCustomTags) : '';

                        const optionsToggleHtml = node.productOptions.edges.length > 0 ? Mustache.render(this.optionsToggleTemplate, {
                            id,
                            chooseOptionsTxt,
                        }, null, this.templateCustomTags) : '';

                        const priceHtml = !this.config.requireLogin && !priceRange ? Mustache.render(this.priceTemplate, {
                            taxClassPrefix,
                            taxDataPrefix,
                            priceLabel,
                            salePriceLabel,
                            nonSalePriceLabel,
                            price,
                            nonSalePrice,
                            taxLabelHtml,
                            retailPriceHtml,
                        }, null, this.templateCustomTags) : '';

                        const formHtml = node.productOptions.edges.length === 0 ? Mustache.render(this.simpleFormTemplate, {
                            id,
                            addToCartUrl,
                            qty,
                        }, null, this.templateCustomTags) : '';

                        const detailsHtml = Mustache.render(this.productDetailsTemplate, {
                            id,
                            name,
                            loginPriceHtml,
                            priceHtml,
                            priceRangeHtml,
                            optionsToggleHtml,
                            formHtml,
                            checked,
                        }, null, this.templateCustomTags);

                        const thumbnailHtml = $(Mustache.render(this.thumbnailTemplate, {
                            id,
                            name,
                            url,
                            loadingImg,
                            img,
                            checked,
                        }, null, this.templateCustomTags));

                        $productEl.append(detailsHtml);
                        $thumbnails.append(thumbnailHtml);

                        // load simple product details
                        if (node.productOptions.edges.length === 0) {
                            const product = new ProductDetails($productEl, _.extend(this.context, { enableAlsoBought: false }));

                            // listen price change
                            product.$scope.on('price-change', () => this.updateTotalPrice());

                            // store the product object for later use
                            this.products.push(product);
                            $productEl.data('productDetails', product);
                        }

                        // init foundation collapsible
                        collapsibleFactory('[data-options-collapsible]', { $context: $productEl });
        
                        // bind events
                        $productEl.find('[data-also-bought-checkbox]').on('change', this.onAlsoBoughtCheckboxChange.bind(this, $productEl));
                        $productEl.find('[data-options-collapsible]').on(CollapsibleEvents.open, this.onOptionsOpen.bind(this, $productEl));

                        this.updateTotalPrice();
                        this.updateAddSelectedToCartButton();
                    });
                },
            });

            // init parent product item
            const $parentProductEl = $('[data-parent-product]', this.$alsoBoughtEl);
            collapsibleFactory('[data-options-collapsible]', { $context: $parentProductEl });
            $('[data-also-bought-checkbox]', $parentProductEl).on('change', this.onAlsoBoughtCheckboxChange.bind(this, $parentProductEl));

            // listen parent product price change
            this.parentProductDetails.$scope.on('price-change', () => this.updateTotalPrice());
        }
    }

    updateTotalPrice() {
        // stop showing total price if require login
        if (this.config.requireLogin) {
            return;
        }

        const productIds = $('[data-also-bought-checkbox]:checked', this.$alsoBoughtEl)
            .get()
            .map(el => $(el).val());

        const priceById = {
            ...this.productNodes.filter(node => node.prices && node.prices.price).reduce((_priceById, node) => ({
                ..._priceById,
                [node.entityId]: {
                    [this.config.includeTax ? 'with_tax' : 'without_tax']: {
                        value: node.prices.price.value,
                        formatted: this.currencyFormat(node.prices.price.value),
                    }
                }
            }), {}),
            ...this.products.filter(product => product.price && product.productId).reduce((_priceById, product) => ({
                ..._priceById,
                [product.productId]: product.price,
            }), {}),
        };

        // merge productNodes & product details objects
        const products = Object.keys(priceById).map(productId => ({
            productId,
            price: priceById[productId],
        }));

        const total = [this.parentProductDetails, ...products]
            .filter(product => productIds.indexOf(product.productId) > -1)
            .reduce(({ with_tax = 0, without_tax = 0, money_with_tax, money_without_tax }, { price }) => ({
                with_tax: price && price.with_tax ? with_tax + price.with_tax.value : null,
                without_tax: price && price.without_tax ? without_tax + price.without_tax.value : null,
                money_with_tax: money_with_tax || ((price && price.with_tax) ? extractMoney(price.with_tax.formatted, this.context.money) : null),
                money_without_tax: money_without_tax || ((price && price.without_tax) ? extractMoney(price.without_tax.formatted, this.context.money) : null),
            }), {});

        let with_tax = 0;
        let without_tax = 0;
        let money_with_tax = 0;
        let money_without_tax = 0;
        let productIdNot = [];

        [this.parentProductDetails, ...products]
        .filter(product => {
            if(productIds.indexOf(product.productId) > -1 && productIdNot.indexOf(product.productId) == -1) {
                let productQtyVal = parseInt($('.qty-form-input[product-id="' + product.productId +'"]').val());
                productIdNot.push(product.productId);
                if(product.price && product.price.with_tax) {
                    with_tax = with_tax + (productQtyVal * parseFloat(product.price.with_tax.value).toFixed(2));
                }
                if(product.price && product.price.without_tax) {
                    without_tax = without_tax + (productQtyVal * parseFloat(product.price.without_tax.value).toFixed(2));
                }
            }
        });
        
        total.without_tax = with_tax;
        total.without_tax = without_tax;

        const $withTax = $('[data-total-with-tax]', this.$alsoBoughtEl);
        const $withoutTax = $('[data-total-without-tax]', this.$alsoBoughtEl);

        if (total.with_tax) {
            if(total.with_tax!=null){
             total.with_tax.decimal_places=2;
            }

            $('[data-price]', $withTax).html(currencyFormat(total.with_tax, total.money_with_tax));
            $withTax.show();
            if (total.without_tax) {
                $('[data-tax-label]', $withTax).show();
            } else {
                $('[data-tax-label]', $withTax).hide();
            }
        } else {
            $withTax.hide();
        }

        if (total.without_tax) {
            if( total.money_without_tax!=null)
            {
                total.money_without_tax.decimal_places=2;
            } 
            $('[data-price]', $withoutTax).html(currencyFormat(total.without_tax, total.money_without_tax));
            $withoutTax.show();
            if (total.with_tax) {
                $('[data-tax-label]', $withoutTax).show();
            } else {
                $('[data-tax-label]', $withoutTax).hide();
            }
        } else {
            $withoutTax.hide();
        }
    }

    onAddAllButtonClick(e) {
        e.preventDefault();

        $('[data-also-bought-checkbox]', this.$alsoBoughtEl)
            .prop('checked', true)
            .trigger('change');
    }

    onAddSelectedButtonClick(e) {
        e.preventDefault();
        this.addSelectedProductsToCart();
    }

    onAlsoBoughtCheckboxChange($productEl, e) {
        const $cb = $(e.target);
        const $toggle = $productEl.find('[data-options-collapsible]').first();
        const $label = $(`label[for="${$cb.attr('id')}"]`, this.$alsoBoughtEl);
        const $thumb = $(`[data-thumbnail-product-id="${$productEl.data('productId')}"]`, this.$alsoBoughtEl);

        // open (close) product options form if checkbox is checked (unchecked)
        if ($cb.prop('checked')) {
            $label.addClass('is-checked');
            $thumb.addClass('is-checked');
            if (!$toggle.hasClass('is-open')) {
                $toggle.trigger('click');
            }
        } else {
            $label.removeClass('is-checked');
            $thumb.removeClass('is-checked');
            if ($toggle.hasClass('is-open')) {
                $toggle.trigger('click');
            }
        }

        this.updateTotalPrice();
        this.updateAddSelectedToCartButton();
    }

    onOptionsOpen($productEl) {
        if ($productEl.data('productDetails')) {
            return;
        }
        this.loadProductDetails($productEl);
    }

    async loadProductDetails($productEl) {
        const productId = $productEl.data('productId');
        console.log(productId);
        const $content = $productEl.find('[data-product-content]');

        $content.html(Mustache.render(this.loadingTemplate, { loadingImg: this.context.loadingImg }, null, this.templateCustomTags));

        await new Promise(resolve => {
            utils.api.product.getById(productId, { template: 'papathemes/also-bought/product-details' }, (err, resp) => {
                if (err || !resp) {
                    return;
                }
    
                $content.html($(resp).html());
    
                const product = new ProductDetails($productEl, _.extend(this.context, { enableAlsoBought: false }), null, true);
    
                // listen price change
                product.$scope.on('price-change', () => this.updateTotalPrice());
    
                // store the product object for later use
                this.products.push(product);
                $productEl.data('productDetails', product);
    
                this.updateTotalPrice();

                resolve();
            });
        });
    }

    updateAddSelectedToCartButton() {
        const $all = $('[data-also-bought-checkbox]', this.$alsoBoughtEl);
        const $checked = $all.filter(':checked');
        const $btns = $('[data-buttons]', this.$alsoBoughtEl);

        if ($checked.length > 0) {
            const str = $checked.length === $all.length
                ? ($checked.length <= this.allNumberTexts.length ? this.allNumberTexts[$checked.length - 1] : $checked.length)
                : ($checked.length <= this.numberTexts.length ? this.numberTexts[$checked.length - 1] : $checked.length);
            const $btn = $('[data-add-selected]', this.$alsoBoughtEl);
            const text = String($btn.data('originalText') || $btn.html());
            $btn.data('originalText', text).html(text.replace('%str%', str));
            $btns.addClass('show');
        } else {
            $btns.removeClass('show');
        }
    }

    // No longer used. Keep for other third-party scripts compatibility.
    /**
     * Promise to Call after the parent product is added to add also-bought products.
     */
    async parentProductAddedToCart() {
        // console.log('parent product added');

        const promises = [];
        let success = true;

        this.products.forEach(product => {
            if (product.$scope.find('[data-also-bought-checkbox]:checked').length > 0) {
                promises.push(async () => {
                    try {
                        await this.addProductToCart(product); // eslint-disable-line no-unused-expressions
                        await delay(1000); // eslint-disable-line no-unused-expressions
                    } catch (e) {
                        success = false;
                    }
                });
            }
        });

        await promiseSerial(promises); // eslint-disable-line no-unused-expressions
        return success;
    }

    

    async addSelectedProductsToCart() {
        const productIds = $('[data-also-bought-checkbox]:checked', this.$alsoBoughtEl)
            .get()
            .map(el => $(el).val());

        const results = [];
        let success = true;

        // add parent product to cart
        if (productIds.indexOf(this.parentProductDetails.productId) > -1) {
            success = reportFormValidity(this.parentProductDetails.$form.get(0));
            if (success) {
                const [err, resp] = await this.parentProductDetails.addProductToCartAsync();
                const errorMsg = err || resp.data.error;
                if (errorMsg) {
                    await swal({
                        text: errorMsg,
                        type: 'error',
                    });
                    success = false;
                } else {
                    results.push({
                        product: this.parentProductDetails,
                        resp,
                    });
    
                    $(`[data-also-bought-checkbox][value="${this.parentProductDetails.productId}"]`, this.$alsoBoughtEl)
                        .prop('checked', false)
                        .trigger('change');
                }
            }
        }

        const $productEls = $('[data-product-id]', this.$alsoBoughtEl).not('[data-parent-product]');
        console.log($productEls);
        for (let i = 0; i < productIds.length && success; i++) {
            const productId = productIds[i];
            console.log(productId);
            if (!productId || productId == this.parentProductDetails.productId) {
                console.log('1');
                continue;
            }

            const $productEl = $productEls.filter(`[data-product-id="${productId}"]`);
            console.log($productEl);
            if ($productEl.length === 0) {
                 console.log('2');
                continue;
            }

            if (!$productEl.data('productDetails')) {
                 console.log('3');
                await this.loadProductDetails($productEl);
            }

            const product = $productEl.data('productDetails');
             console.log(product);
            if (!product) {
                 console.log('4');
                continue;
            }
            
            success = reportFormValidity(product.$form.get(0));
            if (success) {
                const [err, resp] = await product.addProductToCartAsync();
                const errorMsg = err || resp.data.error;
                if (errorMsg) {
                    await swal({
                        text: errorMsg,
                        type: 'error',
                    });
                    success = false;
                } else {
                    results.push({
                        product,
                        resp,
                    });
    
                    $('[data-also-bought-checkbox]', product.$scope)
                        .prop('checked', false)
                        .trigger('change');
    
                    if (i < productIds.length - 1) {
                        await delay(200);
                    }
                }
            } else {
                // open the product form
                const $toggle = $('[data-options-collapsible]', product.$scope);
                if (!$toggle.hasClass('is-open')) {
                    $toggle.trigger('click');
                }
            }
        }

        if (results.length > 0) {
            const { product, resp } = results[0];

            // Open preview modal and update content
            if (product.previewModal) {
                // Supermarket OBPS Mod
                const modal = defaultModal();
                modal.close();
                if (this.context.add_to_cart_popup !== 'hide') {
                    product.previewModal.open();
                }

                product.updateCartContent(product.previewModal, resp.data.cart_item.id);
            } else {
                // if no modal, redirect to the cart page
                this.redirectTo(resp.data.cart_item.cart_url || this.context.urls.cart);
            }
        }
    }

    addProductToCart(product) {
        return new Promise((resolve, reject) => {
            const form = $('form[data-cart-item-add]', product.$scope).get(0);
            const $addToCartBtn = $('#form-action-addToCart', product.$scope);
            const originalBtnVal = $addToCartBtn.val();
            const waitMessage = $addToCartBtn.data('waitMessage');
            const $errorBox = $('[data-error-box]', product.$scope);
            const $errorMsg = $('[data-error-message]', product.$scope);
            const $checkbox = $('[data-also-bought-checkbox]', product.$scope);

            // Do not do AJAX if browser doesn't support FormData
            if (window.FormData === undefined) {
                resolve();
            }

            $addToCartBtn
                .val(waitMessage)
                .prop('disabled', true);

            product.$overlay.show();

            // Add item to cart
            utils.api.cart.itemAdd(product.filterEmptyFilesFromForm(new FormData(form)), (err, response) => {
                const errorMessage = err || response.data.error;

                // console.log(form);

                $addToCartBtn
                    .val(originalBtnVal)
                    .prop('disabled', false);

                product.$overlay.hide();

                // Guard statement
                if (errorMessage) {
                    // console.log('reject add product');

                    $errorMsg.html(errorMessage);
                    $errorBox.removeClass('u-hiddenVisually');
                    if ($errorBox.length > 0) {
                        scrollToElement($errorBox.get(0));
                    }

                    reject();
                    return;
                }

                // console.log('resolve add product');
                $errorMsg.empty();
                $errorBox.addClass('u-hiddenVisually');
                $checkbox.prop('checked', false).trigger('change');

                resolve();
            });
        });
    }
}
