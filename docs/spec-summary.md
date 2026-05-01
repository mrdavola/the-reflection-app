# Mirror Talk: Full Application Specification for Vibe Coding

## What This App Is

Mirror Talk is an AI-powered reflective thinking tool for learners and educators. Students (or teachers reflecting on their own practice) record audio or video responses to AI-generated prompts, and the app analyzes those responses to surface cognitive insights, scores, feedback, and growth recommendations. Think of it as a structured reflection journal powered by AI, where the AI both asks the questions and evaluates the answers.

The core philosophy: consistent reflection is key to learning from experience. The app automates the hard parts (generating good questions, analyzing responses, tracking growth) so educators can focus on teaching and students can focus on thinking.

---

## User Roles

### 1. Educator / Group Manager
- Creates and manages groups (classes)
- Configures and assigns reflection activities
- Views group and individual dashboards with analytics
- Can do personal reflections on their own teaching practice
- Can invite co-managers to collaborate on a group

### 2. Student / Participant
- Joins a group via link or login
- Completes assigned reflection activities
- Sees their own scores and feedback (depending on access level set by educator)
- Records responses via audio or video

### 3. Personal User
- Uses the app independently for self-reflection
- No group context, just personal reflection and analysis

---

## Authentication & Onboarding

### Registration Options
- Google account (OAuth)
- Apple account (OAuth)
- Single Sign-On (SSO)
- Email signup
- Available on web (mirrortalk.ai) and as a mobile app download

### Lightweight Access (No Account Required)
- Educators can share a direct link to a reflection activity
- Students click the link, enable microphone + camera, and enter just their first name
- No login, no account creation, no Google account connection
- This is the primary mode for younger students and privacy-conscious settings
- Some students use first name + last initial if the teacher needs to differentiate
- This mode gives students more trust since their identity isn't tied to any account

### Age Restriction
- Students under age 14 cannot register for an account (privacy/security policy)
- Educators handle younger students via the lightweight access mode above

### Pricing Tiers
- **Free plan**: Core reflection features, limited number of AI analyses
- **Premium plan**: Unlimited analyses, full insights, all features

---

## Core Data Model

```
User
├── id
├── name
├── email
├── role (educator | student | personal)
├── auth_provider (google | apple | sso | email)
└── groups[] (many-to-many)

Group
├── id
├── name
├── grade_band (elementary | middle | high | adult)
├── access_type (full | limited | name_only | anonymous_video)
├── language (english | spanish | etc.)
├── recording_mode (audio_only | camera_enabled)
├── greeting_enabled (boolean)
├── owner_id (educator)
├── managers[] (co-managers)
├── participants[] (students)
└── activities[]

Activity (Reflection Configuration)
├── id
├── group_id
├── objective (text, can be recorded via audio)
├── focus (retrieval | self_authorship | problem_solving | creative_booster | collaboration)
├── prompts[] (auto-generated or manually edited)
├── timing_settings (duration per prompt answer)
├── language
├── manual_edit_enabled (boolean)
├── workspace_enabled (boolean)
├── workspace_steps[] (pre-reflection instructional steps)
├── is_active (boolean, only one active per group at a time)
├── share_link (unique URL)
└── status (draft | assigned)

Reflection (Student Submission)
├── id
├── activity_id
├── participant_id
├── recordings[] (audio/video files per prompt)
├── transcriptions[] (auto-generated text per recording)
├── ai_feedback (generated feedback text)
├── analysis
│   ├── reflection_score (1-4 integer scale; 4 is highest/phenomenal)
│   ├── score_color (yellow_sunny | orange | blue — visual triage for teacher)
│   ├── zone (below | at | above | high)
│   ├── growth_mindset (growth | neutral | negative)
│   ├── hidden_lesson (string)
│   ├── key_cognitive_skills[] (e.g., critical_thinking, information_literacy)
│   ├── cognitive_bias (e.g., confirmation_bias, none)
│   ├── zone_of_proximal_development (description)
│   ├── mindset_summary (string)
│   └── tone_summary (string, e.g., "constructive and neutral", "negative and unclear")
├── content_alerts[] (triggered safety/concern flags, e.g., suicide mention, profanity)
├── recharge_option_selected (string)
└── created_at

GroupSummary (Aggregated Dashboard Data)
├── group_id
├── activity_id (optional, null = all activities)
├── summary_text (AI-generated group analysis)
├── tips[] (actionable recommendations)
└── aggregate_scores
```

