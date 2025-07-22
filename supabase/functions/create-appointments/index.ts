
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

    // Get the accepted proposal with additional validation
    const { data: proposal, error: proposalError } = await supabase
      .from('appointment_proposals')
      .select(`
        *,
        appointment_types(name, default_duration),
        peer_specialists!inner(id, user_id, first_name, last_name),
        profiles!inner(first_name, last_name)
      `)
      .eq('id', proposalId)
      .eq('status', 'accepted')
      .single();

    if (proposalError) {
      console.error('[create-appointments] Error fetching proposal:', proposalError);
      throw new Error(`Failed to fetch proposal: ${proposalError.message}`);
    }

    if (!proposal) {
      throw new Error('Accepted proposal not found or proposal not in accepted state');
    }

    console.log(`[create-appointments] Found proposal:`, {
      id: proposal.id,
      title: proposal.title,
      specialist_id: proposal.specialist_id,
      user_id: proposal.user_id,
      status: proposal.status
    });

    const appointments = [];
    
    if (isRecurring) {
      // Calculate recurring appointment dates
      const startDate = new Date(`${proposal.start_date}T${proposal.start_time}`);
      console.log(`[create-appointments] Creating ${proposal.occurrences} recurring appointments starting ${startDate}`);
      
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
          description: proposal.description || `Recurring appointment: ${proposal.title} (Session ${i + 1}/${proposal.occurrences})`
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

    // Create appointments in both tables with better error handling
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

    // Insert into scheduled_appointments table with retry logic
    console.log('[create-appointments] Inserting into scheduled_appointments table');
    const { data: createdScheduledAppointments, error: scheduledError } = await supabase
      .from('scheduled_appointments')
      .insert(scheduledAppointments)
      .select();

    if (scheduledError) {
      console.error('[create-appointments] Error creating scheduled appointments:', scheduledError);
      throw new Error(`Failed to create scheduled appointments: ${scheduledError.message}`);
    }

    console.log(`[create-appointments] Created ${createdScheduledAppointments?.length || 0} scheduled appointments`);

    // Insert into specialist_appointments table
    console.log('[create-appointments] Inserting into specialist_appointments table');
    const { data: createdSpecialistAppointments, error: specialistError } = await supabase
      .from('specialist_appointments')
      .insert(specialistAppointments)
      .select();

    if (specialistError) {
      console.error('[create-appointments] Error creating specialist appointments:', specialistError);
      
      // If specialist appointments fail, try to clean up scheduled appointments
      if (createdScheduledAppointments && createdScheduledAppointments.length > 0) {
        console.log('[create-appointments] Cleaning up scheduled appointments due to specialist appointment failure');
        await supabase
          .from('scheduled_appointments')
          .delete()
          .in('id', createdScheduledAppointments.map(sa => sa.id));
      }
      
      throw new Error(`Failed to create specialist appointments: ${specialistError.message}`);
    }

    console.log(`[create-appointments] Created ${createdSpecialistAppointments?.length || 0} specialist appointments`);

    // Log the successful appointment creation
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: proposal.user_id,
        action: 'appointments_created',
        type: 'appointment_management',
        details: JSON.stringify({
          proposal_id: proposalId,
          appointment_count: appointments.length,
          is_recurring: isRecurring,
          specialist_id: proposal.specialist_id,
          created_at: new Date().toISOString()
        })
      });

    console.log(`[create-appointments] Successfully created appointments and logged activity`);

    const response = {
      success: true,
      message: `Successfully created ${appointments.length} ${isRecurring ? 'recurring' : 'single'} appointment(s)`,
      data: {
        scheduledAppointments: createdScheduledAppointments,
        specialistAppointments: createdSpecialistAppointments,
        proposal: {
          id: proposal.id,
          title: proposal.title,
          specialist_name: `${proposal.peer_specialists.first_name} ${proposal.peer_specialists.last_name}`,
          client_name: `${proposal.profiles.first_name} ${proposal.profiles.last_name}`
        }
      }
    };

    console.log('[create-appointments] Returning success response');
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[create-appointments] Error:', error);
    
    // Log the error for monitoring
    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: 'system',
          action: 'appointment_creation_failed',
          type: 'error',
          details: JSON.stringify({
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          })
        });
    } catch (logError) {
      console.error('[create-appointments] Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
