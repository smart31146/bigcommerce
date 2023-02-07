import PageManager from '../page-manager';
import { createCheckoutService } from "@bigcommerce/checkout-sdk";

import 'regenerator-runtime/runtime';
import $ from 'jquery';
import { forEach } from 'lodash';

export default class Checkout extends PageManager {
    async onReady() {
        //"use strict";
        
        window.createCheckoutService = createCheckoutService();
        var isOrganization=false;
        var origanizationName=false;
        var orderComment="";
        var purchaseOrderNumber="";
        var commentData="";
        var Check_Id="";
        // get Checkout Id  From page
        this.checkoutId = document.querySelector(".checkoutHeader").dataset.checkoutId;
       // console.log("this.checkoutId", this.checkoutId);
       Check_Id=this.checkoutId;
        // Setup SDK And load checkout Services
        this.service = createCheckoutService();
        let thisthis=this.service;
        let state = await this.service.loadCheckout(this.checkoutId);
        //console.log("checkoutId", state.data.getCheckout());
        
        var UserState = await window.createCheckoutService.loadCheckout();
        var customer  = state.data.getCustomer();
        var Currentcustomer=state.data.getCustomer();

        setTimeout(function () {
            $(".checkout-step--billing form select[name*='customFields.field_']").parent().parent().hide();
            $(document).on("input","input[name='orderComment']",function(){
                orderComment=$(this).val();
            });
            $(document).on("input","#purchaseOrderNumber",function(){
                purchaseOrderNumber=$(this).val();
            });
            $(document).on("blur","#purchaseOrderNumber",function(){
                    const options = state.data.getCheckout();
                    if( orderComment!="")
                    {
                        commentData=orderComment;
                    }
                    if(purchaseOrderNumber!="")
                    {
                        if(commentData!="")
                        {
                            commentData+=" | ";
                        }
                        commentData +=" PO Number :"+purchaseOrderNumber;
                    }
                  
                    if(commentData!=null && commentData!=""){
                    
                        options.customerMessage=commentData;
                        thisthis.updateCheckout(options);
                    }
            });

            
            // start shipping  for the organization type 
            var isRequired=true;
            if(!Currentcustomer.isGuest){
                $.ajax({
                    url:window.origin+"/account.php?action=account_details",
                    success: function(data){
                                if(data!=undefined)
                                {
                                    $.each($(data).find("form[data-edit-account-form] select[data-label*='Which best describes you or your organization?'] option"),function(){
                                                if($(this).is(":selected") && $(this).val()!="")
                                                {
                                                            isRequired=false;
                                                            origanizationName=$(this).val();
                                                }
                                    });
                            }
                    },
                    error:function(err){
                        console.log(err);
        
                    }
                });
           }

           // billing section hide question field
           let BillingObserver = new MutationObserver(obj => {
            $(".checkout-step--billing form select[name*='customFields.field_']").parent().parent().hide();
           });

           var billingSection = document.querySelectorAll(".checkout-step--billing")[0];
                    var config = {childList: true};
                    if(billingSection!=undefined)
                    {
                        BillingObserver.observe(billingSection, {
                              childList: true, // observe direct children
                              subtree: true, // and lower descendants too
                              characterDataOldValue: true // pass old data to callback
                          });
                     }
                     // billing section question is hidden end code

                let ShipObserver = new MutationObserver(obj => {
                    
                    if(Currentcustomer.isGuest)
                    {
                        const shippingButton = document.getElementById('checkout-shipping-continue');
                        if(shippingButton!=undefined)
                        {
                            $(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']").prev("label").find("small").hide();

                            shippingButton.addEventListener("click", CheckShippingValidation, false);
                        }
                    }else{

                        $(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']").parent(".dynamic-form-field").hide();

                        if(isRequired)
                        {
                            const shippingButton = document.getElementById('checkout-shipping-continue');
                            if(shippingButton!=undefined)
                            {
                                $(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']").prev("label").find("small").hide();
                                shippingButton.addEventListener("click", CheckShippingValidation, false);
                            }
                        }else{
                            if(origanizationName!="")
                            {
                                $(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_'] option[value='"+origanizationName+"']").attr("selected","selected");
                                $(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']").parent(".dynamic-form-field").hide();
                                if(document.querySelector(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']")!=undefined)
                                {
                                     document.querySelector(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']").parentElement.style.visibility='hidden';
                                     $(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']").parent().hide();
                                }
                            }
                            
                        }
                    }

                    if(!isRequired && !Currentcustomer.isGuest)
                    {
                        if(document.querySelector(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']")!=undefined)
                        {
                        document.querySelector(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']").parentElement.style.visibility='hidden';
                        }
                    }

                    const options = state.data.getCheckout();
                   
                    if( orderComment!="")
                    {
                        commentData=orderComment;
                    }
                   
                    if(purchaseOrderNumber!="")
                    {
                        if(commentData!="")
                        {
                            commentData+=" | ";
                        }
                        commentData +=" PO Number :"+purchaseOrderNumber;
                    }
                  
                    if(commentData!=null && commentData!=""){
                    
                        options.customerMessage=commentData;
                        thisthis.updateCheckout(options);
                    }

                });
                    var shippingSection = document.querySelectorAll(".checkout-step--shipping")[0];
                    var config = {childList: true};
                    if(shippingSection!=undefined)
                    {
                          ShipObserver.observe(shippingSection, {
                              childList: true, // observe direct children
                              subtree: true, // and lower descendants too
                              characterDataOldValue: true // pass old data to callback
                          });
                     }

                // close shipping customization for making organization required.      
                    // payment observer for purchase on account and purchase order number
                
                     var flag=0;
                let paymentObserver = new MutationObserver(obj => {
                     commentData="";

                     const paymentButton = document.getElementById('checkout-payment-continue');
                     const mpaymentButton = document.getElementById('checkout-payment-continue-moneyOrder');
                     
                        if(paymentButton!=undefined)
                        {
                            paymentButton.addEventListener("click", CheckPaymentValidation, false);
                        }
                        if(mpaymentButton!=undefined)
                        {
                            mpaymentButton.addEventListener("click", CheckPaymentValidation, false);   
                        }

                    if($("form.checkout-form fieldset.newpurchaseOrderFieldset").length<=0)
                    {
                        $("form.checkout-form fieldset.newpurchaseOrderFieldset").remove();
                        var newField="<fieldset class='newpurchaseOrderFieldset'><div class='form-body'><label class='form-label optimizedCheckout-form-label'>Purchase Order Number </label><input class='form-input optimizedCheckout-form-input' type='text' name='purchaseOrderNumber' id='purchaseOrderNumber'></div></fieldset>";
                        $(newField).insertBefore($("form.checkout-form[data-test='payment-form'] .form-actions"));
                    }
                    const options = state.data.getCheckout();
                 
                    if( orderComment!="")
                    {
                        commentData=orderComment;
                    }
                    if(purchaseOrderNumber!="")
                    {
                        if(commentData!="")
                        {
                            commentData+=" | ";
                        }
                        commentData +=" PO Number :"+purchaseOrderNumber;
                    }
                  
                    if(commentData!=null && commentData!=""){
                    
                        options.customerMessage=commentData;
                        thisthis.updateCheckout(options);
                    }

                    if(purchaseOrderNumber!="")
                    {
                        $("#purchaseOrderNumber").val(purchaseOrderNumber);
                    }
                
              });
              var paymentSection = document.querySelectorAll(".checkout-step--payment")[0];
           
              if(paymentSection!=undefined)
              {   
                   var config = {childList: true};
                    paymentObserver.observe(paymentSection, {
                        childList: true, // observe direct children
                        subtree: true, // and lower descendants too
                        characterDataOldValue: true // pass old data to callback
                    });
              }
            // close payment code
        }, 2000);

      async function CheckPaymentValidation(e)
        {
            var commentData="";
           
            this.checkoutId = document.querySelector(".checkoutHeader").dataset.checkoutId;
            let state;
            if(this.checkoutId!=undefined &&  this.checkoutId!="")
            {
             this.service = createCheckoutService();
            // await this.service.updateShippingAddress(state.data.getShippingAddress());
                if(Check_Id!="")
                {
                    state = await this.service.loadCheckout(Check_Id);
                }else{
                    state = await this.service.loadCheckout();
                }

            }else{
                this.service = createCheckoutService();
                if(Check_Id!="")
                {
                    state = await this.service.loadCheckout(Check_Id);
                }else{
                    state = await this.service.loadCheckout();
                }
            }
            const options = state.data.getCheckout();
            if( orderComment!="")
            {
                commentData=orderComment;
            }
            if(purchaseOrderNumber!="")
            {
                if(commentData!="")
                {
                    commentData+=" | ";
                }
                commentData +=" PO Number :"+purchaseOrderNumber;
            }
          
                    if(commentData!=null && commentData!=""){
                            options.customerMessage=commentData;
                            if(this.service!=undefined)
                            {
                                await this.service.updateCheckout(options);
                            }else{
                                e.preventDefault();
                                console.log("service is not avail");
                            }
                            $("#purchaseOrderNumber").val(purchaseOrderNumber);
                    }else{
                        e.preventDefault();
                    }
        }
       function CheckShippingValidation(e){
        
            var OrgtypeField=$(".checkout-step--shipping form select[name*='shippingAddress.customFields.field_']");
            var chk=false;
            if($(OrgtypeField)!=undefined && $(OrgtypeField).val()=="")
            {
                e.preventDefault();
                chk=false;
                $(OrgtypeField).parent('.form-field').addClass("form-field--error");
                $(OrgtypeField).parent('.form-field').find('.form-field--error').remove();
                var msg="Please Choose your Organization";
                $("<div class='form-field--error'><span class='form-inlineMessage'>"+msg+"</span></div>").insertAfter($(OrgtypeField));
          
            }else{
                
                chk=true;
                $(OrgtypeField).parent('.form-field').find('.form-field--error').remove();
                $(OrgtypeField).parent('.form-field').removeClass("form-field--error");
            }
            if(chk)
            {
                $(".checkout-step--shipping form div.form-actions button").show();
                $(".checkout-step--shipping form div.form-actions button#checkout-shipping-continue").trigger("click");
            }
      }
           var c=0;
           var purchaseorder= $("form.checkout-form[data-test='payment-form'] .newpurchaseOrderFieldset #purchaseOrderNumber");
            var btn="<button id='checkout-payment-continue' class='button button--action button--large button--slab optimizedCheckout-buttonPrimary' type='submit'>Place Order</button>";
            var newButton="<input type='button' id='checkout-payment-continue-moneyOrder' class='button button--action button--large button--slab' value='Place Order'/>";       
                $(document).on("click","#checkout-payment-continue-moneyOrder",async function(e){
                      e.preventDefault();
                      c=0;
                      // var purchaseorder= $("form.checkout-form li.form-checklist-item--selected #purchase-order-script-body .form-field--order-number input");
                      purchaseorder= $("form.checkout-form[data-test='payment-form'] .newpurchaseOrderFieldset #purchaseOrderNumber");
                      if($(purchaseorder)!=undefined && $(purchaseorder).val()=="")
                      {
                            c++;
                            $(purchaseorder).parent('.form-body').addClass("form-field--error");
                            $(purchaseorder).parent('.form-body').find('.form-field--error').remove();
                            var msg="Please enter Purchase Order number";
                            $("<div class='form-field--error'><span class='form-inlineMessage'>"+msg+"</span></div>").insertAfter($(purchaseorder));
                      }else{
                             $(purchaseorder).parent('.form-body').find('.form-field--error').remove();
                             $(purchaseorder).parent('.form-body').removeClass("form-field--error");
                      }
                      //const options = state.data.getCheckout();
                       if(c==0)
                      {
                        const options = state.data.getCheckout();
                                commentData="";
                        
                                if( orderComment!="")
                                {
                                    commentData=orderComment;
                                }
                                if(purchaseOrderNumber!="")
                                {
                                    if(commentData!="")
                                    {
                                        commentData+=" | ";
                                    }
                                    commentData +=" PO Number :"+purchaseOrderNumber;
                                }
                            
                                if(commentData!=null && commentData!=""){
                                
                                    options.customerMessage=commentData;
                                await thisthis.updateCheckout(options);
                                }

                          $("form.checkout-form[data-test='payment-form'] .form-actions input#checkout-payment-continue-moneyOrder ").remove();
                          $("form.checkout-form[data-test='payment-form'] .form-actions button#checkout-payment-continue ").show();
                         $("#checkout-payment-continue").trigger("click");
                         return true;
                      }else{
                     
                      return false;
                  }
              });

                var newField="<fieldset class='newpurchaseOrderFieldset'><div class='form-body'><label class='form-label optimizedCheckout-form-label'>Purchase Order Number </label><input class='form-input optimizedCheckout-form-input' type='text' name='purchaseOrderNumber' id='purchaseOrderNumber'></div></fieldset>";
                $("form.checkout-form fieldset.newpurchaseOrderFieldset").remove();
                $(newField).insertBefore($("form.checkout-form[data-test='payment-form'] .form-actions"));

              $(document).on("click","form.checkout-form[data-test='payment-form'] .form-checklist-header input[name='paymentProviderRadio']",async function(e){
                 var id=$(this).attr("id");
                 purchaseorder= $("form.checkout-form[data-test='payment-form'] .newpurchaseOrderFieldset #purchaseOrderNumber");
                 $(purchaseorder).parent('.form-body').find('.form-field--error').remove();
                 $(purchaseorder).parent('.form-body').removeClass("form-field--error");

                     // e.preventDefault();
                  $("form.checkout-form[data-test='payment-form'] .form-actions button#checkout-payment-continue").hide();
                  if(id=="radio-paypalcommerce" && $(this).is(":checked"))
                  {
                             $("form.checkout-form[data-test='payment-form'] .form-actions button#checkout-payment-continue ").show();
                             $("form.checkout-form[data-test='payment-form'] .form-actions input#checkout-payment-continue-moneyOrder").remove();
                  }else if(id=="radio-moneyorder" && $(this).is(":checked")){
                              $("form.checkout-form[data-test='payment-form'] .form-actions button#checkout-payment-continue").hide();
                              $("form.checkout-form[data-test='payment-form'] .form-actions input#checkout-payment-continue-moneyOrder").remove();
                              $("form.checkout-form[data-test='payment-form'] .form-actions").append(newButton);
                           
                              $("form.checkout-form li.form-checklist-item--selected #purchase-order-script-body .form-field--order-number").hide();
                              $("form.checkout-form li.form-checklist-item--selected #purchase-order-script-body .form-field--certificate").hide();
                           
                             $("form.checkout-form").removeAttr("novalidate");
                  }else{
                     $("form.checkout-form[data-test='payment-form'] .form-actions input#checkout-payment-continue-moneyOrder ").remove();
                       $("form.checkout-form[data-test='payment-form'] .form-actions button#checkout-payment-continue ").show();
                  }  
              });
          
        // validate on change

    }

}