---

## Application Flow: Screen by Screen

### FLOW 1: Educator Creates a Group

**Screen 1A: Group Selector (Global Navigation)**
- Dropdown menu at the top of every page
- Shows all groups the educator manages
- At the bottom of the dropdown: a "New" button to create a new group
- Also has a "Personal" option for personal reflections

**Screen 1B: Create Group Form**
- **Group Name**: text input field
- **Grade Band / Level**: selector with options (this is called "type" in the UI)
  - Elementary (K-5)
  - Middle School (6-8)
  - High School (9-12)
  - Adult / Higher Ed
  - This selection determines the developmental appropriateness of AI prompts, feedback language complexity, and scoring calibration
- **Access Type**: radio or card selector with 4 options:
  1. **Full Access**: Participants log in and see all data including scores
  2. **Limited View**: Participants log in but only see a summary (no scores)
  3. **Name Entry Only**: Participants enter their name to participate, no login required
  4. **Anonymous + Video**: No name required, but video recording is required so the educator can identify who is speaking
- **Reflection Experience Type**: selector for the kind of activity experience
- **Language**: dropdown (English, Spanish, possibly others)
- **Recording Mode**: toggle or selector
  - Microphone only
  - Camera enabled (audio + video)
- **Greeting**: toggle for whether Mirror Talk greets participants when they start
- **Create Button**: finalizes and creates the group

**After Creation:**
- Group appears in the group selector dropdown
- Educator is taken to the group dashboard (empty state)

---

### FLOW 2: Educator Sets Up and Assigns a Reflection Activity

**Screen 2A: Activity Setup (accessed via "Setup" button on group dashboard)**
Three main configuration sections:

**Section 1: Objective**
- Text input field OR record button (audio recording of objective)
- The objective is the classroom learning goal
- When an objective is provided, the AI auto-generates reflection prompts tailored to it
- Students also see the objective so they know what to focus on
- Example: "Students will understand the causes of the American Revolution"

**Section 2: Reflection Settings**
- **Focus Selector**: cards or buttons, each representing a different reflection mode:
  - **Retrieval**: Tests how well students remember the lesson
  - **Self-Authorship**: Encourages ownership of learning
  - **Problem Solving**: Guides structured problem-solving thinking
  - **Creative Booster**: Sparks creative connections
  - **Collaboration**: Reflects on teamwork and group dynamics
  - Selecting a focus causes the AI to regenerate prompts automatically
- **Timing**: adjust how long students have to answer each prompt (slider or number input)
- **Language**: override group default language for this specific activity
- **Manual Prompt Editing**: toggle to enable
  - When enabled, each AI-generated prompt becomes an editable text field
  - Educator can rewrite prompts word by word
  - Can add or remove prompts

**Section 3: Workspace (Pre-Reflection Activity)**
- Toggle to enable/disable
- When enabled, shows a step builder
- Educator adds a series of instructional steps students complete BEFORE the reflection
- These steps could be small group work, discussion prompts, hands-on activities
- Steps are ordered and displayed sequentially to students
- Designed for use with "Mirror hardware device" (classroom collaboration hardware) but works on any device

**Action Buttons:**
- **Assign**: assigns the configured activity to the current group, making it the active activity
- **Close / X**: closes the setup, everything auto-saves as a draft

**Alternative Path: Activity Library**
- Accessed via "New" button in the activity area
- Shows a library of pre-made reflection activity templates
- Each template has:
  - Preview button (see what students will experience)
  - Edit button (customize before assigning)
  - Assign button (use as-is)
- These are curated examples covering common classroom scenarios

**Sharing:**
- Each active activity generates a unique shareable link
- Educator copies this link and pastes it wherever students access materials (LMS, email, etc.)
- Only the currently active activity's link is shareable and functional
- Previous activities become inactive when a new one is assigned

---

### FLOW 3: Student Completes a Reflection (The Core Experience)

This is the heart of the app. Here is the step-by-step flow:

**Screen 3A: Student Landing / Home**
- After logging in (or entering name via shared link), student sees assigned reflections front and center
- Each assigned reflection shows as a card with the objective and a "Start" button
- If accessing via shared link: student enables microphone + camera, enters first name, then proceeds directly

