(window.webpackJsonp=window.webpackJsonp||[]).push([[26],{635:function(t,e,i){"use strict";i.r(e),function(t){var n=i(101),o=i.n(n),c=(i(170),i(172),i(23)),a=i(729),u=i(58);i(255);e.default=function(e){if(!e.instantload){var i=Object(u.c)();t("body").on("click",".quickview, .quickview-alt",(function(n){n.preventDefault();var u=t(n.currentTarget).data("productId");i.open({size:"large"});var d={product:{videos:e.productpage_videos_count,reviews:e.productpage_reviews_count}};c.b.api.product.getById(u,{template:"products/quick-view",config:d},(function(n,c){i.updateContent(c),i.$content.find(".productView").addClass("productView--quickView"),i.$content.find("[data-slick]").slick();var u,d=i.$content.find(".quickView");return u=t("[data-also-bought] .productView-alsoBought-item",d).length>0?new a.a(d,o()(e,{enableAlsoBought:!0})):new a.a(d,e),t("body").trigger("loaded.quickview",[u]),u}))}))}}}.call(this,i(3))}}]);
//# sourceMappingURL=theme-bundle.chunk.26.js.map
