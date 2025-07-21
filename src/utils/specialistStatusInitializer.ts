
import { supabase } from '@/integrations/supabase/client';

export const initializeSpecialistStatuses = async () => {
  try {
    console.log('Checking for specialists without status records...');
    
    // Get all active specialists
    const { data: specialists, error: specialistsError } = await supabase
      .from('peer_specialists')
      .select('id, first_name, last_name')
      .eq('is_active', true);

    if (specialistsError) {
      console.error('Error fetching specialists:', specialistsError);
      return;
    }

    if (!specialists || specialists.length === 0) {
      console.log('No specialists found');
      return;
    }

    // Get existing status records
    const { data: existingStatuses, error: statusError } = await supabase
      .from('specialist_status')
      .select('specialist_id');

    if (statusError) {
      console.error('Error fetching existing statuses:', statusError);
      return;
    }

    const existingStatusIds = new Set(existingStatuses?.map(s => s.specialist_id) || []);
    const specialistsNeedingStatus = specialists.filter(s => !existingStatusIds.has(s.id));

    console.log(`Found ${specialistsNeedingStatus.length} specialists needing status records`);

    // Create status records for specialists that don't have them
    for (const specialist of specialistsNeedingStatus) {
      console.log(`Creating status record for ${specialist.first_name} ${specialist.last_name}`);
      
      const { error: insertError } = await supabase
        .from('specialist_status')
        .insert({
          specialist_id: specialist.id,
          status: 'offline',
          last_seen: new Date().toISOString()
        });

      if (insertError) {
        console.error(`Error creating status for specialist ${specialist.id}:`, insertError);
      } else {
        console.log(`✓ Created status record for ${specialist.first_name} ${specialist.last_name}`);
      }
    }

    console.log('Specialist status initialization complete');
  } catch (error) {
    console.error('Error initializing specialist statuses:', error);
  }
};
