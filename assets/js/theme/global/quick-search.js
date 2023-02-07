import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import StencilDropDown from './stencil-dropdown';
import mediaQueryListFactory from '../common/media-query-list'; // papathemes-beautify

// papathemes-beautify
const mediumMediaQueryList = mediaQueryListFactory('medium');

export default function () {
    const TOP_STYLING = 'top: 49px;';
    const $quickSearchResults = $('.quickSearchResults');
    const $quickSearchDiv = $('#quickSearch');
    const $searchQuery = $('#search_query');

    // papathemes-beautify
    const $body = $('body');
    const $header = $('.header');
    const $quickSearchClose = $('[data-quick-search-close]');

    const stencilDropDownExtendables = {
        hide: () => {
            $searchQuery.trigger('blur');

            // papathemes-beautify
            $body.removeClass('has-quickSearchOpen');
            $searchQuery.val('');
        },
        show: (event) => {
            $searchQuery.trigger('focus');
            if (typeof event !== 'undefined') { // papathemes: fix for showing dropdown results
                event.stopPropagation();
            }

            // papathemes-beautify {{{
            $body.addClass('has-quickSearchOpen');

            if (mediumMediaQueryList.matches) {
                $quickSearchDiv.css('top', '');
                if ($quickSearchDiv.offset().top < window.scrollY) {
                    $quickSearchDiv.css('top', `${window.scrollY + $header.outerHeight()}px`);
                }
            } else {
                $quickSearchDiv.css('top', $header.outerHeight());
            }
            // }}}
        },
    };
    const stencilDropDown = new StencilDropDown(stencilDropDownExtendables);
    stencilDropDown.bind($('[data-search="quickSearch"]'), $quickSearchDiv, TOP_STYLING);

    stencilDropDownExtendables.onBodyClick = (e, $container) => {
        // If the target element has this data tag or one of it's parents, do not close the search results
        // We have to specify `.modal-background` because of limitations around Foundation Reveal not allowing
        if ($(e.target).closest('[data-prevent-quick-search-close], .modal-background').length === 0) {
            stencilDropDown.hide($container);
        }

        // Papathemes - Supermarket: close popup if click on the overlay
        if ($(e.target).is('.papathemes-overlay')) {
            stencilDropDown.hide($container);
        }
    };

    // stagger searching for 200ms after last input
    const doSearch = _.debounce((searchQuery) => {
        utils.api.search.search(searchQuery, { template: 'search/quick-results' }, (err, response) => {
            if (err) {
                return false;
            }

            $quickSearchResults.html(response);
            stencilDropDown.show($quickSearchDiv);  // papathemes: show drop-down results after search results retrieved
        });
    }, 200);

    utils.hooks.on('search-quick', (event, currentTarget) => {
        const searchQuery = $(currentTarget).val();

        // server will only perform search with at least 3 characters
        if (searchQuery.length < 3) {
            return;
        }

        doSearch(searchQuery);
    });

    // Catch the submission of the quick-search
    // $quickSearchDiv.on('submit', (event) => { // papathemes fix bug don't stop form submit
    $searchQuery.closest('form').on('submit', (event) => {
        const searchQuery = $(event.currentTarget).find('input').val();

        if (searchQuery.length === 0) {
            return event.preventDefault();
        }

        return true;
    });

    // papathemes-beautify
    $quickSearchClose.on('click', () => stencilDropDown.hide($quickSearchDiv));

    // Supermarket: close quick search when InstantLoad finish loading
    $('body').on('loaded.instantload', () => stencilDropDown.hide($quickSearchDiv));
}
