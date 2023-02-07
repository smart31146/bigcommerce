import utils from '@bigcommerce/stencil-utils';
import collapsibleFactory from '../theme/common/collapsible';

let remoteBannerCache;

export function autoExpandCategoryMenu(context) {
    // papathemes-beautify edited
    let $curMenuItem;

    if (context.pageType === 'product') {
        const url = $('.breadcrumbs .breadcrumb.is-active').prev().find('a').attr('href');
        if (url) {
            $curMenuItem = $('#papathemes-verticalCategories-sidebar').find(`a.navPages-action[href='${url}']`);
        }
    } else {
        $curMenuItem = $('[data-current-category]');
    }

    if ($curMenuItem && $curMenuItem.length > 0) {
        const collapsibles = [];

        if ($curMenuItem.attr('data-collapsible')) {
            collapsibles.push($curMenuItem);
        }

        $curMenuItem.parents('.navPage-childList, .navPage-subMenu').prev('[data-collapsible]').each((i, el) => {
            collapsibles.push(el);
        });

        $.each(collapsibleFactory(collapsibles), (i, o) => {
            o.open();
        });

        // scrollToElement('[data-current-category]', { align: 'middle' });
    }
}

export function bindNavPagesCheckRightEdge(mediaQuery) {
    $('.navPages-item').hover(event => {
        if (!mediaQuery || !mediaQuery.matches) {
            return;
        }

        const $hoverEl = $(event.currentTarget);

        $hoverEl.children('.navPage-subMenu').each((i, submenu) => {
            const $submenu = $(submenu);

            if ($submenu.offset().left + $submenu.width() > $(window).width()) {
                $submenu
                    .addClass('toLeft')
                    // .css('left', `${$hoverEl.position().left + $hoverEl.width() - $submenu.width()}px`);
                    .css('left', `${$(window).width() - $submenu.width() - $hoverEl.position().left}px`);
                $submenu.closest('.navPages-item').addClass('toLeft'); // papathemes-beautify
            }
        });
    }, event => {
        if (!mediaQuery || !mediaQuery.matches) {
            return;
        }

        const $hoverEl = $(event.currentTarget);

        $hoverEl.children('.navPage-subMenu').each((i, submenu) => {
            const $submenu = $(submenu);

            $submenu
                .removeClass('toLeft')
                .css('left', '');
            $submenu.closest('.navPages-item').removeClass('toLeft'); // papathemes-beautify
        });
    });

    $('.navPage-subMenu-item, .navPage-childList-item').hover(event => {
        if (!mediaQuery || !mediaQuery.matches) {
            return;
        }

        const $hoverEl = $(event.currentTarget);

        $hoverEl.children('.navPage-childList').each((i, submenu) => {
            const $submenu = $(submenu);
            if ($submenu.offset().left + $submenu.width() > $(window).width()) {
                $submenu.addClass('toLeft');
            }
        });
    }, event => {
        if (!mediaQuery || !mediaQuery.matches) {
            return;
        }

        const $hoverEl = $(event.currentTarget);

        $hoverEl.children('.navPage-childList').each((i, submenu) => {
            const $submenu = $(submenu);

            $submenu.removeClass('toLeft');
        });
    });
}

export function checkTouchDevice() {
    const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    const mq = (query) => window.matchMedia(query).matches;

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch) {
        return true;
    }

    // include the 'heartz' as a way to have a non matching MQ to help terminate the join
    // https://git.io/vznFH
    const query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
}

export function scrollTop(top, ms = 300) {
    if (navigator.userAgent.match(/(iPod|iPhone|iPad|Android)/i)) {
        window.scrollTo(0, top); // first value for left offset, second value for top offset
    } else {
        $('html, body').animate({
            scrollTop: top,
        }, ms, () => $('html, body').clearQueue());
    }
}

export default {
    autoExpandCategoryMenu,
    bindNavPagesCheckRightEdge,
    checkTouchDevice,
    scrollTop,
};
