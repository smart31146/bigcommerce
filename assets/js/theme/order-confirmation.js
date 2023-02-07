
import { createCheckoutService } from "@bigcommerce/checkout-sdk";
import { eq } from "lodash";
var CurrentOrder="";
$(document).ready(async function(){
    this.service = createCheckoutService();
  let orderId=$("#checkout_orderId").attr("data-test-orderId");
    if(orderId!="")
    {
        let state= await this.service.loadOrder(orderId);
        let CurrentOrder=state.data.getOrder();
        let Custom_fld="";
        if(CurrentOrder.customerMessage!="")
        {
            Custom_fld=CurrentOrder.customerMessage;
        }
           setTimeout(function(){

                if(Custom_fld!="")
                {
                    if(Custom_fld.indexOf("|")!==-1)
                    {
                        var splitone=Custom_fld.split("|");
                        document.getElementsByClassName('orderConfirmation-section')[0].innerHTML+="<p>"+splitone[1]+"</p>";
                    }else{
                        document.getElementsByClassName('orderConfirmation-section')[0].innerHTML+="<p>"+Custom_fld+"</p>";
                    }
                   
                }

            },2000);
       
    }
});
