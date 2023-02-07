import { throttle } from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import './jquery-ui';
import mobileMenuToggleFactory from '../theme/global/mobile-menu-toggle';
import mediaQueryListFactory from '../theme/common/media-query-list';

const isTopInViewport = (elem) => {
    const distance = elem.getBoundingClientRect();
    return (
        distance.top >= 0 &&
        distance.top <= (window.innerHeight || document.documentElement.clientHeight)
    );
};

const mediumMediaQueryList = mediaQueryListFactory('medium');

export default function () {
    // const $header = $('.header').first();
    // const $navPagesRootMenuList = $('.navPages-rootMenu-list');
    const $body = $('body');
    const $menuToggle = $('[data-mobile-menu-toggle]');
    const $searchToggle = $('[data-mobile-search-toggle]');
    const $quickSearch = $('.papathemes-quickSearch');
    const mobileMenu = mobileMenuToggleFactory();

    // const updateHeaderPaddingDependingNavHeight = () => {
    //     const updateFunc = () => {
    //         if (mediumMediaQueryList.matches) {
    //             const height = $navPagesRootMenuList.filter('.is-open').not('.navPages-rootMenu-list--standard').outerHeight() || '';
    //             $header.css('padding-bottom', height);
    //             $('.stickyHeader-placeholder').css('height', $header.outerHeight());
    //         } else {
    //             $header.css('padding-bottom', '');
    //         }
    //     };
    //     updateFunc();
    //     $(window).on('resize', throttle(updateFunc, 300, { leading: false }));
    //     $('.navPages-rootMenu-action[data-collapsible]').on('toggle.collapsible', debounce(updateFunc));
    // };

    const stickyHeader = () => {
        $('[data-sticky-header]').not('.sticky-header-loaded').each((i, el) => {
            const $el = $(el).addClass('sticky-header-loaded', true);
            const $placeholder = $('<div class="stickyHeader-placeholder"></div>').show().css('height', $el.outerHeight()).insertAfter($el);
            let lastScrollTop = 0;

            const onScroll = throttle((event) => {
                const st = window.pageYOffset || document.documentElement.scrollTop; // Credits: "https://github.com/qeremy/so/blob/master/so.dom.js#L426"
                const headerHeight = $el.outerHeight();
                const placeholderTop = $placeholder.offset().top;

                $placeholder.css('height', headerHeight);

                if (st > lastScrollTop) {
                    // scroll down
                    if (st > placeholderTop + headerHeight) {
                        $el.addClass('_shadow').css('top', -$el.outerHeight());
                    }
                } else if (!$body.hasClass('_skipCheckScrollUpStickyHeader')) {
                    // scroll up
                    // eslint-disable-next-line no-lonely-if
                    if (st > placeholderTop + headerHeight) {
                        $el.addClass('_shadow').css('top', 0);
                    } else if (st <= placeholderTop) {
                        $el.removeClass('_shadow').css('top', '');
                    } else if ($el.hasClass('_shadow') && $el.offset().top < 0) {
                        $el.removeClass('_shadow').css('top', '');
                    }
                }


                lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
            }, 100, { leading: false });

            const onResize = throttle(() => {
                const headerHeight = $el.outerHeight();
                $placeholder.css('height', headerHeight);
            }, 300, { leading: false });

            $(window).on('scroll', onScroll);
            $(window).on('resize', onResize);
        });
    };

    const onScroll = throttle(() => {
        if (mediumMediaQueryList.matches && !$body.hasClass('has-quickSearchOpen')) {
            // Auto click the tab when scrolling to a section in viewport on PDP
            $('.productView-description').get().map(el => $(el))
                .forEach($el => {
                    const arr = $el.find('.tab-content').get()
                        .map(el => $(el).find('> *:visible').get(0));
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i] && isTopInViewport(arr[i])) {
                            const id = $(arr[i]).closest('.tab-content').attr('id');
                            const $tab = $el.find(`.tab-title[href="#${id}"]`).closest('.tab');
                            if ($tab.not('.is-active')) {
                                $tab.siblings().removeClass('is-active');
                                $tab.addClass('is-active');
                            }
                            break;
                        }
                    }
                });
        }
    }, 500, { leading: false });

    $menuToggle.on('click', (event) => {
        event.preventDefault();
        $searchToggle.removeClass('is-open');
        $quickSearch.removeClass('is-open');
    });

    $searchToggle.on('click', (event) => {
        event.preventDefault();
        if (mobileMenu.isOpen) {
            mobileMenu.hide();
        }
        $searchToggle.toggleClass('is-open');
        $quickSearch.toggleClass('is-open');
    });

    // updateHeaderPaddingDependingNavHeight();
    stickyHeader();

    $('body').on('click', '[data-toggle]', (event) => {
        event.preventDefault();

        const $el = $(event.currentTarget);
        const id = $el.data('toggle');
        const $otherEls = $(`[data-toggle=${id}]`).not($el);
        const $target = $(`#${id}`);

        $el.toggleClass('is-open');

        if ($el.hasClass('is-open')) {
            $target.addClass('is-open');
            $otherEls.addClass('is-open');
            $target.trigger('open.toggle');
        } else {
            $target.removeClass('is-open');
            $otherEls.removeClass('is-open');
            $target.trigger('close.toggle');
        }
    });

    $('#sidebar-top').on('open.toggle', () => $('body').addClass('has-sidebarTopOpened'));
    $('#sidebar-top').on('close.toggle', () => $('body').removeClass('has-sidebarTopOpened'));

    $(document).on('scroll', onScroll);
    $('body').on('loaded.quickview', () => {
        $('.modal-body.quickView').off('scroll').on('scroll', onScroll);
    });

    // open quick search form on homepage
    // if (!$searchToggle.hasClass('is-open')) {
    //     $searchToggle.trigger('click');
    // }

    const fixMobileMenuShiftedWhenClickCollapsible = () => {
        const $el = $('#bf-fix-menu-mobile');
        const el = $el.get(0);
        let openEl;
        let openElTop;

        $el.on('open.collapsible', (event) => {
            openEl = event.target;
            openElTop = $(openEl).offset().top;
        });

        $el.on('close.collapsible', () => {
            if (mediumMediaQueryList.matches || !openEl) {
                return;
            }
            const relY = $(openEl).offset().top - $el.offset().top + el.scrollTop;
            const scrollTop = relY - openElTop + $el.offset().top;
            el.scrollTop = Math.max(0, scrollTop);
        });
    };

    fixMobileMenuShiftedWhenClickCollapsible();

    const initContactFormUrl = () => {
        $('[data-contact-form-url]').each((i, el) => {
            const $el = $(el);

            if ($el.data('contactFormUrlLoaded')) {
                return;
            }
            
            $el.data('contactFormUrlLoaded', true);

            const url = $el.data('contactFormUrl');
            const template = 'beautify/contact-form-remote';
            
            utils.api.getPage(url, { template }, (err, resp) => {
                if (err || !resp) {
                    return;
                }
                $el.append(resp);
            });
        });
    };

    initContactFormUrl();
}


jQuery(document).ready(function()
{
    jQuery('.wrapper-phone').clone().appendTo('.navPages');
    jQuery('body.supermarket-page--pages-home #buttonLink a').attr('target', '_blank');

    // jQuery('.navPages-item').each(function () {
    //     jQuery(this).find('');
    // });
});
