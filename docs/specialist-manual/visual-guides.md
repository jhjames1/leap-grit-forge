# Visual Interface Guide

## Dashboard Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: LEAP Specialist Portal                    [Profile] [Logout] │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────────────┐ │
│ │   SIDEBAR   │ │              MAIN CONTENT AREA                  │ │
│ │             │ │                                                 │ │
│ │ 🏠 Dashboard│ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │ │
│ │ 💬 Sessions │ │  │Active│ │Wait. │ │Compl.│ │Avg   │         │ │
│ │ 📅 Calendar │ │  │Chats │ │Chats │ │Today │ │Resp  │         │ │
│ │ 🎓 Training │ │  │  2   │ │  1   │ │  8   │ │ 45s  │         │ │
│ │ 📊 Analytics│ │  └──────┘ └──────┘ └──────┘ └──────┘         │ │
│ │ 📁 Archive  │ │                                                 │ │
│ │ 📋 Activity │ │  ┌─────────────────────────────────────────┐   │ │
│ │ ⚙️ Settings │ │  │         SESSION LIST                    │   │ │
│ │             │ │  │ 🟡 Session #1234 - John D. - 5 min ago │   │ │
│ │             │ │  │ 🟢 Session #1235 - Active - Jane S.    │   │ │
│ │             │ │  │ ⏳ Session #1236 - Waiting - New       │   │ │
│ │             │ │  └─────────────────────────────────────────┘   │ │
│ └─────────────┘ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Chat Interface Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Chat Window - Session #1234 with John D.              [⚙️] [✖️]     │
├─────────────────────────────────────────────────────────────────────┤
│ Session Info: Started 2:30 PM | Duration: 15 min | Status: Active   │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ MESSAGE HISTORY ─────────────────────────────────────────────────┐ │
│ │ System: Chat session started                               2:30 PM │ │
│ │                                                                   │ │
│ │ John D: Hi, I'm struggling today and need someone to talk to      │ │
│ │                                                             2:31 PM│ │
│ │                                                                   │ │
│ │ You: Hello John, I'm here to listen and support you. What's      │ │
│ │ going on today that's making things difficult?             2:31 PM│ │
│ │                                                                   │ │
│ │ John D: I've been having cravings and feel really isolated...     │ │
│ │                                                             2:32 PM│ │
│ │                                                                   │ │
│ │ [💭 John is typing...]                                             │ │
│ └───────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ MESSAGE INPUT ──────────────────────────────────────────────────┐ │
│ │ [Type your message here...]                                      │ │
│ │                                                                  │ │
│ │ [📎] [😊] [⚡Quick Actions ▼] [📅Schedule] [🔚End Session] [Send]│ │
│ └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Session Status Visual Guide

### Status Badge Colors and Meanings

| Status | Badge Color | Description | Action Available |
|--------|------------|-------------|------------------|
| 🟡 **Waiting** | Yellow | User waiting for specialist | Claim Session |
| 🟢 **Active** | Green | Conversation in progress | Continue Chat |
| 🔴 **Ended** | Gray | Session completed | View Archive |
| ⏱️ **Timed Out** | Red | Auto-ended due to inactivity | View Archive |

### Session Priority Indicators

```
🔥 HIGH PRIORITY    - User waiting >10 minutes
⚡ URGENT           - Crisis keywords detected  
💬 NORMAL           - Standard session
🔄 FOLLOW-UP        - Returning user
📅 SCHEDULED        - Pre-planned appointment
```

## Calendar Interface

