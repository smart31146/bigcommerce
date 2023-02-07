/* eslint-disable camelcase */

function _formatMoney(_amount, _decimalCount = 2, decimal = '.', thousands = ',') {
    try {
        let decimalCount = Math.abs(_decimalCount);
        decimalCount = Number.isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = _amount < 0 ? '-' : '';
        const amount = Math.abs(Number(_amount) || 0).toFixed(decimalCount);

        const i = parseInt(amount, 10).toString();
        const j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, `$1${thousands}`) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
    } catch (e) {
        return null;
    }
}

export function currencyFormat(value, {
    currency_token = '$',
    currency_location = 'left',
    decimal_token = '.',
    decimal_places = 2,
    thousands_token = ',',
} = {}) {
    const _value = _formatMoney(value, decimal_places, decimal_token, thousands_token);
    return currency_location.toLowerCase() === 'left' ? `${currency_token}${_value}` : `${_value}${currency_token}`;
}

export function extractMoney(price, defaultMoney = {
    currency_token: '$',
    currency_location: 'left',
    decimal_token: '.',
    decimal_places: 2,
    thousands_token: ',',
}) {
    const money = { ...defaultMoney };

    if (!price && price !== 0) {
        return money;
    }

    const m = String(price).trim().match(/^([^0-9]*)([0-9.,]*)([^0-9]*)$/);
    const leftSymbol = String(m[1]).trim();
    const value = String(m[2]);
    const rightSymbol = String(m[3]).trim();
    const commaPosition = value.indexOf(',');
    const commaCount = (value.match(/,/g) || []).length;
    const dotPosition = value.indexOf('.');
    const dotCount = (value.match(/\./g) || []).length;

    if (leftSymbol) {
        money.currency_token = leftSymbol;
        money.currency_location = 'left';
    } else if (rightSymbol) {
        money.currency_token = rightSymbol;
        money.currency_location = 'right';
    }

    if (commaCount.length >= 2) {
        money.thousands_token = ',';
        money.decimal_token = '.';
        money.decimal_places = dotPosition > -1 ? value.length - dotPosition - 1 : 0;
    } else if (dotCount.length >= 2) {
        money.thousands_token = '.';
        money.decimal_token = ',';
        money.decimal_places = commaPosition > -1 ? value.length - commaPosition - 1 : 0;
    } else if (commaPosition > dotPosition && dotPosition > -1) {
        money.thousands_token = '.';
        money.decimal_token = '.';
        money.decimal_places = value.length - dotPosition - 1;
    } else if (dotPosition > commaPosition && commaPosition > -1) {
        money.thousands_token = ',';
        money.decimal_token = '.';
        money.decimal_places = value.length - commaPosition - 1;
    } else if (commaPosition > -1) {
        if ((value.length - commaPosition - 1) % 3 === 0) {
            money.thousands_token = ',';
            money.decimal_token = '.';
            money.decimal_places = 0;
        } else {
            money.thousands_token = '.';
            money.decimal_token = ',';
            money.decimal_places = value.length - commaPosition - 1;
        }
    } else if (dotPosition > -1) {
        if ((value.length - dotPosition - 1) % 3 === 0) {
            money.thousands_token = '.';
            money.decimal_token = ',';
            money.decimal_places = 0;
        } else {
            money.thousands_token = ',';
            money.decimal_token = '.';
            money.decimal_places = value.length - dotPosition - 1;
        }
    } else if (commaPosition === -1 && dotPosition === -1) {
        money.decimal_places = 0;
    }

    return money;
}

export function setCookie(cname, cvalue, sec) {
    const d = new Date();
    d.setTime(d.getTime() + sec * 1000);
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${cname}=${cvalue};${expires};path=/`;
}

export function getCookie(cname) {
    const name = `${cname}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

export function loadStyle(url) {
    if (Array.from(document.getElementsByTagName('link')).filter(el => el.href === url).length > 0) {
        return;
    }
    $('<link></link>').attr({ rel: 'stylesheet', href: url }).appendTo('head');
}

export default {};
