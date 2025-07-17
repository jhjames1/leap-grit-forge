import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface CreateRecurringAppointmentsRequest {
  proposalId: string;
}

serve(async (req) => {
  console.log(`[create-recurring-appointments] Request received: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId }: CreateRecurringAppointmentsRequest = await req.json();
    console.log(`[create-recurring-appointments] Processing proposal: ${proposalId}`);

    if (!proposalId) {
      throw new Error('Proposal ID is required');
    }

    // Get the accepted proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('appointment_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('status', 'accepted')
      .single();

    if (proposalError) {
      console.error('[create-recurring-appointments] Error fetching proposal:', proposalError);
      throw proposalError;
    }

    if (!proposal) {
      throw new Error('Accepted proposal not found');
    }

    console.log(`[create-recurring-appointments] Found proposal:`, proposal);

    // Calculate recurring appointment dates
    const appointments = [];
    const startDate = new Date(`${proposal.start_date}T${proposal.start_time}`);
    
    for (let i = 0; i < proposal.occurrences; i++) {
      const appointmentDate = new Date(startDate);
      
      // Calculate the date based on frequency
      switch (proposal.frequency) {
        case 'weekly':
          appointmentDate.setDate(startDate.getDate() + (i * 7));
          break;
        case 'biweekly':
          appointmentDate.setDate(startDate.getDate() + (i * 14));
          break;
        case 'monthly':
          appointmentDate.setMonth(startDate.getMonth() + i);
          break;
        default:
          throw new Error(`Invalid frequency: ${proposal.frequency}`);
      }

      const appointmentEnd = new Date(appointmentDate);
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + proposal.duration);

      appointments.push({
        proposal_id: proposal.id,
        specialist_id: proposal.specialist_id,
        user_id: proposal.user_id,
        appointment_type_id: proposal.appointment_type_id,
        scheduled_start: appointmentDate.toISOString(),
        scheduled_end: appointmentEnd.toISOString(),
        status: 'scheduled',
        meeting_type: 'chat'
      });
    }

    console.log(`[create-recurring-appointments] Creating ${appointments.length} appointments`);

    // Insert all appointments
    const { data: createdAppointments, error: insertError } = await supabase
      .from('scheduled_appointments')
      .insert(appointments)
      .select();

    if (insertError) {
      console.error('[create-recurring-appointments] Error creating appointments:', insertError);
      throw insertError;
    }

    console.log(`[create-recurring-appointments] Successfully created appointments:`, createdAppointments);

    // Also create entries in specialist_appointments table for calendar integration
    const specialistAppointments = appointments.map(apt => ({
      specialist_id: apt.specialist_id,
      user_id: apt.user_id,
      appointment_type_id: apt.appointment_type_id,
      scheduled_start: apt.scheduled_start,
      scheduled_end: apt.scheduled_end,
      status: 'scheduled',
      meeting_type: 'chat',
      notes: `Recurring appointment: ${proposal.title}`
    }));

    const { error: specialistError } = await supabase
      .from('specialist_appointments')
      .insert(specialistAppointments);

    if (specialistError) {
      console.error('[create-recurring-appointments] Error creating specialist appointments:', specialistError);
      // Don't throw here as the main appointments were created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${appointments.length} recurring appointments`,
        appointments: createdAppointments
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[create-recurring-appointments] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});