**Screen 3B: Greeting (Optional)**
- If greeting is enabled for the group, the app greets the student
- Can include gesture recognition (e.g., student does a peace sign to greet)
- Personalizable greeting experience per group

**Screen 3C: The First Question (Teacher-Created)**
- The first reflection question is displayed on screen
- This question was created by the teacher during activity setup (see Flow 2)
- The teacher writes this question to guide the reflection toward their learning objective
- Examples of teacher-created first questions:
  - "What is something at work that brings you a lot of pride?"
  - "What was your project and what is something you're proud of?"
  - "How did you prepare for this assessment and how do you feel you did?"
  - "Summarize what you learned today"
  - "How are you feeling today?" (social-emotional check-in)
- Student responds by tapping the record button and speaking (audio or video)

**CRITICAL: 15-Second Minimum Rule**
- Students MUST speak for at least 15 seconds before the "Next" button appears
- This prevents low-effort, one-word responses
- The quality and depth of the student's verbal response directly affects the quality of the AI-generated follow-up questions
- If a student says very little or goes off-topic, the follow-up questions won't make sense (this is by design, and teachers debrief this with students as a lesson about AI)

**Screen 3D: AI-Generated Follow-Up Questions (Sequential)**
- After the student answers the first teacher-created question, the AI generates 1-2 follow-up questions
- These follow-ups are personalized based on:
  - What the student actually said in their first response
  - The selected focus mode
  - The teacher's stated objective/standard
- Each follow-up question appears one at a time
- Student records their answer for each
- The same 15-second minimum applies

**Alternative: All Questions Manual**
- Teachers can optionally choose to manually write ALL questions (not just the first one)
- This bypasses AI generation entirely when the teacher needs to know something very specific
- Typical setup: teacher creates Q1, AI generates Q2 and Q3
- Manual override: teacher creates Q1, Q2, and Q3

**Screen 3E: Feedback Generation**
- After all prompts are answered, a loading/generation animation plays
- Text like "Now it's generating feedback" or a progress indicator
- The AI processes ALL responses together to generate:
  1. **Personalized feedback paragraph**: encouraging, specific to their answers, references what they said
  2. **Actionable suggestion**: a concrete next step they can take
  3. **Encouragement**: positive reinforcement of effort and thinking
  4. **Cross-curricular connections**: if the student made connections between subjects, the AI highlights and celebrates this

- The feedback is ALWAYS positive and encouraging in tone
- It may identify areas to explore further but never delivers harsh criticism
- Example feedback:
  - "Nice work. It's great to see you making an effort to [specific thing]. It seems like you are excited about this project, but you might feel overwhelmed by [specific challenge]. Consider how you can [specific suggestion]."
  - "Why not start by [specific action] to spark your ideas?"
  - "You are making a complex connection between navigation and stars, which shows deep thinking."

**Feedback Ends With**: "See you next reflection" or similar warm sign-off

**Screen 3F: Recharge / Calming Exercise Options**
- After feedback is displayed, student is shown options:
  - Different "recharge" activities (calming exercises, breathing, etc.)
  - Option to select a greeting for next time
  - "Done" button to finish and accept
- These are brief cooldown activities to transition out of the reflective state

**Screen 3G: Analysis Results**
- After completing the reflection, the student sees their analysis (if access level permits):
  - **Reflection Score**: 1-4 scale (4 is the highest, phenomenal)
  - **Score Color**: visual indicator
    - Yellow / Sunny = on track, doing well
    - Orange = needs some attention
    - Blue = needs significant support
  - **Zone Indicator**: below, at, above, or high (relative to expected level)
  - **Growth Mindset**: growth, neutral, or negative
  - **Hidden Lesson**: what the AI identified as the deeper learning happening beyond the surface topic (e.g., "exploring language diversity")
  - **Key Cognitive Skills**: tags like "critical thinking," "information literacy"
  - **Cognitive Bias**: if detected, names the bias (e.g., "confirmation bias") with explanation
  - **Zone of Proximal Development**: where the student sits relative to independent capability
  - **Mindset Summary**: brief text (e.g., "growth mindset, engaged")
  - **Tone Summary**: brief text (e.g., "mostly constructive and neutral, shows awareness but may lack motivation")

**Screen 3H: Review & Export**
- "Review Reflection" button: replays the recording with transcription
- **Download options**:
  - Download the audio/video recording
  - Download the transcription (text)
