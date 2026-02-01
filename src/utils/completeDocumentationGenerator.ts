// Complete Documentation Generator for LEAP PWA
// Generates comprehensive documentation for printing/saving as PDF

import {
  appInfo,
  architectureOverview,
  hooksDocumentation,
  servicesDocumentation,
  utilitiesDocumentation,
  edgeFunctionsDocumentation,
  databaseTablesDocumentation,
  componentCategoriesDocumentation
} from '@/data/codeDocumentation';

const generateCoverPage = (): string => {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
    <div class="cover-page">
      <div class="cover-content">
        <div class="logo-section">
          <div class="logo">🔧</div>
          <h1 class="app-title">LEAP</h1>
          <p class="app-subtitle">Life Enhancement and Peer Support</p>
        </div>
        <div class="doc-title">
          <h2>Complete Documentation</h2>
          <p class="doc-type">User Guide • Specialist Manual • Code Reference</p>
        </div>
        <div class="meta-info">
          <p>Version ${appInfo.version}</p>
          <p>Generated: ${date}</p>
        </div>
      </div>
    </div>
  `;
};

const generateTableOfContents = (): string => {
  return `
    <div class="toc-page page-break">
      <h1 class="toc-title">Table of Contents</h1>
      
      <div class="toc-section">
        <h2>Part 1: User Guide</h2>
        <ul>
          <li><span>1.1</span> Getting Started & Onboarding</li>
          <li><span>1.2</span> Dashboard Overview</li>
          <li><span>1.3</span> Recovery Journey (90-Day Program)</li>
          <li><span>1.4</span> Toolbox Features</li>
          <li><span>1.5</span> The Foreman AI Coach</li>
          <li><span>1.6</span> Peer Chat Support</li>
          <li><span>1.7</span> Profile & Settings</li>
          <li><span>1.8</span> PWA Installation</li>
        </ul>
      </div>

      <div class="toc-section">
        <h2>Part 2: Peer Specialist Manual</h2>
        <ul>
          <li><span>2.1</span> Portal Access & Authentication</li>
          <li><span>2.2</span> Dashboard Navigation</li>
          <li><span>2.3</span> Chat Session Management</li>
          <li><span>2.4</span> Calendar & Scheduling</li>
          <li><span>2.5</span> Communication Tools</li>
          <li><span>2.6</span> Performance Metrics</li>
          <li><span>2.7</span> Training Modules</li>
        </ul>
      </div>

      <div class="toc-section">
        <h2>Part 3: Admin Portal Guide</h2>
        <ul>
          <li><span>3.1</span> User Management</li>
          <li><span>3.2</span> Specialist Management</li>
          <li><span>3.3</span> Analytics Dashboard</li>
          <li><span>3.4</span> Content Management</li>
        </ul>
      </div>

      <div class="toc-section">
        <h2>Part 4: Code Documentation</h2>
        <ul>
          <li><span>4.1</span> Architecture Overview</li>
          <li><span>4.2</span> Hooks Reference</li>
          <li><span>4.3</span> Services Reference</li>
          <li><span>4.4</span> Utilities Reference</li>
          <li><span>4.5</span> Edge Functions (API Endpoints)</li>
          <li><span>4.6</span> Database Schema</li>
          <li><span>4.7</span> Component Architecture</li>
        </ul>
      </div>

      <div class="toc-section">
        <h2>Part 5: Appendices</h2>
        <ul>
          <li><span>A</span> System Requirements</li>
          <li><span>B</span> Troubleshooting Guide</li>
          <li><span>C</span> Glossary of Terms</li>
          <li><span>D</span> Security Best Practices</li>
        </ul>
      </div>
    </div>
  `;
};

const generateUserGuide = (): string => {
  return `
    <div class="section page-break">
      <h1 class="part-title">Part 1: User Guide</h1>
      <p class="part-intro">This section covers everything you need to know to use the LEAP Recovery app effectively.</p>

      <div class="chapter">
        <h2>1.1 Getting Started & Onboarding</h2>
        <p>When you first open LEAP, you'll go through a personalized onboarding process:</p>
        <ol>
          <li><strong>Create Account:</strong> Sign up with your email address and create a secure password</li>
          <li><strong>Choose Focus Areas:</strong> Select the areas of recovery most important to you (stress management, relationships, career, etc.)</li>
          <li><strong>Set Your Journey Stage:</strong> Indicate where you are in your recovery journey</li>
          <li><strong>Select Support Style:</strong> Choose how you prefer to receive support (motivational, practical, gentle, etc.)</li>
        </ol>
        <div class="tip-box">
          <strong>💡 Tip:</strong> You can update these preferences anytime in your profile settings.
        </div>
      </div>

      <div class="chapter">
        <h2>1.2 Dashboard Overview</h2>
        <p>Your dashboard is your daily home base in LEAP:</p>
        <ul>
          <li><strong>Recovery Streak:</strong> Track your consecutive days of engagement</li>
          <li><strong>Daily Prompt:</strong> Personalized questions to reflect on</li>
          <li><strong>Quick Actions:</strong> One-tap access to your most-used tools</li>
          <li><strong>Progress Overview:</strong> Visual representation of your journey progress</li>
          <li><strong>Motivational Content:</strong> Daily quotes and tips for inspiration</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>1.3 Recovery Journey (90-Day Program)</h2>
        <p>The Recovery Journey is a structured 90-day program divided into three phases:</p>
        
        <h3>Phase 1: Foundation (Days 1-30)</h3>
        <p>Build core recovery skills and establish daily habits. Focus on self-awareness and basic coping strategies.</p>
        
        <h3>Phase 2: Building (Days 31-60)</h3>
        <p>Deepen your practice and expand your toolkit. Work on relationships, triggers, and long-term planning.</p>
        
        <h3>Phase 3: Strengthening (Days 61-90)</h3>
        <p>Consolidate your gains and prepare for continued growth beyond the program.</p>
        
        <div class="info-box">
          <strong>ℹ️ How It Works:</strong> Each day includes a reflection prompt, practical tip, and optional activity. Complete days to maintain your streak and earn badges!
        </div>
      </div>

      <div class="chapter">
        <h2>1.4 Toolbox Features</h2>
        <p>Your Toolbox contains evidence-based recovery tools:</p>
        
        <h3>🔧 SteadySteel (Breathing Exercise)</h3>
        <p>A guided 4-7-8 breathing exercise to reduce stress and manage anxiety. Perfect for moments when you need to calm down quickly.</p>
        
        <h3>🚨 Redline Recovery (Urge Tracker)</h3>
        <p>Log urges when they happen, rate their intensity, and track what coping strategies work best for you.</p>
        
        <h3>🙏 Gratitude Log</h3>
        <p>Daily gratitude journaling to shift focus toward positive aspects of life. Research shows gratitude practice improves mental health.</p>
        
        <h3>⚡ Trigger Identifier</h3>
        <p>Identify, categorize, and develop strategies for your personal triggers.</p>
        
        <h3>🧠 Thought Pattern Sorter</h3>
        <p>A CBT-based game that helps you recognize cognitive distortions and healthier thinking patterns.</p>
        
        <h3>📋 Recovery Plan</h3>
        <p>Generate and download a personalized recovery plan PDF based on your progress and goals.</p>
      </div>

      <div class="chapter">
        <h2>1.5 The Foreman AI Coach</h2>
        <p>The Foreman is your AI-powered recovery coach, available 24/7:</p>
        <ul>
          <li>Ask questions about recovery and coping strategies</li>
          <li>Get personalized encouragement based on your progress</li>
          <li>Receive motivational quotes and wisdom</li>
          <li>Save meaningful responses to your "Saved Wisdom" collection</li>
        </ul>
        <div class="warning-box">
          <strong>⚠️ Important:</strong> The Foreman is an AI assistant, not a replacement for professional treatment or human support. For crisis situations, always reach out to a human or call a crisis line.
        </div>
      </div>

      <div class="chapter">
        <h2>1.6 Peer Chat Support</h2>
        <p>Connect with trained Peer Support Specialists who understand recovery firsthand:</p>
        <ol>
          <li>Check available specialists and their areas of expertise</li>
          <li>Start a chat session when specialists are online</li>
          <li>Schedule appointments for future conversations</li>
          <li>Request phone calls for more personal support</li>
        </ol>
        <p>Sessions are confidential and specialists follow strict privacy guidelines.</p>
      </div>

      <div class="chapter">
        <h2>1.7 Profile & Settings</h2>
        <p>Manage your account and preferences:</p>
        <ul>
          <li><strong>Edit Profile:</strong> Update your name and personal information</li>
          <li><strong>Notification Settings:</strong> Control how and when you receive reminders</li>
          <li><strong>Saved Wisdom:</strong> Access quotes and insights you've saved</li>
          <li><strong>View Badges:</strong> See all badges you've earned</li>
          <li><strong>Language:</strong> Switch between English and Spanish</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>1.8 PWA Installation</h2>
        <p>LEAP works as a Progressive Web App, meaning you can install it like a native app:</p>
        
        <h3>On iPhone/iPad (Safari)</h3>
        <ol>
          <li>Tap the Share button (square with arrow)</li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add" to confirm</li>
        </ol>
        
        <h3>On Android (Chrome)</h3>
        <ol>
          <li>Tap the menu (three dots)</li>
          <li>Tap "Add to Home Screen" or "Install App"</li>
          <li>Confirm the installation</li>
        </ol>
        
        <h3>On Desktop (Chrome/Edge)</h3>
        <ol>
          <li>Look for the install icon in the address bar</li>
          <li>Click "Install" when prompted</li>
        </ol>
        
        <div class="tip-box">
          <strong>💡 Tip:</strong> Installing the app gives you offline access and a better full-screen experience!
        </div>
      </div>
    </div>
  `;
};

const generateSpecialistManual = (): string => {
  return `
    <div class="section page-break">
      <h1 class="part-title">Part 2: Peer Specialist Manual</h1>
      <p class="part-intro">This section is for trained Peer Support Specialists using the LEAP platform.</p>

      <div class="chapter">
        <h2>2.1 Portal Access & Authentication</h2>
        <p>Access the Specialist Portal at <code>/specialist</code> or through your invitation link.</p>
        
        <h3>First-Time Login</h3>
        <ol>
          <li>Use the temporary credentials sent to your email</li>
          <li>You'll be prompted to change your password immediately</li>
          <li>Complete your profile with bio and specialties</li>
          <li>Complete required training modules before going online</li>
        </ol>
        
        <h3>Security Requirements</h3>
        <ul>
          <li>Passwords must be at least 12 characters</li>
          <li>Include uppercase, lowercase, numbers, and symbols</li>
          <li>Sessions timeout after 30 minutes of inactivity</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>2.2 Dashboard Navigation</h2>
        <p>The specialist dashboard includes:</p>
        <ul>
          <li><strong>Left Sidebar:</strong> Navigation to all portal sections</li>
          <li><strong>Session Queue:</strong> Users waiting for support</li>
          <li><strong>Active Sessions:</strong> Current conversations</li>
          <li><strong>Calendar:</strong> Your schedule and appointments</li>
          <li><strong>Metrics:</strong> Performance statistics</li>
          <li><strong>Training:</strong> Professional development modules</li>
        </ul>
        
        <h3>Status Indicator</h3>
        <p>Your status affects whether users can reach you:</p>
        <ul>
          <li><span class="status-online">🟢 Online:</span> Available for new chats</li>
          <li><span class="status-busy">🟡 Busy:</span> In session, no new chats</li>
          <li><span class="status-away">🟠 Away:</span> Temporarily unavailable</li>
          <li><span class="status-offline">⚫ Offline:</span> Not available</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>2.3 Chat Session Management</h2>
        
        <h3>Accepting Sessions</h3>
        <ol>
          <li>Monitor the "Waiting" queue for incoming requests</li>
          <li>Review user information before accepting</li>
          <li>Click "Accept" to start the conversation</li>
          <li>Session moves to your "Active Sessions" list</li>
        </ol>
        
        <h3>During a Session</h3>
        <ul>
          <li>Use quick responses for common messages</li>
          <li>Access content library for resources to share</li>
          <li>View user's recovery progress for context</li>
          <li>Propose appointments for follow-up</li>
          <li>Offer phone call for escalated support</li>
        </ul>
        
        <h3>Ending Sessions</h3>
        <p>Sessions can end in several ways:</p>
        <ul>
          <li>Natural conclusion with positive closure</li>
          <li>User ends the session</li>
          <li>Session timeout after inactivity</li>
          <li>Emergency escalation (see protocols)</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>2.4 Calendar & Scheduling</h2>
        
        <h3>Setting Availability</h3>
        <ol>
          <li>Go to Calendar → Manage Availability</li>
          <li>Set your working hours for each day</li>
          <li>Block time for breaks and meetings</li>
          <li>System automatically updates your status</li>
        </ol>
        
        <h3>Proposing Appointments</h3>
        <ol>
          <li>During chat, click "Propose Appointment"</li>
          <li>Select date, time, and appointment type</li>
          <li>User receives notification to accept/decline</li>
          <li>Confirmed appointments appear on your calendar</li>
        </ol>
        
        <h3>Appointment Types</h3>
        <ul>
          <li><strong>Check-in (15 min):</strong> Quick progress check</li>
          <li><strong>Support Session (30 min):</strong> Standard session</li>
          <li><strong>Extended Session (45 min):</strong> In-depth support</li>
          <li><strong>Follow-up (15 min):</strong> After-action review</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>2.5 Communication Tools</h2>
        
        <h3>Content Library</h3>
        <p>Access pre-approved resources to share with users:</p>
        <ul>
          <li>Motivational quotes and stories</li>
          <li>Coping strategy guides</li>
          <li>Educational videos</li>
          <li>Crisis resources</li>
        </ul>
        
        <h3>Phone Call Feature</h3>
        <p>For situations requiring voice communication:</p>
        <ol>
          <li>Click "Request Phone Call" in chat</li>
          <li>User receives secure link to your callback number</li>
          <li>Calls are logged but not recorded</li>
          <li>Document outcome in session notes</li>
        </ol>
      </div>

      <div class="chapter">
        <h2>2.6 Performance Metrics</h2>
        <p>Your dashboard tracks key performance indicators:</p>
        <ul>
          <li><strong>Response Time:</strong> Average time to respond to messages</li>
          <li><strong>Sessions Completed:</strong> Total sessions this month</li>
          <li><strong>User Ratings:</strong> Average satisfaction score</li>
          <li><strong>Active Hours:</strong> Time spent online</li>
          <li><strong>Appointment Rate:</strong> Scheduled vs. completed</li>
        </ul>
        
        <div class="info-box">
          <strong>ℹ️ Goal:</strong> Maintain response time under 2 minutes and satisfaction rating above 4.0 stars.
        </div>
      </div>

      <div class="chapter">
        <h2>2.7 Training Modules</h2>
        <p>Complete required training modules:</p>
        <ol>
          <li><strong>Role & Scope:</strong> Understanding peer support boundaries</li>
          <li><strong>Values & Principles:</strong> Core principles of peer work</li>
          <li><strong>Self-Help & Mutual Support:</strong> Empowerment strategies</li>
          <li><strong>Safety & Risk:</strong> Crisis recognition and response</li>
          <li><strong>Digital & Ethical Literacy:</strong> Online support best practices</li>
        </ol>
        <p>Each module includes reading, scenarios, and a quiz. You must pass with 80% or higher.</p>
      </div>
    </div>
  `;
};

const generateAdminGuide = (): string => {
  return `
    <div class="section page-break">
      <h1 class="part-title">Part 3: Admin Portal Guide</h1>
      <p class="part-intro">This section covers administrative functions for LEAP platform managers.</p>

      <div class="chapter">
        <h2>3.1 User Management</h2>
        <p>Manage all users registered on the platform:</p>
        <ul>
          <li>View user list with search and filters</li>
          <li>Access individual user profiles and progress</li>
          <li>Reset user passwords if needed</li>
          <li>Deactivate or delete accounts</li>
          <li>Export user data for reporting</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>3.2 Specialist Management</h2>
        
        <h3>Inviting New Specialists</h3>
        <ol>
          <li>Navigate to Specialist Management</li>
          <li>Click "Invite Specialist"</li>
          <li>Enter email, name, and specialties</li>
          <li>System sends invitation with temporary credentials</li>
        </ol>
        
        <h3>Managing Active Specialists</h3>
        <ul>
          <li>View real-time status of all specialists</li>
          <li>Access performance metrics and ratings</li>
          <li>Review session histories</li>
          <li>Activate or deactivate specialists</li>
          <li>Assign required training modules</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>3.3 Analytics Dashboard</h2>
        <p>Platform-wide analytics include:</p>
        <ul>
          <li><strong>User Engagement:</strong> Daily/weekly/monthly active users</li>
          <li><strong>Feature Usage:</strong> Which tools are used most</li>
          <li><strong>Chat Metrics:</strong> Sessions, wait times, satisfaction</li>
          <li><strong>Journey Progress:</strong> Completion rates by phase</li>
          <li><strong>Specialist Performance:</strong> Team-wide metrics</li>
        </ul>
        
        <h3>Exporting Reports</h3>
        <p>Export data in CSV or JSON format for external analysis.</p>
      </div>

      <div class="chapter">
        <h2>3.4 Content Management</h2>
        <p>Manage platform content:</p>
        <ul>
          <li><strong>Motivational Content:</strong> Add/edit quotes and stories</li>
          <li><strong>Training Materials:</strong> Update specialist training</li>
          <li><strong>Journey Content:</strong> Import AI-generated daily content</li>
          <li><strong>Thought Packs:</strong> Manage CBT game content</li>
        </ul>
      </div>
    </div>
  `;
};

const generateCodeDocumentation = (): string => {
  return `
    <div class="section page-break">
      <h1 class="part-title">Part 4: Code Documentation</h1>
      <p class="part-intro">Technical reference for developers working with the LEAP codebase.</p>

      <div class="chapter">
        <h2>4.1 Architecture Overview</h2>
        
        <h3>Technology Stack</h3>
        <table class="doc-table">
          <tr><th>Layer</th><th>Technology</th></tr>
          <tr><td>Frontend</td><td>${architectureOverview.stack.frontend}</td></tr>
          <tr><td>Styling</td><td>${architectureOverview.stack.styling}</td></tr>
          <tr><td>State Management</td><td>${architectureOverview.stack.stateManagement}</td></tr>
          <tr><td>Routing</td><td>${architectureOverview.stack.routing}</td></tr>
          <tr><td>UI Components</td><td>${architectureOverview.stack.ui}</td></tr>
          <tr><td>Backend</td><td>${architectureOverview.stack.backend}</td></tr>
          <tr><td>Hosting</td><td>${architectureOverview.stack.hosting}</td></tr>
        </table>
        
        <h3>Folder Structure</h3>
        <pre class="code-block">${architectureOverview.folderStructure}</pre>
        
        <h3>Data Flow</h3>
        <pre class="code-block">${architectureOverview.dataFlow}</pre>
        
        <h3>Authentication Flow</h3>
        <pre class="code-block">${architectureOverview.authFlow}</pre>
      </div>

      <div class="chapter page-break">
        <h2>4.2 Hooks Reference</h2>
        <p>Custom React hooks for state management and side effects:</p>
        
        <table class="doc-table hooks-table">
          <thead>
            <tr>
              <th>Hook</th>
              <th>Purpose</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            ${hooksDocumentation.map(hook => `
              <tr>
                <td><code>${hook.name}</code></td>
                <td>${hook.purpose}</td>
                <td><code>${hook.file}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="chapter page-break">
        <h2>4.3 Services Reference</h2>
        <p>Service modules for API communication and data operations:</p>
        
        <table class="doc-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Purpose</th>
              <th>Key Methods</th>
            </tr>
          </thead>
          <tbody>
            ${servicesDocumentation.map(service => `
              <tr>
                <td><code>${service.name}</code></td>
                <td>${service.purpose}</td>
                <td>${service.methods?.join(', ') || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="chapter page-break">
        <h2>4.4 Utilities Reference</h2>
        <p>Utility modules for common operations:</p>
        
        <table class="doc-table">
          <thead>
            <tr>
              <th>Utility</th>
              <th>Purpose</th>
              <th>Key Functions</th>
            </tr>
          </thead>
          <tbody>
            ${utilitiesDocumentation.map(util => `
              <tr>
                <td><code>${util.name}</code></td>
                <td>${util.purpose}</td>
                <td>${util.functions?.slice(0, 3).join(', ') || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="chapter page-break">
        <h2>4.5 Edge Functions (API Endpoints)</h2>
        <p>Supabase Edge Functions for backend operations:</p>
        
        <table class="doc-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Purpose</th>
              <th>Auth</th>
            </tr>
          </thead>
          <tbody>
            ${edgeFunctionsDocumentation.map(func => `
              <tr>
                <td><code>${func.name}</code></td>
                <td>${func.method}</td>
                <td>${func.purpose}</td>
                <td>${func.auth}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="chapter page-break">
        <h2>4.6 Database Schema</h2>
        <p>PostgreSQL tables managed by Supabase:</p>
        
        <table class="doc-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Purpose</th>
              <th>Key Columns</th>
            </tr>
          </thead>
          <tbody>
            ${databaseTablesDocumentation.map(table => `
              <tr>
                <td><code>${table.name}</code></td>
                <td>${table.purpose}</td>
                <td>${table.keyColumns?.slice(0, 4).join(', ') || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="info-box">
          <strong>ℹ️ Note:</strong> All tables have Row Level Security (RLS) enabled. See the security documentation for policy details.
        </div>
      </div>

      <div class="chapter page-break">
        <h2>4.7 Component Architecture</h2>
        <p>React components organized by category:</p>
        
        ${['Pages', 'User Features', 'Toolbox', 'Specialist', 'Admin', 'Auth', 'UI'].map(category => {
          const components = componentCategoriesDocumentation.filter(c => c.category === category);
          if (components.length === 0) return '';
          return `
            <h3>${category}</h3>
            <table class="doc-table">
              <thead>
                <tr><th>Component</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                ${components.map(comp => `
                  <tr>
                    <td><code>${comp.name}</code></td>
                    <td>${comp.purpose}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }).join('')}
      </div>
    </div>
  `;
};

const generateAppendices = (): string => {
  return `
    <div class="section page-break">
      <h1 class="part-title">Part 5: Appendices</h1>

      <div class="chapter">
        <h2>Appendix A: System Requirements</h2>
        
        <h3>Browser Compatibility</h3>
        <table class="doc-table">
          <tr><th>Browser</th><th>Minimum Version</th></tr>
          <tr><td>Chrome</td><td>90+</td></tr>
          <tr><td>Firefox</td><td>88+</td></tr>
          <tr><td>Safari</td><td>14+</td></tr>
          <tr><td>Edge</td><td>90+</td></tr>
        </table>
        
        <h3>Device Requirements</h3>
        <ul>
          <li>Stable internet connection (1 Mbps minimum)</li>
          <li>JavaScript enabled</li>
          <li>LocalStorage enabled</li>
          <li>WebSocket support</li>
        </ul>
        
        <h3>PWA Requirements</h3>
        <ul>
          <li>HTTPS connection</li>
          <li>Service Worker support</li>
          <li>Manifest file support</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>Appendix B: Troubleshooting Guide</h2>
        
        <h3>Common Issues</h3>
        
        <h4>App won't load</h4>
        <ul>
          <li>Check internet connection</li>
          <li>Clear browser cache</li>
          <li>Disable browser extensions</li>
          <li>Try incognito/private mode</li>
        </ul>
        
        <h4>Can't sign in</h4>
        <ul>
          <li>Verify email address is correct</li>
          <li>Use "Forgot Password" to reset</li>
          <li>Check for email confirmation</li>
        </ul>
        
        <h4>Chat not connecting</h4>
        <ul>
          <li>Check if specialists are online</li>
          <li>Refresh the page</li>
          <li>Check WebSocket connectivity</li>
        </ul>
        
        <h4>Notifications not working</h4>
        <ul>
          <li>Enable browser notifications</li>
          <li>Check notification settings in profile</li>
          <li>Verify push subscription</li>
        </ul>
      </div>

      <div class="chapter">
        <h2>Appendix C: Glossary of Terms</h2>
        <dl class="glossary">
          <dt>CBT</dt>
          <dd>Cognitive Behavioral Therapy - a psychotherapy approach that addresses thought patterns</dd>
          
          <dt>Edge Function</dt>
          <dd>Serverless function running on Supabase infrastructure</dd>
          
          <dt>JWT</dt>
          <dd>JSON Web Token - secure token for authentication</dd>
          
          <dt>Peer Specialist</dt>
          <dd>Trained support person with lived recovery experience</dd>
          
          <dt>PWA</dt>
          <dd>Progressive Web App - web app with native-like capabilities</dd>
          
          <dt>RLS</dt>
          <dd>Row Level Security - database-level access control</dd>
          
          <dt>The Foreman</dt>
          <dd>AI-powered recovery coach in the LEAP app</dd>
          
          <dt>Streak</dt>
          <dd>Consecutive days of app engagement</dd>
        </dl>
      </div>

      <div class="chapter">
        <h2>Appendix D: Security Best Practices</h2>
        <ul>
          <li>Never share your password</li>
          <li>Use unique passwords for each service</li>
          <li>Enable two-factor authentication when available</li>
          <li>Log out when using shared devices</li>
          <li>Report suspicious activity immediately</li>
          <li>Keep your browser updated</li>
          <li>Don't click links from unknown sources</li>
        </ul>
        
        <div class="warning-box">
          <strong>⚠️ Privacy Note:</strong> Your recovery data is confidential. LEAP uses encryption and access controls to protect your information. However, always be cautious about what you share.
        </div>
      </div>
    </div>
  `;
};

const getStyles = (): string => {
  return `
    <style>
      @media print {
        .no-print { display: none !important; }
        .page-break { page-break-before: always; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
      
      * { box-sizing: border-box; margin: 0; padding: 0; }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        background: white;
        font-size: 11pt;
      }
      
      /* Cover Page */
      .cover-page {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        color: white;
        page-break-after: always;
      }
      
      .cover-content {
        text-align: center;
        padding: 40px;
      }
      
      .logo-section .logo {
        font-size: 80px;
        margin-bottom: 20px;
      }
      
      .app-title {
        font-size: 72px;
        font-weight: bold;
        letter-spacing: 8px;
        margin: 0;
        color: #f59e0b;
      }
      
      .app-subtitle {
        font-size: 18px;
        color: #9ca3af;
        margin-top: 10px;
      }
      
      .doc-title {
        margin-top: 60px;
      }
      
      .doc-title h2 {
        font-size: 32px;
        font-weight: 300;
      }
      
      .doc-type {
        color: #9ca3af;
        margin-top: 10px;
      }
      
      .meta-info {
        margin-top: 80px;
        color: #6b7280;
        font-size: 14px;
      }
      
      /* Table of Contents */
      .toc-page {
        padding: 40px 60px;
      }
      
      .toc-title {
        font-size: 28px;
        margin-bottom: 30px;
        color: #1a1a1a;
        border-bottom: 2px solid #f59e0b;
        padding-bottom: 10px;
      }
      
      .toc-section {
        margin-bottom: 25px;
      }
      
      .toc-section h2 {
        font-size: 16px;
        color: #374151;
        margin-bottom: 8px;
      }
      
      .toc-section ul {
        list-style: none;
        padding-left: 20px;
      }
      
      .toc-section li {
        padding: 4px 0;
        border-bottom: 1px dotted #d1d5db;
      }
      
      .toc-section li span {
        display: inline-block;
        width: 40px;
        color: #6b7280;
      }
      
      /* Content Sections */
      .section {
        padding: 40px 60px;
      }
      
      .part-title {
        font-size: 32px;
        color: #1a1a1a;
        margin-bottom: 10px;
        border-left: 4px solid #f59e0b;
        padding-left: 15px;
      }
      
      .part-intro {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 30px;
        padding-left: 19px;
      }
      
      .chapter {
        margin-bottom: 30px;
      }
      
      .chapter h2 {
        font-size: 20px;
        color: #1f2937;
        margin-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 5px;
      }
      
      .chapter h3 {
        font-size: 16px;
        color: #374151;
        margin: 15px 0 8px 0;
      }
      
      .chapter h4 {
        font-size: 14px;
        color: #4b5563;
        margin: 12px 0 6px 0;
      }
      
      .chapter p {
        margin-bottom: 10px;
      }
      
      .chapter ul, .chapter ol {
        margin: 10px 0 15px 25px;
      }
      
      .chapter li {
        margin-bottom: 5px;
      }
      
      /* Info Boxes */
      .tip-box, .info-box, .warning-box {
        padding: 12px 15px;
        border-radius: 6px;
        margin: 15px 0;
        font-size: 13px;
      }
      
      .tip-box {
        background: #ecfdf5;
        border-left: 4px solid #10b981;
      }
      
      .info-box {
        background: #eff6ff;
        border-left: 4px solid #3b82f6;
      }
      
      .warning-box {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
      }
      
      /* Tables */
      .doc-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 11px;
      }
      
      .doc-table th {
        background: #f3f4f6;
        padding: 10px;
        text-align: left;
        font-weight: 600;
        border: 1px solid #e5e7eb;
      }
      
      .doc-table td {
        padding: 8px 10px;
        border: 1px solid #e5e7eb;
        vertical-align: top;
      }
      
      .doc-table tr:nth-child(even) {
        background: #f9fafb;
      }
      
      .hooks-table td:first-child {
        white-space: nowrap;
        font-weight: 500;
      }
      
      /* Code */
      code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Consolas', monospace;
        font-size: 10px;
      }
      
      .code-block {
        background: #1f2937;
        color: #e5e7eb;
        padding: 15px;
        border-radius: 6px;
        font-family: 'Consolas', monospace;
        font-size: 10px;
        white-space: pre;
        overflow-x: auto;
        margin: 15px 0;
      }
      
      /* Glossary */
      .glossary dt {
        font-weight: bold;
        color: #1f2937;
        margin-top: 12px;
      }
      
      .glossary dd {
        margin-left: 20px;
        color: #4b5563;
      }
      
      /* Status Colors */
      .status-online { color: #10b981; }
      .status-busy { color: #f59e0b; }
      .status-away { color: #f97316; }
      .status-offline { color: #6b7280; }
    </style>
  `;
};

export const generateCompleteDocumentation = (): string => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LEAP Recovery - Complete Documentation</title>
      ${getStyles()}
    </head>
    <body>
      ${generateCoverPage()}
      ${generateTableOfContents()}
      ${generateUserGuide()}
      ${generateSpecialistManual()}
      ${generateAdminGuide()}
      ${generateCodeDocumentation()}
      ${generateAppendices()}
    </body>
    </html>
  `;
  
  return html;
};

export const downloadDocumentation = (): void => {
  const html = generateCompleteDocumentation();
  
  // Open in new window for printing/saving
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Trigger print dialog after content loads
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};

export const downloadAsHtml = (): void => {
  const html = generateCompleteDocumentation();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `LEAP-Documentation-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
