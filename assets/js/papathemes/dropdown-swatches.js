import 'selectize';
import 'selectize-css';

export default function(product, {
    swatchFieldSelector = 'form[data-cart-item-add] [data-product-option-change] [data-product-attribute="swatch"]',
    getSwatchLabelFromInput = inputEl => $(inputEl).next().children().first().attr('title'),
    getSwatchImageHTMLFromInput = inputEl => $(inputEl).next().html(),
    isSwatchHidden = inputEl => $(inputEl).next().is(':hidden'),
    isSwatchUnavailable = inputEl => $(inputEl).next().hasClass('unavailable'),
    renderSelect = ($formField, $select) => $formField.find('.form-label').first().after($select),
    hideOriginalSwatches = false,
    hideOriginalSwatchesFunc = $formField => $formField.children('.form-option-swatch, .form-radio').css({
        position: 'absolute',
        visibility: 'hidden',
        height: 0,
        width: 0,
        overflow: 'hidden',
        margin: 0,
    }),
} = {}) {
    product.$scope.find(swatchFieldSelector).not('._dropdownSwatchesLoaded')
        .addClass('_dropdownSwatchesLoaded')
        .get()
        .map(el => $(el))
        .forEach($formField => {
            const $inputs = $formField.find('input');
            const selectId = `chiara__dropdownSwatches-${String($inputs.first().attr('name')).replace(/attribute\[(.*)\]/, 'attribute_$1')}`;

            // Hidden select for initializing Selectize
            const $select = $(`<select class="chiara__dropdownSwatches" id="${selectId}"><option value="">${product.context.txtSelectOne}</option></select>`)
                .hide()
                .on('change', event => {
                    // Stop the form's change event
                    event.preventDefault();
                    event.stopPropagation();
                });

            // Populate the hidden select options
            $inputs.each((i, el) => {
                const label = getSwatchLabelFromInput(el);
                $select.append(`<option value="${$(el).attr('value')}" title="${label}" ${el.checked ? 'selected' : ''}>${label}</option>`);
            });

            // Insert the hidden select to the form field
            renderSelect($formField, $select);

            // Hide the original swatches if specified
            if (hideOriginalSwatches) {
                hideOriginalSwatchesFunc($formField);
            }

            // Add label for accessibility compliance
            $select.after(`<label class="is-srOnly" for="${selectId}-selectized">${product.context.txtSelectOne}</label>`);

            // Initialize 'Selectize' select box
            $select.selectize({
                copyClassesToDropdown: true,
                render: {
                    item: (item, escape) => {
                        const $input = $inputs.filter(`[value="${item.value}"]`);
                        return `
                            <div class="_item ${isSwatchUnavailable($input) ? 'unavailable' : ''}" ${isSwatchHidden($input) ? 'style="display:none"' : ''}>
                                <span class="_img">${getSwatchImageHTMLFromInput($input)}</span>
                                <span class="_text">${escape(item.text)}</span>
                            </div>
                        `;
                    },
                    option: (item, escape) => {
                        const $input = $inputs.filter(`[value="${item.value}"]`);
                        return `
                            <div class="_option ${isSwatchUnavailable($input) ? 'unavailable' : ''}" ${isSwatchHidden($input) ? 'style="display:none"' : ''}>
                                <span class="_img">${getSwatchImageHTMLFromInput($input)}</span>
                                <span class="_text">${escape(item.text)}</span>
                            </div>
                        `;
                    },
                },
            });

            const selectize = $select[0].selectize;

            // Select the original swatch when the dropdown swatch selected
            selectize.on('change', () => {
                // console.log('selectize change');
                $inputs.filter(`[value="${$select.val()}"]`).trigger('click');
            });

            // Select the dropdown swatch when the original swatch selected
            product.$scope.find('[data-product-option-change]').on('change', event => {
                // console.log('data-product-option-change change');
                const value = $inputs.filter(':checked').val();
                selectize.setValue(value, true);
            });

            // Update 'Selectize' options when the availablity of the original swatches changed
            product.$scope.first().on('updateProductAttributes', () => {
                // console.log('updateProductAttributes');
                const value = $inputs.filter(':checked').val();
                selectize.clearCache();
                selectize.clear(true);
                selectize.setValue(value, true);
                selectize.refreshOptions(false);
            });
        });
}
