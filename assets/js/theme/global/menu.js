import { ready } from 'jquery';
import collapsibleFactory from '../common/collapsible';
import collapsibleGroupFactory from '../common/collapsible-group';
import mediaQueryListFactory from '../common/media-query-list'; // papathemes-beautify

const PLUGIN_KEY = 'menu';

const mediumMediaQueryList = mediaQueryListFactory('medium'); // papathemes-beautify

/*
 * Manage the behaviour of a menu
 * @param {jQuery} $menu
 */
class Menu {
    constructor($menu) {
        this.$menu = $menu;
        this.$body = $('body');
        this.hasMaxMenuDisplayDepth = this.$body.find('.navPages-list').hasClass('navPages-list-depth-max');

        // Init collapsible
        this.collapsibles = collapsibleFactory('[data-collapsible]', { $context: this.$menu });
        this.defaultCollapsibles = collapsibleFactory('.is-default[data-collapsible]', { $context: this.$menu }); // papathemes-beautify
        this.collapsibleGroups = collapsibleGroupFactory($menu);

        // papathemes-beautify: fix not collapse others if an element has is-open class at init.
        this.collapsibleGroups.forEach(group => {
            const _arr = collapsibleFactory($('.is-open[data-collapsible]', group.$component).first());
            if (_arr.length > 0) {
                // eslint-disable-next-line no-param-reassign
                group.openCollapsible = _arr[0];
            }
        });

        // Auto-bind
        this.onMenuClick = this.onMenuClick.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.onMediumMediaQueryMatch = this.onMediumMediaQueryMatch.bind(this); // papathemes-beautify

        // Listen
        this.bindEvents();
    }

    collapseAll() {
        this.collapsibles.forEach(collapsible => collapsible.close()); // papathemes - supermarket: fix issue when click body dropdown menu being hidden
        this.collapsibleGroups.forEach(group => group.close());

        // papathemes-beautify
        // Re-open the firt menu item
        if (mediumMediaQueryList.matches) {
            this.defaultCollapsibles.forEach(group => group.open());
        }
    }

    collapseNeighbors($neighbors) {
        const $collapsibles = collapsibleFactory('[data-collapsible]', { $context: $neighbors });

        $collapsibles.forEach($collapsible => $collapsible.close());
    }

    bindEvents() {
        this.$menu.on('click', this.onMenuClick);
        this.$body.on('click', this.onDocumentClick);

        // papathemes-beautify: collapse menu when switching to desktop
        mediumMediaQueryList.addListener(this.onMediumMediaQueryMatch);
    }

    unbindEvents() {
        this.$menu.off('click', this.onMenuClick);
        this.$body.off('click', this.onDocumentClick);

        // papathemes-beautify: collapse menu when switching to desktop
        mediumMediaQueryList.removeListener(this.onMediumMediaQueryMatch);
    }

    // papathemes-beautify
    onMediumMediaQueryMatch(media) {
        if (media.matches) {
            this.collapseAll();
        }
    }

    onMenuClick(event) {
        // papathemes-supermarket - Fix to allow [data-cart-currency-switch-url] works in menu
        if ($(event.target).is('[data-cart-currency-switch-url]') || $(event.target).closest('[data-cart-currency-switch-url]').length > 0) {
            return;
        }

        // papathemes-beautify edited to fix cart dropdown not show
        if ($(event.target).closest('[data-dropdown]').length === 0) {
            event.stopPropagation();
        }

        event.stopPropagation();

        if (this.hasMaxMenuDisplayDepth) {
            const $neighbors = $(event.target).parent().siblings();

            this.collapseNeighbors($neighbors);
        }
    }

    onDocumentClick() {
        this.collapseAll();
    }
}

/*
 * Create a new Menu instance
 * @param {string} [selector]
 * @return {Menu}
 */
export default function menuFactory(selector = `[data-${PLUGIN_KEY}]`) {
    const $menu = $(selector).eq(0);
    const instanceKey = `${PLUGIN_KEY}Instance`;
    const cachedMenu = $menu.data(instanceKey);

    if (cachedMenu instanceof Menu) {
        return cachedMenu;
    }

    const menu = new Menu($menu);

    $menu.data(instanceKey, menu);

    return menu;
}

$(document).ready(function(){
    $('.navPages-list > .navPages-item').hover(function(e){
        if($('.mobileMenu-toggle').css("display") == "none"){
            if($(this).find(".navPage-subMenu").length > 0){
                let childrenCount = $(this).find(".navPage-subMenu .navPage-subMenu-list .navPage-subMenu-item[data-attr-child-length]").length
                let subMenuCount = [];
                let subMenuHeight = [];
                var that = this;
                $(that).find(".navPage-subMenu .navPage-subMenu-list .navPage-subMenu-item[data-attr-child-length]").each(function(index){
                    subMenuCount.push(Number($(this).attr("data-attr-child-length")));
                    subMenuHeight.push(Number($(this).outerHeight(true)));
                    if(index == (childrenCount - 1)){
                        let maxIndex = subMenuCount.indexOf(Math.max(...subMenuCount));
                        $(that).find(".navPage-subMenu").css("opacity", "0" );
                        $(that).find(".navPage-subMenu").css("display", "block" );
                        $(that).find(".navPage-subMenu .navPage-subMenu-list").css("height", subMenuHeight[maxIndex] + 32 + "px");
                        $(that).find(".navPage-subMenu").css("opacity", "" );
                        $(that).find(".navPage-subMenu").css("display", "" );
                    }
                });
            }
        }
    });
})
