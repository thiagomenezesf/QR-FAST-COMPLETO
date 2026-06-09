import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Corpo recebido da Webhook:", JSON.stringify(body));

    const type = body.type;
    const dataId = body.data?.id;

    if (type === 'payment') {
      const mpToken = Deno.env.get('MP_ACCESS_TOKEN');
      console.log(`Consultando pagamento ${dataId} no Mercado Pago...`);
      
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { 'Authorization': `Bearer ${mpToken}` }
      });
      
      const paymentData = await mpRes.json();
      console.log("Status retornado pelo Mercado Pago:", paymentData.status);

      // No modo de teste do simulador, o status pode vir como 'approved' ou 'pending'
      // Vamos aceitar 'approved' para validar o ingresso
      if (paymentData.status === 'approved') {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { error } = await supabase
          .from('tickets')
          .update({ 
            payment_status: 'paid',
            status: 'valid'
          })
          .eq('payment_id', dataId.toString());

        if (error) {
          console.error("Erro ao atualizar banco:", error.message);
          throw error;
        }
        
        console.log("✅ Banco atualizado com sucesso!");
      } else {
        console.log("⚠️ Pagamento ainda não está aprovado.");
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("❌ Erro na execução da função:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200 }); // Retornamos 200 pro MP não ficar tentando reenviar
  }
})