- **Share options**:
  - Upload to external platforms (e.g., Padlet, LMS, course page)
  - Copy a share link

---

### FLOW 4: Educator Views Group Dashboard

**Screen 4A: Group Data Dashboard**
- Top: Group selector dropdown to switch between groups
- Top left: Activity filter dropdown to view data for specific reflection activities or "all activities"

**Dashboard Components:**

**Class Analytics Summary (Generated After All Students Reflect)**
- AI-generated narrative that processes ALL student reflections together
- Structured as two key paragraphs:
  - **Paragraph 1: Student Understanding**: What the class collectively demonstrated, themes across responses, what students are thinking about, where they're at with the learning target
  - **Paragraph 2: Teacher Action Items**: Specific, concrete instructional suggestions for the teacher. These are detailed enough to act on immediately (e.g., "try gamification by having students..." with examples specific to the content area)
- This allows the teacher to read one summary instead of listening to every single student's reflection before students leave class
- Teachers can use this as a launching point for class discussion: "Mirror Talk says this, do we agree or disagree?"

**Group Summary Card (Purple Card)**
- Prominently displayed, visually distinct (purple background)
- AI-generated summary analyzing ALL reflections from ALL participants in the group
- Contains:
  - Overall group thinking analysis
  - Tips on how to move forward with instruction
  - Patterns observed across the group
- This is the "peer into your students' minds" feature

**Individual Student Cards (Grid Layout)**
- Grid or list of cards, one per student reflection
- Each card is a quick-scan visual triage system:
  - **Student name** (and photo if available, covered/hidden for privacy sharing)
  - **Reflection score** (1-4)
  - **Color-coded background**:
    - **Yellow / Sunny**: student is on track, no intervention needed
    - **Orange**: student needs some attention, worth reviewing
    - **Blue**: student needs significant support, priority follow-up
  - **Activity name and date**
- **Teacher triage workflow**: If all cards are yellow/sunny, the teacher probably doesn't need to dig into every reflection. If cards are orange or blue, the teacher clicks those to investigate.
- Click a card to drill into the in-depth view

**Screen 4B: Individual Reflection Detail View**
- Full analysis display showing everything the student received, PLUS teacher-only data:
  - Reflection score with color indicator
  - **Zone**: displayed with color (green = ideal/high)
  - **Mindset**: growth / neutral / negative (with color coding)
  - **Tone**: constructive / neutral / negative / unclear (with description)
  - Full AI feedback text (what Mirror Talk told the student)
  - Teacher can verify: "Do I agree with what the AI told this student?"
  - Full transcription of all responses
  - Playback of audio/video recording
  - Student quotes and key insights extracted by AI
  - Cross-curricular connections identified
  - Hidden lesson detected
- **Trend tracking**: view this student's scores, mindset, and tone across multiple reflections over time to spot patterns
- **Share options** (3-dot menu at top):
  - Generate a web link to share this reflection's insights
  - Copy insights text to clipboard for pasting elsewhere

**Screen 4C: Group Settings (3-dot menu, top right)**
- **Manage Participants**:
  - Grab an invite link to share with students
  - View list of current participants
  - Remove participants
  - Invite group managers (other educators who can co-manage and view insights)
- **Setup**: shortcut back to the activity configuration screen

---

### FLOW 5: Personal Reflection (Educator Self-Reflection)

**Screen 5A: Personal Mode**
- Select "Personal" in the group selector dropdown
- Hit "Start"

**Screen 5B-5F: Same flow as student reflection**
- AI asks what you're working on
- You record your response (audio/video)
- Choose a focus
- Answer AI-generated prompts
- Receive feedback and analysis
- All data is private to the educator

---

## Content Safety & Alert System

The platform includes automated safety monitoring during reflections:

### Real-Time Alerts
- If a student mentions keywords related to self-harm, suicide, violence, or other concerning content, the system immediately alerts the teacher via email
- Alerts fire as soon as the student finishes or even as soon as the keyword is detected
- Example: a student's project was about PTSD and suicide. Every time the student mentioned "suicide" while talking about their project, the teacher received an instant email alert

### Profanity Detection
- The system flags potential profanity in student reflections
- Teacher receives an alert and can listen to the recording or read the transcript to verify
- False positives happen (the system may mishear words), so teacher review is important

