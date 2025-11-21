import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Appointment {
  id?: string
  barber_id: string
  client_name: string
  client_phone: string
  date: string // YYYY-MM-DD
  time_slot: string // ex: "14:00"
  service_id: string
  created_at?: string
}

/**
 * Busca horários ocupados para um barbeiro em uma data específica
 */
export async function fetchOccupiedSlots(barberId: string, date: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('time_slot')
    .eq('barber_id', barberId)
    .eq('date', date)

  if (error) {
    console.error('Erro ao buscar horários ocupados:', error)
    return []
  }

  return data?.map(appointment => appointment.time_slot) || []
}

/**
 * Verifica se um horário específico está disponível (Safety Check para Race Condition)
 */
export async function isSlotAvailable(
  barberId: string, 
  date: string, 
  timeSlot: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('barber_id', barberId)
    .eq('date', date)
    .eq('time_slot', timeSlot)
    .maybeSingle()

  if (error) {
    console.error('Erro ao verificar disponibilidade:', error)
    return false
  }

  // Se não encontrou nenhum registro, o horário está disponível
  return data === null
}

/**
 * Cria um novo agendamento com verificação de conflito
 */
export async function createAppointment(appointment: Appointment): Promise<{
  success: boolean
  message: string
  data?: Appointment
}> {
  // Safety Check: Verificar se o horário ainda está disponível
  const isAvailable = await isSlotAvailable(
    appointment.barber_id,
    appointment.date,
    appointment.time_slot
  )

  if (!isAvailable) {
    return {
      success: false,
      message: 'Desculpe, este horário acabou de ser reservado. Escolha outro.'
    }
  }

  // Inserir o agendamento
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointment])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar agendamento:', error)
    return {
      success: false,
      message: 'Erro ao criar agendamento. Tente novamente.'
    }
  }

  return {
    success: true,
    message: 'Agendamento confirmado com sucesso!',
    data
  }
}
