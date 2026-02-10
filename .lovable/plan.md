
# Option C: Enhanced Recovery Calendar + Journey History Tab

This plan enhances both the Recovery Calendar and the Recovery Journey screens to give users a comprehensive view of their 90-day journey history.

## Part 1: Enhanced Recovery Calendar (Day Detail Popup)

Currently, tapping a completed day on the calendar shows basic activity info. We will enrich this dialog to include:

- **Day title and completion date/time**
- **Activity summary** (what the day's activity was, which tool was used)
- **User's journaling responses** (reflections, gratitude entries, trigger identifications -- the actual text they wrote)
- **Tools used** (badges for each recovery tool engaged that day)
- **Mood/wellness data** if available from daily stats

The existing helper functions (`getActivitiesForDay`, `getJournalingResponsesForDay`, `getToolsUsedForDay`) already extract this data. The enhancement focuses on richer presentation and adding mood/wellness data from `user_daily_stats`.

## Part 2: Journey History Tab in Recovery Journey

Add a "History" tab to the Recovery Journey screen so users can toggle between:

- **Progress** (current view -- upcoming days, progress bar)
- **History** (scrollable timeline of all completed days)

The History tab will display:

- A reverse-chronological list of completed days
- Each entry shows: day number, title, completion date, activity performed, tool used, and a preview of any journaling responses
- Tapping an entry expands it to show full details (responses, tools, mood data)
- A summary header showing total completed days, current streak, and completion rate

---

## Technical Details

### Files Modified

1. **`src/components/RecoveryCalendar.tsx`**
   - Enhance the "Completed Day Details" dialog (lines 526-607) with:
     - Better visual hierarchy and more detailed activity info
     - Mood/wellness data section pulled from `userData.dailyStats` or journey responses
     - Empty-state messaging when no reflections were recorded

2. **`src/components/RecoveryJourney.tsx`**
   - Add `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` from the existing UI components
   - Wrap the current content in a "Progress" tab
   - Add a "History" tab containing a new `JourneyHistoryTimeline` component
   - Import `ScrollArea` for the scrollable history list

3. **`src/components/JourneyHistoryTimeline.tsx`** (new file)
   - Receives `userData` as a prop
   - Reads `completedDays`, `completionDates`, and `journeyResponses` from userData
   - Loads journey day metadata from `journeyData.json` for titles/activities
   - Renders a scrollable, reverse-chronological list of completed days
   - Each item is expandable (accordion or collapsible) to show full journaling responses and tools used
   - Includes a summary stats header (days completed, completion %, streak)

### Data Sources (no new DB tables needed)

All data already exists in:
- `userData.journeyProgress.completedDays` -- which days are done
- `userData.journeyProgress.completionDates` -- when each day was completed
- `userData.journeyResponses` -- all text responses keyed by `day_X_activityType`
- `journeyData.json` -- static day metadata (titles, activities, tools)

### UI Components Used (all existing)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `ScrollArea`
- `Card`
- `Collapsible` (for expandable history entries)
- `Badge` (for tool tags)
- Lucide icons (`CheckCircle2`, `ChevronDown`, `FileText`, `Flame`)