### Teacher Review Tools
- Teachers can always read the full transcript of any reflection
- Teachers can listen to or watch the recording
- This allows teachers to verify AI-flagged content and make informed decisions

---

## Evidence Log & Portfolio

Student reflections serve as an evidence log and portfolio system:

- Each reflection is stored with its recording, transcription, and analysis
- Students can go back and review their past reflections
- Teachers have an evidence log of student thinking, not just test scores
- Functions like a portfolio and snapshot of student work over time
- Recordings and transcriptions can be downloaded for external portfolio use
- Teachers can track trends in individual student scores, mindset, and tone across multiple reflections

---

## Application Use Cases (From Practitioners)

### Formative Assessment
- Use reflections as exit tickets tied to learning targets
- Track whether students are meeting specific learning objectives
- Teacher can see at a glance (via color-coded cards) if the class is on target before students leave

### Daily Project Reflections
- During multi-day projects, students reflect each day
- Each daily reflection gives them AI feedback and encouragement
- Also gives the teacher a daily pulse on student progress and mindset
- Especially useful for independent projects where the teacher can't directly help (e.g., AP project guidelines)

### Creative Process Reflection (Arts Integration)
- Students reflect on creative decisions: why they made certain artistic choices
- Works for visual art, performance, music, or any creative work
- Helps students articulate their creative process

### Cross-Curricular Connection Detection
- The AI identifies when students make connections between different subjects
- Example: a 1st grader connected constellations (science) with navigation/maps (social studies)
- The AI highlights these connections in the feedback and analysis
- This is one of the most exciting features for elementary educators

### Small Group Activity Debrief
- After small group work, students reflect on their collaboration
- Can reflect on how their role went in a group project, what they would do differently

### Performance Review
- Record student performances or presentations
- Students then reflect on their performance
- Theater teachers use this: record, reflect in small groups, identify changes before the final performance

### STEM / Planning Space
- Use the whiteboard/workspace feature for planning before hands-on activities
- Example: students plan a habitat for a creature based on its adaptations, label it, then build it with STEM materials, then reflect on why they made those choices

### Social-Emotional Learning Check-Ins
- Quick reflections: "How are you feeling today?" "Name your emotion"
- Track student emotional states over time via tone and mindset data

### Approaches to Learning Self-Assessment
- Ask students to rate themselves on skills like communication at the start of a quarter
- Ask the same question at the end of the quarter
- Compare reflections to show growth

### Summarizing Learning
- Simple daily "What did you learn today?" reflections
- 1st graders use sentence starters like "I learned..." to build the habit
- Students get more comfortable sharing their thoughts over time with repetition

---

## Pedagogical Patterns (How Teachers Use It Effectively)

### Previewing Questions
- Effective teachers preview the reflection question with students before they start recording
- This helps students feel more comfortable and prepared
- Students can do a think-pair-share about what they might say before the formal reflection

### Modeling Good vs. Poor Reflections
- Teachers model reflections in front of the class
- First, show a POOR reflection: short, vague, lots of pausing, stopping at exactly 15 seconds
- Show students the low-quality feedback that results
- Then, model a GOOD reflection: detailed, specific, speaking well beyond 15 seconds
- Show students the high-quality, personalized feedback that results
- This teaches students that the quality of their input directly affects the quality of their output (a lesson about AI itself)

### Building Capacity Over Time
- Start with easy, personal questions everyone can answer (opinions, feelings about class)
- Gradually move to deeper reflective questions about content understanding
- Repetition is key, especially for students who've never formally reflected before
- 9th graders initially don't understand why they would reflect or how to do it
- With consistent practice over months, students improve dramatically

### Connecting Reflections to Next Steps
- After formative assessments, ask students how their preparation connects to their upcoming summative
- Students often don't see the connection between formatives and summatives without prompting
- Reflection bridges this gap, building metacognitive skills

### Teacher Discussion Integration
- Take insights from Mirror Talk analytics and bring them back to the class
- "Mirror Talk said this about our class. Do we agree? Do we disagree?"
- In CS classes specifically, teachers want students to agree or disagree with AI

---

## M2 Hardware Device (Context for Remix)

Mirror Talk also exists as a physical hardware device called M2, made by Swivel (the parent company, 15 years old). While you wouldn't replicate the hardware in a vibe-coded app, understanding M2's capabilities helps identify features worth building into the web version:

