(window.webpackJsonp=window.webpackJsonp||[]).push([[19],{629:function(t,n,e){"use strict";e.r(n),function(t){e.d(n,"default",(function(){return c}));var r=e(168),a=e(639),o=e(644);function s(t,n){return(s=Object.setPrototypeOf||function(t,n){return t.__proto__=n,t})(t,n)}var c=function(n){var e,r;function c(){return n.apply(this,arguments)||this}r=n,(e=c).prototype=Object.create(r.prototype),e.prototype.constructor=e,s(e,r);var i=c.prototype;return i.onReady=function(){this.registerContactFormValidation()},i.registerContactFormValidation=function(){var n="form[data-contact-form]",e=Object(a.a)({submit:n+' input[type="submit"]'}),r=t(n);e.add([{selector:n+' input[name="contact_email"]',validate:function(t,n){t(o.a.email(n))},errorMessage:this.context.contactEmail},{selector:n+' textarea[name="contact_question"]',validate:function(t,n){t(o.a.notEmpty(n))},errorMessage:this.context.contactQuestion}]),r.on("submit",(function(t){e.performCheck(),e.areAll("valid")||t.preventDefault()}))},c}(r.a)}.call(this,e(3))},639:function(t,n,e){"use strict";var r=e(663),a=e.n(r),o=e(647);a.a.classes.errorClass="form-field--error",a.a.classes.successClass="form-field--success",a.a.classes.errorMessageClass="form-inlineMessage",a.a.checkFunctions["min-max"]=o.a,n.a=a.a},644:function(t,n,e){"use strict";n.a={email:function(t){return/^\S+@\S+\.\S+/.test(t)},password:function(t){return this.notEmpty(t)},notEmpty:function(t){return t.length>0}}},647:function(t,n,e){"use strict";(function(t){var r=e(664),a=e.n(r);n.a=function(n,e){return function(r){var o=parseFloat(t(n).val()),s=parseFloat(t(e).val());return s>o||a()(s)||a()(o)?r(!0):r(!1)}}}).call(this,e(3))}}]);
//# sourceMappingURL=theme-bundle.chunk.19.js.map
