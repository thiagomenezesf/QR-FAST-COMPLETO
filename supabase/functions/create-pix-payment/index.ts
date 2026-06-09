import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { eventId, userId, amount, email, fullName, quantity } = await req.json()

    // Validação básica de segurança
    if (!amount || amount <= 0) throw new Error('Valor inválido')

    // --- CORREÇÃO DE PRECISÃO NUMÉRICA ---
    // Garante que o valor total tenha no máximo 2 casas decimais (ex: 0.30)
    const finalAmount = Number(Number(amount).toFixed(2));
    
    // Calcula o preço individual limpo para o banco de dados
    const individualPrice = Number((finalAmount / quantity).toFixed(2));

    // Formata o nome para garantir que tenha Nome e Sobrenome
    const nameParts = (fullName || 'Usuario QR').trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Fast'

    // 1. Chamada para o Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: finalAmount, // Enviando o valor arredondado
        description: `Ingresso: QR Fast`,
        payment_method_id: 'pix',
        payer: {
          email: email || 'test@test.com',
          first_name: firstName,
          last_name: lastName,
        },
      }),
    })

    const mpData = await mpResponse.json()

    if (mpData.status === 400 || !mpData.id) {
      console.error('Erro MP:', mpData)
      throw new Error(mpData.message || 'Erro no Mercado Pago')
    }

    // 2. Conectar ao Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const ticketsToInsert = Array.from({ length: quantity }).map(() => ({
      event_id: eventId,
      user_id: userId,
      owner_name: fullName,
      owner_email: email,
      price: individualPrice, // Preço individual arredondado
      status: 'pending',
      payment_status: 'pending',
      payment_id: mpData.id.toString(),
    }))

    const { error: dbError } = await supabase.from('tickets').insert(ticketsToInsert)
    if (dbError) throw dbError

    return new Response(
      JSON.stringify({
        payment_id: mpData.id,
        qr_code: mpData.point_of_interaction.transaction_data.qr_code_base64,
        qr_code_copy_paste: mpData.point_of_interaction.transaction_data.qr_code,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})