### What M2 Does Beyond Web-Based Mirror Talk
- **Real-time co-teacher mode**: M2 listens to the entire class session and provides the teacher with live coaching feedback (e.g., "Focus your questions to highlight key points of reflection" or "Ask teachers how they might adapt this for different age groups")
- **Lesson summarization**: Teacher can ask M2 to summarize the lesson at any point, and it recaps everything that was discussed
- **Exit ticket generation**: M2 can generate a relevant exit ticket question based on the lesson it just observed
- **Real-time translation**: Teacher speaks in English, M2 translates directions to Spanish (or other languages) in real-time for multilingual students. Supports "pretty much any language"
- **Conversational AI interaction**: Students and teachers can talk to M2 like a person, ask it questions, ask for jokes related to the content, ask for summaries in different languages
- **Whiteboard feature**: Interactive planning space for collaborative activities
- **Physical microphone**: Wearable necklace mic with button activation, plus expansion pack for multiple mics around the room
- **Touchscreen interface**: Same reflection flow as web but on a dedicated touchscreen
- **Privacy by design**: Works like a "confessional booth" in a private corner where no one else can hear
- **Gesture recognition**: Can recognize greetings like a peace sign

### Features to Port to the Web Remix
These M2 features would be powerful in a web app:
- Real-time co-teacher feedback during a lesson (via browser mic monitoring)
- AI-generated exit ticket questions based on lesson context
- Real-time translation of content and instructions
- Conversational AI that students can ask questions to during class
- Lesson summarization with customizable output (e.g., "top 3 points in Spanish")

### Prompt Generation
- **Input**: User's recorded/typed response + selected focus + educator's objective/standard (if set)
- **Output**: 1-2 contextually relevant follow-up reflection questions
- **Behavior**: Questions MUST reference specific details from the user's response, not be generic. If the student says little or goes off-topic, the AI generates questions based on whatever it received (this teaches students that low-effort input = low-quality AI output)
- **Developmental calibration**: Language complexity and question depth adjust based on the group's grade band setting
- **Standard alignment**: When the teacher enters a learning standard or objective, the prompts specifically tie back to that standard

### Feedback Generation
- **Input**: All user responses across all prompts in a session
- **Output**: A short paragraph (3-5 sentences) that:
  1. Acknowledges effort with specific reference to what they said
  2. Identifies a potential challenge or area to explore further
  3. Suggests a concrete, actionable next step
  4. Celebrates any cross-curricular connections made
- **Tone**: ALWAYS positive and encouraging. The system has never been observed delivering negative or harsh feedback. It may suggest areas to grow, but frames everything constructively.
- **Sign-off**: Ends with a warm closing like "See you next reflection"
- **Sensitivity**: When student responses are about difficult topics (mental health, personal struggles), feedback remains supportive while triggering teacher alerts if needed

