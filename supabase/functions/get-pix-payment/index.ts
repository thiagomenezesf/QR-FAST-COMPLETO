import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentId } = await req.json()

    if (!paymentId) {
      throw new Error('paymentId é obrigatório')
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) {
      throw new Error('MP_ACCESS_TOKEN não configurado')
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok || !mpData?.id) {
      console.error('Erro MP ao consultar pagamento:', mpData)
      throw new Error(mpData?.message || 'Pagamento não encontrado no Mercado Pago')
    }

    const qrCodeData = mpData?.point_of_interaction?.transaction_data

    return new Response(
      JSON.stringify({
        payment_id: mpData.id,
        status: mpData.status,
        date_of_expiration: mpData.date_of_expiration || null,
        qr_code: qrCodeData?.qr_code_base64 || '',
        qr_code_copy_paste: qrCodeData?.qr_code || '',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
