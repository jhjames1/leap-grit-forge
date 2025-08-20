import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { proposalId } = await req.json();

    if (!proposalId) {
      return new Response(
        JSON.stringify({ error: 'Proposal ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the proposal details
    const { data: proposal, error: proposalError } = await supabase
      .from('appointment_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      return new Response(
        JSON.stringify({ error: 'Proposal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create scheduled appointments and specialist appointments with proper linking
    const scheduledAppointments = [];
    const specialistAppointments = [];

    // Generate appointment dates based on frequency
    const startDate = new Date(proposal.start_date);
    const startDateTime = new Date(`${proposal.start_date}T${proposal.start_time}`);
    const endDateTime = new Date(startDateTime.getTime() + proposal.duration * 60 * 1000);

    for (let i = 0; i < proposal.occurrences; i++) {
      let appointmentStart = new Date(startDateTime);
      let appointmentEnd = new Date(endDateTime);

      // Calculate date based on frequency
      if (proposal.frequency === 'weekly') {
        appointmentStart.setDate(appointmentStart.getDate() + (i * 7));
        appointmentEnd.setDate(appointmentEnd.getDate() + (i * 7));
      } else if (proposal.frequency === 'daily') {
        appointmentStart.setDate(appointmentStart.getDate() + i);
        appointmentEnd.setDate(appointmentEnd.getDate() + i);
      } else if (proposal.frequency === 'monthly') {
        appointmentStart.setMonth(appointmentStart.getMonth() + i);
        appointmentEnd.setMonth(appointmentEnd.getMonth() + i);
      }

      // Create scheduled appointment first
      const { data: scheduledAppointment, error: scheduledError } = await supabase
        .from('scheduled_appointments')
        .insert({
          user_id: proposal.user_id,
          specialist_id: proposal.specialist_id,
          appointment_type_id: proposal.appointment_type_id,
          scheduled_start: appointmentStart.toISOString(),
          scheduled_end: appointmentEnd.toISOString(),
          status: 'scheduled',
          meeting_type: 'video_call',
          title: proposal.title,
          description: proposal.description
        })
        .select()
        .single();

      if (scheduledError) {
        console.error('Error creating scheduled appointment:', scheduledError);
        throw scheduledError;
      }

      scheduledAppointments.push(scheduledAppointment);

      // Create specialist appointment with reference to scheduled appointment
      const { data: specialistAppointment, error: specialistError } = await supabase
        .from('specialist_appointments')
        .insert({
          specialist_id: proposal.specialist_id,
          user_id: proposal.user_id,
          appointment_type_id: proposal.appointment_type_id,
          scheduled_start: appointmentStart.toISOString(),
          scheduled_end: appointmentEnd.toISOString(),
          status: 'scheduled',
          scheduled_appointment_id: scheduledAppointment.id, // Link to scheduled appointment
          title: proposal.title,
          description: proposal.description
        })
        .select()
        .single();

      if (specialistError) {
        console.error('Error creating specialist appointment:', specialistError);
        throw specialistError;
      }

      specialistAppointments.push(specialistAppointment);
    }

    // Update proposal status to accepted
    const { error: updateError } = await supabase
      .from('appointment_proposals')
      .update({ 
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (updateError) {
      console.error('Error updating proposal:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_appointments: scheduledAppointments,
        specialist_appointments: specialistAppointments,
        message: `Successfully created ${proposal.occurrences} synchronized appointments`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-appointment-creation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});