### Scoring / Analysis Generation
- **Input**: All user responses + transcriptions from a session
- **Output**: Structured analysis object containing:
  - `reflection_score` (1-4 integer; 4 = phenomenal)
  - `score_color` (yellow_sunny = on track, orange = needs attention, blue = needs support)
  - `zone` (below | at | above | high, relative to grade band expectations)
  - `growth_mindset` (growth | neutral | negative)
  - `hidden_lesson` (the deeper learning beyond the surface topic, e.g., "exploring language diversity")
  - `key_cognitive_skills` (array of identified skills being exercised)
  - `cognitive_bias` (if any detected, with explanation)
  - `zpd_assessment` (zone of proximal development placement)
  - `mindset_summary` (brief text, e.g., "growth mindset, engaged and curious")
  - `tone_summary` (brief text, e.g., "mostly constructive and neutral, shows awareness but may lack motivation" — this can be eerily accurate to the student's personality)
  - `student_quotes` (key quotes extracted from transcription demonstrating understanding)
  - `cross_curricular_connections` (connections between subjects detected in responses)
  - `next_steps_for_teacher` (suggested instructional moves specific to this student)

### Class Analytics Generation (Per Activity)
- **Input**: All reflections from all participants for a specific activity
- **Output**: Two-paragraph structured summary:
  - **Paragraph 1**: What students collectively understood, themes across responses, engagement level, areas of strength
  - **Paragraph 2**: Specific, actionable instructional suggestions with concrete examples relevant to the content area
- **Timing**: Generated after all students complete reflections, available before students leave class
- **Purpose**: Teacher reads ONE summary instead of listening to 21+ individual reflections

### Group Summary Generation (Aggregated Over Time)
- **Input**: All reflections from all participants in a group, optionally filtered by activity or date range
- **Output**: 
  - Narrative summary of group-wide thinking patterns
  - Actionable tips for adjusting instruction
  - Identification of common strengths and gaps
  - Trend data showing how the group's mindset, scores, and engagement have shifted over time

---

## UI/UX Design Notes

### Visual Style
- Clean, modern, education-focused design
- Cards-based layout throughout
- Purple accent color for group summaries and key data
- Speech bubbles ("bumps") for the conversational reflection interface
- Large, tappable buttons for mobile-friendliness (works on Chromebooks, laptops, phones)

### Recording Interface
- Prominent circular record button
- Visual audio waveform or recording indicator while active
- Timer showing recording duration
- Option to re-record before submitting
- Real-time or post-recording transcription display

### Loading/Generation States
- Visible loading animation during AI processing
- Text indicator like "Generating prompts..." or "Creating your feedback..."
- These moments happen after:
  - Initial response (generating prompts)
  - Final response (generating feedback + analysis)

### Navigation
- Global group selector dropdown at top of every screen
- Minimal navigation, most flows are linear (start → record → answer → feedback → done)
- Auto-save everywhere, users never lose work
- Back/close buttons that preserve state

### Accessibility
- Works on Chromebooks (critical for K-12)
- Works on MacBooks and other laptops
- Works on desktops
- Mobile app available
- Audio-first interaction model (typing is secondary option)
- Requires microphone and camera permissions enabled in browser
- Works with school-managed devices (may need IT whitelisting of mirrortalk.ai domain)

---

## Key Technical Requirements

### Audio/Video
- In-browser audio and video recording (MediaRecorder API or similar)
- Audio-to-text transcription (real-time or post-recording)
- Audio/video file storage and playback
- Download capability for recordings and transcriptions

### AI Integration
- LLM-powered prompt generation (contextual, not template-based)
- LLM-powered feedback generation
- LLM-powered analysis and scoring
- LLM-powered group summary aggregation
- All AI outputs must be calibrated to the grade band / developmental level

### Sharing & Export
- Unique shareable links per activity (for student access)
- Unique shareable links per reflection (for sharing insights)
- Copy-to-clipboard for insights text
- File download for recordings and transcriptions
- Integration-friendly (designed to be shared via Padlet, LMS, email, etc.)

### Data & Privacy
- Students under 14 cannot create accounts
- Alternative access modes for younger students (name-only, anonymous)
- Educator controls visibility of scores and data per group
- Personal reflections are private
- Group data only visible to group owner and invited managers

---

## Feature Summary Checklist

### Core Infrastructure
- [ ] User registration (Google, Apple, SSO, email)
- [ ] Lightweight access mode (first name only, no account, via shared link)
- [ ] Group creation with grade band, access type, language, recording mode, greeting toggle
- [ ] Activity setup with objective (typed or recorded), focus selection, timing, language, manual prompt editing
- [ ] Pre-reflection workspace with sequential instructional steps
- [ ] Activity library with pre-made templates
- [ ] Activity assignment with shareable link generation (only active activity link works)

### Student Reflection Flow
- [ ] Greeting screen with optional gesture recognition
- [ ] Teacher-created first question displayed to student
- [ ] 15-second minimum speaking requirement before "Next" button appears
- [ ] AI-generated follow-up questions (1-2) based on student's response + focus + objective
- [ ] Option for teacher to manually write all questions (bypass AI generation)
- [ ] Audio/video recording per question
- [ ] Real-time transcription
- [ ] AI feedback generation (always positive, specific, actionable)
- [ ] Recharge / calming exercise options after reflection
- [ ] Analysis display: reflection score (1-4), zone, mindset, tone, hidden lesson, cognitive skills, cognitive bias, ZPD

### Teacher Dashboard & Analytics
- [ ] Color-coded student cards (yellow/sunny, orange, blue) for quick visual triage
- [ ] Class analytics summary (two paragraphs: understanding + action items)
- [ ] Group summary card (purple, aggregated analysis)
- [ ] Individual reflection detail view with full transcript, recording playback, AI feedback review
- [ ] Student quote extraction and key insight highlighting
- [ ] Cross-curricular connection detection
- [ ] Trend tracking per student across multiple reflections
- [ ] Activity filter dropdown on dashboard

### Safety & Alerts
- [ ] Real-time content alerts for concerning keywords (suicide, self-harm, violence)
- [ ] Immediate email notification to teacher when alerts trigger
- [ ] Profanity detection with teacher verification workflow
- [ ] Teacher can read transcript and listen/watch recording to verify any flag

### Sharing & Export
- [ ] Review and replay reflections with transcription
- [ ] Download recordings and transcriptions
- [ ] Share reflections externally (Padlet, LMS, etc.)
- [ ] Sharing insights via web link or clipboard copy
- [ ] Evidence log / portfolio functionality

### Management
- [ ] Participant management (invite links, remove, co-manager invites)
- [ ] Personal reflection mode for educators
- [ ] Developmental calibration based on grade band
- [ ] Free and premium tiers (premium = unlimited analyses)

---

## Parent Company & Community Context

- **Swivel** is the parent company (15 years old as of 2025)
- Mirror Talk is the software platform; M2 is the hardware device
- **Mirror Mentors**: a community of experienced Mirror Talk educators who help newcomers, share best practices, and answer questions
- **Community space**: closed community for workshop attendees and invited educators to share resources, ask questions, and connect
- **Privacy documents**: available at the bottom of swivel.com (company-wide) and mirrortalk.ai (app-specific)

---

## Suggested Tech Stack (for Vibe Coding Remix)

Based on the app's requirements:

- **Frontend**: Next.js + React (responsive, works on all devices)
- **Database**: Firebase Firestore or Supabase (real-time data, auth built in)
- **Auth**: Firebase Auth or Supabase Auth (Google, Apple, email providers)
- **AI**: Gemini API or Claude API (prompt generation, feedback, analysis, group summaries)
- **Audio/Video**: Browser MediaRecorder API for capture, cloud storage for files
- **Transcription**: Google Speech-to-Text, Whisper API, or Deepgram
- **Hosting**: Vercel (pairs with Next.js)
- **Storage**: Firebase Storage or Supabase Storage (for audio/video files)

---

## Remix Ideas (Things to Make Even Better)

These are not in the original app but would be natural enhancements:

### Inspired by M2 Hardware (Port to Web)
1. **Live co-teacher mode**: Browser listens to the lesson via mic and provides real-time coaching suggestions to the teacher in a sidebar (e.g., "Try asking students how they'd adapt this for different age groups")
2. **Lesson summarization**: Teacher clicks a button and gets an AI summary of everything discussed so far in the lesson
3. **AI exit ticket generator**: Based on the lesson context, AI generates a relevant exit ticket question on demand
4. **Real-time translation overlay**: Teacher speaks, app translates instructions to students' native languages in real-time
5. **Conversational AI sidebar**: Students can ask the AI questions about the content during class, not just during reflections

### New Feature Ideas
6. **Streak tracking**: Show students how many consecutive days/weeks they've reflected
7. **Growth over time visualization**: Charts showing score, mindset, and tone trends across multiple reflections
8. **Peer reflection sharing**: Let students (optionally) see anonymized peer reflections to learn from each other
9. **Educator prompt bank**: Save and reuse custom first questions across activities and groups
10. **Integration with Google Classroom**: Auto-import rosters, post assignments directly
11. **AI-generated discussion starters**: Based on class analytics, generate whole-class discussion questions
12. **Reflection journals**: Compiled view of all a student's reflections over time, exportable as a PDF portfolio
13. **Parent view**: Limited dashboard for parents to see their child's growth (with educator approval)
14. **Rubric alignment**: Map reflection scores to existing rubric criteria
15. **Multilingual AI**: Full support for reflections in any language (M2 already handles "pretty much any language")
16. **Modeling mode**: Built-in "demo" feature where teachers can show good vs. poor reflections with pre-recorded examples
17. **Sentence starter scaffolds**: For younger students (K-2), provide sentence starters like "I learned..." to help them structure their verbal responses
18. **Approaches to learning tracker**: Pre/post self-assessment on skills like communication, with automatic comparison between start and end of quarter
19. **Small group reflection mode**: Multiple students reflect together on the same prompt, and the AI synthesizes their combined responses
20. **Performance recording integration**: Students record a performance or presentation, then immediately reflect on it within the same session
