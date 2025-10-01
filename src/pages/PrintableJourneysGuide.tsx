import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const PrintableJourneysGuide = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Print button - hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">LEAP Recovery Journeys Guide</h1>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Guide
        </Button>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Comprehensive Guide to LEAP's 5 Recovery Journeys</h1>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Overview</h2>
            <p>
              LEAP offers five specialized 90-day recovery journeys, each tailored to different focus areas identified during onboarding. 
              Each journey consists of daily activities, tools, and progressive skill-building designed to support addiction recovery. 
              The journeys adapt based on the user's recovery stage and include personalized phase modifiers.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Journey Selection Process</h2>
            <p className="mb-4">During onboarding, users select their primary focus area:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>tough-moments</strong> → Craving Control Journey</li>
              <li><strong>connections</strong> → Connection Boost Journey</li>
              <li><strong>routines</strong> → Routine Builder Journey</li>
              <li><strong>tools</strong> → Toolbox Mastery Journey</li>
              <li><strong>staying-track</strong> → Accountability Path Journey</li>
            </ul>
          </section>

          <section className="mb-12 page-break-before">
            <h2 className="text-3xl font-bold mb-4">Phase Modifiers</h2>
            <p className="mb-4">All journeys are customized based on the user's recovery stage:</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">1. Just Starting Out</h3>
                <p className="mb-2"><strong>Tone:</strong> Gentle, encouraging, and supportive. Focus on small wins and building confidence.</p>
                <p className="mb-2"><strong>Pacing:</strong> Slow and steady with extra explanations. Break complex concepts into simple steps.</p>
                <p><strong>Extras:</strong> Additional reminders, simplified instructions, encouragement messages, basic education, peer mentor introductions</p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-2">2. A Few Weeks In</h3>
                <p className="mb-2"><strong>Tone:</strong> Motivational and progress-focused. Acknowledge growing strength while maintaining support.</p>
                <p className="mb-2"><strong>Pacing:</strong> Moderate pace with skill-building focus. Introduce more challenging concepts gradually.</p>
                <p><strong>Extras:</strong> Progress celebrations, skill-building challenges, community connections, advanced tools, milestone badges</p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-2">3. A Few Months Strong</h3>
                <p className="mb-2"><strong>Tone:</strong> Confident and empowering. Emphasize independence and mastery development.</p>
                <p className="mb-2"><strong>Pacing:</strong> Normal pace with advanced concepts. Focus on refinement and optimization.</p>
                <p><strong>Extras:</strong> Advanced strategies, leadership opportunities, mentoring suggestions, complex scenarios, expert content</p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-2">4. Feeling Steady</h3>
                <p className="mb-2"><strong>Tone:</strong> Maintenance-focused and wisdom-sharing. Emphasize long-term sustainability.</p>
                <p className="mb-2"><strong>Pacing:</strong> Flexible pace allowing for deeper exploration. Focus on mastery and teaching others.</p>
                <p><strong>Extras:</strong> Wisdom-sharing, philosophical content, leadership roles, expert consultation, legacy building</p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-2">5. Restarting After a Pause</h3>
                <p className="mb-2"><strong>Tone:</strong> Compassionate and rebuilding-focused. Emphasize resilience and fresh beginnings.</p>
                <p className="mb-2"><strong>Pacing:</strong> Gentle restart with accelerated rebuilding. Acknowledge past experience while focusing forward.</p>
                <p><strong>Extras:</strong> Relapse recovery strategies, shame resilience, fresh start ceremonies, accelerated review, specialized support</p>
              </div>
            </div>
          </section>

          <section className="mb-12 page-break-before">
            <h2 className="text-3xl font-bold mb-6">Journey 1: Craving Control</h2>
            <p className="text-xl italic mb-4">Focus Area: Managing Tough Moments</p>

            <h3 className="text-2xl font-semibold mb-3">Purpose</h3>
            <p className="mb-4">
              Master the art of understanding, predicting, and overcoming cravings through proven techniques and progressive skill development.
            </p>

            <h3 className="text-2xl font-semibold mb-3">Key Themes</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Trigger identification and management</li>
              <li>Mindfulness and awareness techniques</li>
              <li>Emotional regulation</li>
              <li>Urge surfing and breathing techniques</li>
              <li>Social boundary setting</li>
              <li>Advanced craving prediction and prevention</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Daily Structure (Sample Days)</h3>
            
            <h4 className="text-xl font-semibold mb-2">Week 1: Foundation Building</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Day 1:</strong> Understanding Your Triggers - Identify 3 personal triggers (Urge Tracker)</li>
              <li><strong>Day 2:</strong> The HALT Check - Practice Hungry, Angry, Lonely, Tired technique (Breathing Exercise)</li>
              <li><strong>Day 3:</strong> Creating Safe Spaces - Remove/modify 3 environmental triggers (Gratitude Log)</li>
              <li><strong>Day 4:</strong> The 5-Minute Rule - Wait 5 minutes before urge-driven action (Breathing Exercise)</li>
              <li><strong>Day 5:</strong> Body Scan Awareness - Identify early warning signs (Breathing Exercise)</li>
              <li><strong>Day 6:</strong> Emergency Contact List - Create list of 5 support people (Peer Support)</li>
              <li><strong>Day 7:</strong> Week 1 Reflection - Review trigger patterns (Gratitude Log)</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 2-4: Skill Development</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Advanced breathing techniques (Box breathing, mindful breathing)</li>
              <li>Distraction toolkit creation</li>
              <li>Stress and craving connection exploration</li>
              <li>Sleep, nutrition, and movement as craving management</li>
              <li>Urge surfing techniques</li>
              <li>Cognitive restructuring</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 5-8: Mastery Building</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Advanced trigger management</li>
              <li>Emotional regulation mastery</li>
              <li>Social craving navigation</li>
              <li>Craving forecasting and prediction</li>
              <li>Habit loop interruption</li>
              <li>Visualization and mental rehearsal</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 9-12: Expert Level</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Craving mentorship and teaching</li>
              <li>Advanced recovery strategies</li>
              <li>Stress inoculation training</li>
              <li>Transformation of craving energy</li>
              <li>Legacy building and wisdom sharing</li>
              <li>Complete mastery achievement</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Primary Tools Used</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Urge Tracker (craving patterns and intensity)</li>
              <li>Breathing Exercise (immediate relief techniques)</li>
              <li>Gratitude Log (mindset shifting)</li>
              <li>Peer Support (social accountability)</li>
            </ul>
          </section>

          <section className="mb-12 page-break-before">
            <h2 className="text-3xl font-bold mb-6">Journey 2: Connection Boost</h2>
            <p className="text-xl italic mb-4">Focus Area: Building Meaningful Relationships</p>

            <h3 className="text-2xl font-semibold mb-3">Purpose</h3>
            <p className="mb-4">
              Develop deep, meaningful connections that support recovery while learning to navigate social situations confidently.
            </p>

            <h3 className="text-2xl font-semibold mb-3">Key Themes</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Relationship quality assessment and improvement</li>
              <li>Communication skills development</li>
              <li>Social anxiety management</li>
              <li>Boundary setting and maintenance</li>
              <li>Community building and leadership</li>
              <li>Authentic connection creation</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Daily Structure (Sample Days)</h3>
            
            <h4 className="text-xl font-semibold mb-2">Week 1: Foundation Assessment</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Day 1:</strong> The Connection Audit - Rate all current relationships (Peer Support)</li>
              <li><strong>Day 2:</strong> Quality Over Quantity - Identify 3 most meaningful relationships (Gratitude Log)</li>
              <li><strong>Day 3:</strong> Connection Barriers - Identify what blocks authentic connection (Breathing Exercise)</li>
              <li><strong>Day 4:</strong> Safe People Identification - Find your safest connections (Peer Support)</li>
              <li><strong>Day 5:</strong> Connection Energy - Notice how relationships affect your energy (Gratitude Log)</li>
              <li><strong>Day 6:</strong> First Authentic Reach - Practice vulnerable communication (Peer Support)</li>
              <li><strong>Day 7:</strong> Week 1 Connection Review - Reflect on connection quality (Gratitude Log)</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 2-4: Skill Building</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Vulnerability and trust building</li>
              <li>Communication technique mastery</li>
              <li>Social anxiety management</li>
              <li>Conflict resolution skills</li>
              <li>Group connection strategies</li>
              <li>Professional relationship navigation</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 5-8: Advanced Connection</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Deep intimacy development</li>
              <li>Leadership in communities</li>
              <li>Mentoring relationship creation</li>
              <li>Social recovery modeling</li>
              <li>Difficult conversation mastery</li>
              <li>Connection resilience building</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 9-12: Connection Mastery</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Community healing and service</li>
              <li>Advanced relationship dynamics</li>
              <li>Connection wisdom sharing</li>
              <li>Legacy relationship building</li>
              <li>Expert-level social skills</li>
              <li>Complete connection mastery</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Primary Tools Used</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Peer Support (relationship practice)</li>
              <li>Gratitude Log (appreciation and reflection)</li>
              <li>Breathing Exercise (social anxiety management)</li>
              <li>Urge Tracker (social trigger awareness)</li>
            </ul>
          </section>

          <section className="mb-12 page-break-before">
            <h2 className="text-3xl font-bold mb-6">Journey 3: Routine Builder</h2>
            <p className="text-xl italic mb-4">Focus Area: Creating Sustainable Daily Structures</p>

            <h3 className="text-2xl font-semibold mb-3">Purpose</h3>
            <p className="mb-4">
              Build powerful, sustainable daily routines that support recovery while creating stability and predictability in life.
            </p>

            <h3 className="text-2xl font-semibold mb-3">Key Themes</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Foundation routine establishment</li>
              <li>Habit formation and maintenance</li>
              <li>Energy management and optimization</li>
              <li>Routine flexibility and adaptation</li>
              <li>Environmental optimization</li>
              <li>Routine innovation and mastery</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Daily Structure (Sample Days)</h3>
            
            <h4 className="text-xl font-semibold mb-2">Week 1: Routine Foundation</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Day 1:</strong> Current Routine Assessment - Map existing daily patterns (Urge Tracker)</li>
              <li><strong>Day 2:</strong> Core Routine Design - Create basic recovery-supporting routine (Gratitude Log)</li>
              <li><strong>Day 3:</strong> Morning Routine Power - Establish strong morning foundation (Breathing Exercise)</li>
              <li><strong>Day 4:</strong> Evening Routine Sanctuary - Create calming evening routine (Gratitude Log)</li>
              <li><strong>Day 5:</strong> Routine Obstacles - Identify and plan for barriers (Breathing Exercise)</li>
              <li><strong>Day 6:</strong> The Accountability System - Set up routine accountability (Peer Support)</li>
              <li><strong>Day 7:</strong> Week 1 Routine Review - Assess and adjust routines (Gratitude Log)</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 2-4: Routine Development</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Keystone habit identification</li>
              <li>Flexibility building</li>
              <li>Energy-routine alignment</li>
              <li>Nutrition and exercise integration</li>
              <li>Environmental optimization</li>
              <li>Tracking and reward systems</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 5-8: Advanced Routine Building</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Weekend adaptation strategies</li>
              <li>Innovation and experimentation</li>
              <li>Community and social integration</li>
              <li>Resilience and recovery planning</li>
              <li>Personalization and optimization</li>
              <li>Teaching and mentoring others</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 9-12: Routine Mastery</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Advanced routine architecture</li>
              <li>Legacy routine building</li>
              <li>Transcendent practice development</li>
              <li>Wisdom sharing and teaching</li>
              <li>Universal principle integration</li>
              <li>Complete routine mastery</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Primary Tools Used</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Urge Tracker (routine tracking and pattern analysis)</li>
              <li>Gratitude Log (routine appreciation and reflection)</li>
              <li>Breathing Exercise (routine transition support)</li>
              <li>Peer Support (routine accountability and sharing)</li>
            </ul>
          </section>

          <section className="mb-12 page-break-before">
            <h2 className="text-3xl font-bold mb-6">Journey 4: Toolbox Mastery</h2>
            <p className="text-xl italic mb-4">Focus Area: Mastering Recovery Tools and Techniques</p>

            <h3 className="text-2xl font-semibold mb-3">Purpose</h3>
            <p className="mb-4">
              Develop comprehensive mastery of all recovery tools, knowing when and how to use each one effectively for maximum impact.
            </p>

            <h3 className="text-2xl font-semibold mb-3">Key Themes</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Tool inventory and assessment</li>
              <li>Individual tool mastery</li>
              <li>Tool timing and selection</li>
              <li>Advanced technique development</li>
              <li>Tool innovation and customization</li>
              <li>Teaching and sharing tool knowledge</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Daily Structure (Sample Days)</h3>
            
            <h4 className="text-xl font-semibold mb-2">Week 1: Tool Foundation</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Day 1:</strong> Tool Inventory - Catalog all available recovery tools (Urge Tracker)</li>
              <li><strong>Day 2:</strong> The Breathing Foundation - Master basic breathing techniques (Breathing Exercise)</li>
              <li><strong>Day 3:</strong> Urge Tracking Mastery - Begin comprehensive urge tracking (Urge Tracker)</li>
              <li><strong>Day 4:</strong> Gratitude Tool Power - Use gratitude as active recovery tool (Gratitude Log)</li>
              <li><strong>Day 5:</strong> Peer Support Network - Activate peer support system (Peer Support)</li>
              <li><strong>Day 6:</strong> Tool Timing - Learn optimal timing for each tool (Breathing Exercise)</li>
              <li><strong>Day 7:</strong> Week 1 Tool Assessment - Evaluate tool usage effectiveness (Gratitude Log)</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 2-4: Individual Tool Mastery</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Advanced breathing techniques</li>
              <li>Sophisticated urge tracking methods</li>
              <li>Deep gratitude practices</li>
              <li>Peer support optimization</li>
              <li>Tool combination strategies</li>
              <li>Personal tool customization</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 5-8: Advanced Tool Integration</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Situational tool selection</li>
              <li>Tool innovation and creation</li>
              <li>Emergency tool protocols</li>
              <li>Social tool sharing</li>
              <li>Teaching tool usage</li>
              <li>Tool effectiveness measurement</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 9-12: Tool Mastery Achievement</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Expert-level tool usage</li>
              <li>Tool wisdom development</li>
              <li>Advanced teaching and mentoring</li>
              <li>Tool legacy building</li>
              <li>Universal tool principles</li>
              <li>Complete mastery achievement</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Primary Tools Used</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>All tools with rotating focus and progressive mastery</li>
              <li>Specialized emphasis on tool effectiveness measurement</li>
              <li>Advanced combinations and customizations</li>
            </ul>
          </section>

          <section className="mb-12 page-break-before">
            <h2 className="text-3xl font-bold mb-6">Journey 5: Accountability Path</h2>
            <p className="text-xl italic mb-4">Focus Area: Building Personal and Social Accountability</p>

            <h3 className="text-2xl font-semibold mb-3">Purpose</h3>
            <p className="mb-4">
              Create robust accountability systems that support recovery through personal responsibility, transparent relationships, and consistent follow-through.
            </p>

            <h3 className="text-2xl font-semibold mb-3">Key Themes</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Personal accountability development</li>
              <li>Accountability partner relationships</li>
              <li>Group accountability systems</li>
              <li>Honest communication and transparency</li>
              <li>Consequence and reward systems</li>
              <li>Accountability leadership and service</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Daily Structure (Sample Days)</h3>
            
            <h4 className="text-xl font-semibold mb-2">Week 1: Accountability Foundation</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Day 1:</strong> Accountability Foundation - Establish basic accountability principles (Peer Support)</li>
              <li><strong>Day 2:</strong> Personal Accountability - Create personal accountability systems (Gratitude Log)</li>
              <li><strong>Day 3:</strong> Accountability Partner - Select and connect with accountability partner (Peer Support)</li>
              <li><strong>Day 4:</strong> Daily Check-ins - Establish daily accountability routines (Urge Tracker)</li>
              <li><strong>Day 5:</strong> Accountability Metrics - Define clear accountability measures (Gratitude Log)</li>
              <li><strong>Day 6:</strong> Accountability Honesty - Practice radical honesty (Peer Support)</li>
              <li><strong>Day 7:</strong> Week 1 Accountability Review - Review first week progress (Gratitude Log)</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 2-4: Accountability Development</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Group accountability creation</li>
              <li>Consequence and reward establishment</li>
              <li>Transparency and communication improvement</li>
              <li>Flexibility and adaptation building</li>
              <li>Trust and courage development</li>
              <li>Consistency and commitment strengthening</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 5-8: Advanced Accountability</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Leadership and mentoring development</li>
              <li>Deep accountability practices</li>
              <li>Service and wisdom sharing</li>
              <li>Resilience and integration building</li>
              <li>Excellence and inspiration cultivation</li>
              <li>Healing and transformation focus</li>
            </ul>

            <h4 className="text-xl font-semibold mb-2">Weeks 9-12: Accountability Mastery</h4>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Transcendent accountability practice</li>
              <li>Teaching and enlightenment sharing</li>
              <li>Universal principle application</li>
              <li>Complete mastery achievement</li>
              <li>Legacy building and fulfillment</li>
              <li>Graduation and actualization</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Primary Tools Used</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Peer Support (accountability relationships)</li>
              <li>Gratitude Log (appreciation and reflection)</li>
              <li>Urge Tracker (accountability measurement)</li>
              <li>Breathing Exercise (integrity and presence)</li>
            </ul>
          </section>

          <section className="mb-12 page-break-before">
            <h2 className="text-3xl font-bold mb-6">Implementation Guidelines</h2>

            <h3 className="text-2xl font-semibold mb-3">Daily Structure</h3>
            <p className="mb-2">Each journey day includes:</p>
            <ol className="list-decimal pl-6 space-y-2 mb-6">
              <li><strong>Title:</strong> Clear, motivational daily theme</li>
              <li><strong>Key Message:</strong> Core wisdom or principle for the day</li>
              <li><strong>Activity:</strong> Specific, actionable task to complete</li>
              <li><strong>Tool:</strong> Primary recovery tool to use and practice</li>
            </ol>

            <h3 className="text-2xl font-semibold mb-3">Progressive Development</h3>
            <p className="mb-2">All journeys follow a similar arc:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li><strong>Weeks 1-2:</strong> Foundation building and basic skill development</li>
              <li><strong>Weeks 3-4:</strong> Skill expansion and integration</li>
              <li><strong>Weeks 5-8:</strong> Advanced practice and mastery building</li>
              <li><strong>Weeks 9-12:</strong> Expert level practice, teaching others, and complete mastery</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Cross-Journey Integration</h3>
            <p className="mb-2">While each journey has a primary focus, all journeys incorporate:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Mindfulness and breathing techniques</li>
              <li>Peer support and social connection</li>
              <li>Gratitude and positive psychology</li>
              <li>Urge management and trigger awareness</li>
              <li>Progressive skill building and mastery</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Customization Through Phase Modifiers</h3>
            <p>
              Each journey adapts its tone, pacing, and additional content based on the user's recovery stage, 
              ensuring appropriate challenge and support levels throughout the 90-day experience.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Success Metrics</h2>

            <h3 className="text-2xl font-semibold mb-3">User Progress Indicators</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Daily completion rates</li>
              <li>Tool usage effectiveness</li>
              <li>Skill development milestones</li>
              <li>Peer interaction quality</li>
              <li>Long-term behavior change</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3">Journey Outcomes</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reduced craving intensity and frequency</li>
              <li>Improved relationship quality and social connection</li>
              <li>Consistent, sustainable daily routines</li>
              <li>Comprehensive recovery tool mastery</li>
              <li>Strong personal and social accountability systems</li>
            </ul>
          </section>

          <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>This comprehensive guide provides the foundation for understanding and implementing LEAP's five recovery journeys, 
            each designed to address specific recovery needs while building toward long-term success and mastery.</p>
            <p className="mt-4">© {new Date().getFullYear()} LEAP Recovery Platform</p>
          </footer>
        </article>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 1in;
            size: letter;
          }
          
          .page-break-before {
            page-break-before: always;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableJourneysGuide;