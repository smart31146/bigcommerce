import 'slick-carousel';

export default function () {
    const $carousel = $('[data-slick]');

    if ($carousel.length) {
        // papathemes-beautify: improve accessibility
        $carousel.on('init afterChange', (event, slick) => {
            const $slider = slick.$list.find('.slick-slide');
            $slider.not('.slick-active').find('a, button').attr('tabindex', '-1');
            $slider.filter('.slick-active').find('a, button').attr('tabindex', '0');
        });

        $carousel.slick();
    }

    // Supermarket theme MOD: doesn't need below script
    // // Alternative image styling for IE, which doesn't support objectfit
    // if (typeof document.documentElement.style.objectFit === 'undefined') {
    //     $('.heroCarousel-slide').each((index, element) => {
    //         const $container = $(element);
    //         const imgUrl = $container.find('img').data('lazy');

    //         if (imgUrl) {
    //             $container.css('backgroundImage', `url(${imgUrl})`).addClass('compat-object-fit');
    //         }
    //     });
    // }
}
