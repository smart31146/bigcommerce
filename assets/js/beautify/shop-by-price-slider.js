class ShopByPriceSlider {
    constructor($scope) {
        if ($scope.data('beautifyShopByPriceSliderInstance')) {
            return;
        }

        $scope.data('beautifyShopByPriceSliderInstance', this);

        this.onPriceInput = this.onPriceInput.bind(this);

        this.$scope = $scope;
        this.$slider = $('[data-slider]', $scope);
        this.$min = $('input[name="min_price"], input[data-input-min]', $scope);
        this.$max = $('input[name="max_price"], input[data-input-max]', $scope);
        this.$cancel = $('[data-cancel]', $scope);
        this.$clear = $('[data-clear]', $scope);
        this.$form = $('form', $scope).not('[data-faceted-search-range]'); // exclude faceted form
        this.$apply = $('[data-apply]', $scope);
        this.shopByPrice = $scope.data('beautifyShopByPrice');

        const min = this.shopByPrice[0].low.value;
        const max = this.shopByPrice[this.shopByPrice.length - 1].high.value;

        const params = new URLSearchParams(window.location.search);
        const values = [
            params.get('price_min') || params.get('min_price') || min,
            params.get('price_max') || params.get('max_price') || max,
        ];

        if (params.has('price_min') || params.has('min_price') || params.has('price_max') || params.has('max_price')) {
            this.$clear.show();
        } else {
            this.$clear.hide();
        }

        this.originalValues = values;
        
        this.$slider.slider({
            range: true,
            min,
            max,
            values,
            slide: (event, ui) => {
                this.$min.val(ui.values[0]);
                this.$max.val(ui.values[1]);
                if (ui.values[0] != this.originalValues[0] || ui.values[1] != this.originalValues[1]) {
                    this.$cancel.show();
                }
            }
        });

        this.$min.attr({ min, max, value: params.get('price_min') || params.get('min_price') || '' }).on('input', this.onPriceInput);
        this.$max.attr({ min, max, value: params.get('price_max') || params.get('max_price') || '' }).on('input', this.onPriceInput);

        this.$cancel.on('click', () => {
            event.preventDefault();
            this.$slider.slider('values', this.originalValues);
            this.$min.val(this.originalValues[0]);
            this.$max.val(this.originalValues[1]);
            this.$cancel.hide();
        });

        this.$form.on('submit', event => {
            event.preventDefault();
            this.apply();
        });

        this.$apply.on('click', event => {
            event.preventDefault();
            this.apply();
        });
    }

    apply() {
        const [slideMin, slideMax] = this.$slider.slider('values');
        const min = Number(this.$min.val()) || slideMin;
        const max = Number(this.$max.val()) || slideMax;
        const params = new URLSearchParams(window.location.search);
        params.set('price_min', min);
        params.set('price_max', max);
        window.location = `${window.location.pathname}?${params.toString()}`;
    }

    onPriceInput(event) {
        let val = Number(event.target.value) || 0;
        const min = Number(this.$min.prop('min')) || 0;
        const max = Number(this.$min.prop('max')) || 0;

        const curMin = Number(this.$min.val()) || this.originalValues[0];
        const curMax = Number(this.$max.val()) || this.originalValues[1];

        if (val < min) {
            val = min;
        }
        if (val > max) {
            val = max;
        }

        if (this.$min.is(event.target) && curMax > 0 && val > curMax) {
            val = curMax;
        }

        if (this.$max.is(event.target) && curMin > 0 && val < curMin) {
            val = curMin;
        }

        event.target.value = val;

        const newMin = Number(this.$min.val()) || this.originalValues[0];
        const newMax = Number(this.$max.val()) || this.originalValues[1];

        this.$slider.slider('values', [newMin, newMax]);

        if (newMin != this.originalValues[0] || newMax != this.originalValues[1]) {
            this.$cancel.show();
        } else {
            this.$cancel.hide();
        }
    }
}

export default function (selector = '[data-beautify-shop-by-price]') {
    $(selector).each((i, el) => new ShopByPriceSlider($(el)));
}