```
┌─────────────────────────────────────────────────────────────────────┐
│ Calendar - December 2024              [Week] [Month] [Day] [⚙️]      │
├─────────────────────────────────────────────────────────────────────┤
│     Sun    Mon    Tue    Wed    Thu    Fri    Sat                   │
│      1      2      3      4      5      6      7                    │
│             📅     📅           📅                                   │
│             9AM    2PM          10AM                                 │
│                                                                     │
│      8      9     10     11     12     13     14                    │
│     📅      📅     📅     📅     📅     📅                          │
│     3PM    1PM    9AM    2PM    11AM   4PM                          │
│                                                                     │
│     15     16     17   📍18     19     20     21                    │
│     📅     📅          📅      📅     📅                            │
│     10AM   2PM         9AM     1PM    3PM                           │
│                                                                     │
│ Today: 5 appointments | This week: 12 appointments                  │
│ ┌─ LEGEND ──────────────────────────────────────────────────────┐   │
│ │ 📅 Scheduled Appointment    🚫 Blocked Time                    │   │
│ │ 📍 Today/Current Day        ⚡ Available Slot                  │   │
│ │ 🔄 Recurring Appointment    ❌ Cancelled                       │   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Performance Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ Performance Analytics - This Month                                  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │Sessions Comp.│ │Avg Response  │ │User Rating   │ │Training Prog.│ │
│ │     156      │ │     42s      │ │    4.8/5     │ │     85%      │ │
│ │  ▲ +12%      │ │  ▼ -8s       │ │  ▲ +0.3      │ │  ▲ +15%     │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                     │
│ ┌─ RESPONSE TIME TREND ─────────────────────────────────────────────┐ │
│ │    60s │                                                         │ │
│ │        │     ●                                                   │ │
│ │    45s │   ●   ●     ●                                           │ │
│ │        │ ●       ●     ●   ●                                     │ │
│ │    30s │                     ●   ●   ●                           │ │
│ │        │                           ●   ●                         │ │
│ │    15s │_________________________________________________         │ │
│ │        Week 1  Week 2  Week 3  Week 4                           │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ SESSION OUTCOMES ────────────────────────────────────────────────┐ │
│ │ ✅ Completed Successfully: 89%   ████████████████████▒▒           │ │
│ │ 🔄 Transferred to Specialist: 6% ██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒         │ │
│ │ ⏱️ Timed Out: 3%                ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒           │ │
│ │ ❌ Cancelled by User: 2%         ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒           │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Training Module Interface

```
┌─────────────────────────────────────────────────────────────────────┐
│ Training Dashboard - Peer Support Specialist Development            │
├─────────────────────────────────────────────────────────────────────┤
│ Progress Overview: 15/20 modules completed (75%)                    │
│ ████████████████████████████████████████▒▒▒▒▒▒▒▒▒▒                 │
│                                                                     │
│ ┌─ AVAILABLE MODULES ──────────────────────────────────────────────┐ │
│ │                                                                  │ │
│ │ ✅ Crisis Intervention Basics        [Completed] Score: 95%      │ │
│ │ ✅ Active Listening Techniques       [Completed] Score: 88%      │ │
│ │ ✅ Recovery-Oriented Conversation    [Completed] Score: 92%      │ │
│ │ 🔄 Trauma-Informed Care              [In Progress] 60% complete  │ │
│ │ 📚 Motivational Interviewing         [Available] Start Now →     │ │
│ │ 🔒 Advanced De-escalation            [Locked] Complete MI first  │ │
│ │                                                                  │ │
│ │ ┌─ FEATURED: Mock Chat Scenarios ─────────────────────────────┐  │ │
│ │ │ 🎭 Practice realistic conversations with AI users           │  │ │
│ │ │ 📊 Get scored feedback on your responses                    │  │ │
│ │ │ 🏆 Earn badges for excellent performance                    │  │ │
│ │ │                                     [Start Practice] →      │  │ │
│ │ └─────────────────────────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Recent Achievements: 🏆 "Empathetic Listener" 🌟 "Quick Responder"   │
└─────────────────────────────────────────────────────────────────────┘
```

## Mobile Interface Adaptations

### Mobile Dashboard (Phone)
```
┌─────────────────────────┐
│ ☰ LEAP Portal    👤 ⚙️ │
├─────────────────────────┤
│ Quick Stats             │
│ ┌─────┐ ┌─────┐         │
│ │Act 2│ │Wait1│         │
│ └─────┘ └─────┘         │
│ ┌─────┐ ┌─────┐         │
│ │Com 8│ │45s  │         │
│ └─────┘ └─────┘         │
│                         │
│ 🟡 Session #1234        │
│ John D. - 5 min ago     │
│ [View] [Claim]          │
│                         │
│ ⏳ Session #1236        │
│ New - Just started      │
│ [View] [Claim]          │
│                         │
│ ┌─ Quick Actions ──────┐│
│ │ 📱 Mobile Chat       ││
│ │ 📅 View Calendar     ││
│ │ 🎓 Training          ││
│ │ 📊 Performance       ││
│ └─────────────────────┘│
└─────────────────────────┘
```

## Notification Examples

### Desktop Notifications
```
┌─────────────────────────────────────┐
│ 🔔 LEAP Specialist Portal           │
│                                     │
│ New Chat Session Available          │
│ User has been waiting 3 minutes     │
│                                     │
│ [Claim Session] [View Dashboard]    │
│                             [Dismiss]│
└─────────────────────────────────────┘
```

### In-App Alerts
```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚠️ Session Timeout Warning                                    [✖️] │
│ Your current session will timeout in 5 minutes due to inactivity.  │
│ Click anywhere to stay active or extend your session.              │
│                                                                     │
│ [Extend Session] [End Session Now] [Stay Active]                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Color Coding Guide

### Status Colors
- 🟢 **Green**: Active, Available, Completed Successfully
- 🟡 **Yellow**: Waiting, Pending, In Progress  
- 🔴 **Red**: Error, Urgent, Failed, Timeout
- 🔵 **Blue**: Information, Scheduled, Normal Priority
- 🟣 **Purple**: Training, Development, Premium Features
- ⚪ **Gray**: Inactive, Disabled, Archived

### Priority Levels
- 🔥 **Critical**: Immediate attention required
- ⚡ **High**: Important, handle soon
- 📋 **Normal**: Standard priority
- 📚 **Low**: When time allows
- 🔍 **Info**: Reference only

---

*This visual guide helps you quickly understand and navigate the LEAP Specialist Portal interface.*