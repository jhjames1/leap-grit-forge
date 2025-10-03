
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface CreateAppointmentsRequest {
  proposalId: string;
  isRecurring?: boolean;
}

serve(async (req) => {
  console.log(`[create-appointments] Request received: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, isRecurring = false }: CreateAppointmentsRequest = await req.json();
    console.log(`[create-appointments] Processing proposal: ${proposalId}, isRecurring: ${isRecurring}`);

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
      console.error('[create-appointments] Error fetching proposal:', proposalError);
      throw proposalError;
    }

    if (!proposal) {
      throw new Error('Accepted proposal not found');
    }

    console.log(`[create-appointments] Found proposal:`, proposal);

    const appointments = [];
    
    if (isRecurring) {
      // Calculate recurring appointment dates
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
          appointment_date: appointmentDate,
          appointment_end: appointmentEnd,
          title: proposal.title,
          description: proposal.description || `Recurring appointment: ${proposal.title}`
        });
      }
    } else {
      // Single appointment
      const appointmentDate = new Date(`${proposal.start_date}T${proposal.start_time}`);
      const appointmentEnd = new Date(appointmentDate);
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + proposal.duration);

      appointments.push({
        appointment_date: appointmentDate,
        appointment_end: appointmentEnd,
        title: proposal.title,
        description: proposal.description || `Single appointment: ${proposal.title}`
      });
    }

    console.log(`[create-appointments] Creating ${appointments.length} appointments`);

    // Create appointments in both tables
    const scheduledAppointments = [];
    const specialistAppointments = [];

    for (const apt of appointments) {
      // For scheduled_appointments table (client view)
      scheduledAppointments.push({
        proposal_id: proposal.id,
        specialist_id: proposal.specialist_id,
        user_id: proposal.user_id,
        appointment_type_id: proposal.appointment_type_id,
        scheduled_start: apt.appointment_date.toISOString(),
        scheduled_end: apt.appointment_end.toISOString(),
        status: 'scheduled',
        meeting_type: 'chat',
        notes: apt.description
      });

      // For specialist_appointments table (specialist view)
      specialistAppointments.push({
        specialist_id: proposal.specialist_id,
        user_id: proposal.user_id,
        appointment_type_id: proposal.appointment_type_id,
        scheduled_start: apt.appointment_date.toISOString(),
        scheduled_end: apt.appointment_end.toISOString(),
        status: 'scheduled',
        meeting_type: 'chat',
        notes: apt.description
      });
    }

    // Insert into scheduled_appointments table
    const { data: createdScheduledAppointments, error: scheduledError } = await supabase
      .from('scheduled_appointments')
      .insert(scheduledAppointments)
      .select();

    if (scheduledError) {
      console.error('[create-appointments] Error creating scheduled appointments:', scheduledError);
      throw scheduledError;
    }

    // Insert into specialist_appointments table
    const { data: createdSpecialistAppointments, error: specialistError } = await supabase
      .from('specialist_appointments')
      .insert(specialistAppointments)
      .select();

    if (specialistError) {
      console.error('[create-appointments] Error creating specialist appointments:', specialistError);
      throw specialistError;
    }

    console.log(`[create-appointments] Successfully created appointments:`, {
      scheduled: createdScheduledAppointments,
      specialist: createdSpecialistAppointments
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${appointments.length} ${isRecurring ? 'recurring' : 'single'} appointment(s)`,
        scheduledAppointments: createdScheduledAppointments,
        specialistAppointments: createdSpecialistAppointments
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[create-appointments] Error:', error);
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
