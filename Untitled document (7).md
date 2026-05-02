# **Project Specification: "Would You Rather" Classroom Reasoner**

## **1\. Project Overview**

**Goal:** Build a web-based, AI-powered application for teachers to instantly generate curriculum-aligned "Would You Rather" (WYR) questions to project on a smartboard. **Primary User:** Teachers (interacting with the setup) and Students (viewing the presentation). **The Vibe:** Clean, bright, highly legible, and fast. It should feel like a modern, gamified educational tool (think Kahoot meets a minimalist dashboard).

## **2\. Tech Stack Recommendations**

* **Framework:** Next.js (React) with App Router.  
* **Styling:** Tailwind CSS.  
* **Animations:** Framer Motion (for smooth transitions between setup, loading, and presentation modes).  
* **Icons:** Lucide React.  
* **AI Integration:** Vercel AI SDK (or direct OpenAI/Gemini API calls) for text generation, and an Image generation API (DALL-E 3, Imagen, etc.) for option illustrations.

## **3\. Global State & Data Models**

The application needs to track the following state:

* `gradeLevel`: string (e.g., "K-2", "3-5", "6-8", "9-12")  
* `subject`: string (e.g., "Math", "ELA", "Science", "Social Studies", "SEL")  
* `topic`: string (user text input)  
* `generatedOptions`: Array of objects (populated by AI)  
* `selectedQuestion`: Object (the specific question chosen for presentation)  
* `appState`: string ('setup', 'loading', 'selection', 'presenting')

**Expected AI JSON Output Schema:**

JSON  
{  
  "questions": \[  
    {  
      "vibe": "silly",  
      "optionA": "Text for first choice",  
      "optionB": "Text for second choice"  
    },  
    {  
      "vibe": "balanced",  
      "optionA": "Text for first choice",  
      "optionB": "Text for second choice"  
    },  
    {  
      "vibe": "analytical",  
      "optionA": "Text for first choice",  
      "optionB": "Text for second choice"  
    }  
  \]  
}

## **4\. Screen-by-Screen UI/UX Flow**

### **View 1: The Setup Dashboard**

* **Layout:** Centered, clean card interface on a light, subtle background (e.g., `bg-slate-50`).  
* **Headline:** "Quick-Fire Lesson Starter"  
* **Inputs:**  
  * Dropdown: Grade Level.  
  * Dropdown: Subject.  
  * Text Input: "What topic are you teaching today?" (Large, prominent input).  
* **Action:** A primary button (e.g., vibrant blue or purple) labeled "Generate Options." It should be disabled until all fields are filled.

### **View 2: Loading State**

* **Visuals:** Replace the setup card with a playful loading animation.  
* **Text:** Cycle through educational loading phrases like "Brainstorming scenarios...", "Consulting the curriculum...", "Adding a dash of fun...".

### **View 3: The Selection View**

* **Layout:** Display three horizontal cards, one for each generated question.  
* **Card Content:** \* A small badge indicating the "Vibe" (Silly, Balanced, Analytical).  
  * The text: "Would you rather \[Option A\] OR \[Option B\]?"  
  * A "Present to Class" button on each card.  
* **Action:** Clicking "Present to Class" triggers the transition to View 4\. Include a "Start Over / Edit" button at the top left.

### **View 4: The Smartboard Presentation View**

* **Layout:** Full-screen mode (hide standard nav bars). Split the screen vertically directly down the middle. Left side is Option A, right side is Option B.  
* **Typography:** MASSIVE. The text needs to be easily readable from the back of a 30-foot classroom.  
* **Colors:** Use two distinct, high-contrast background colors for the split screen (e.g., soft coral vs. soft teal).  
* **Images (AI Integration):** Fetch a simple, vector-style image or icon representing Option A and Option B to display above the text on each side.  
* **The Timer:** A floating component at the bottom center.  
  * Large digital clock display (default `02:00`).  
  * Play, Pause, and Reset icon buttons.  
  * Label: "Pair & Share".  
* **Hidden Controls:** A subtle "X" or "Exit" button in the top right corner so the teacher can close the presentation and return to View 1\.

## **5\. System Prompt for the LLM**

*Provide this exact prompt instruction to your AI endpoint when generating the text:*

"You are an expert curriculum designer and engaging educator. Your task is to generate three 'Would You Rather' questions for a classroom activity.

The questions must be tailored to: Grade Level: {gradeLevel} Subject: {subject} Topic: {topic}

Guidelines for the 3 questions:

1. 'Silly': Make it highly imaginative, absurd, or funny, while still tangentially related to the topic.  
2. 'Balanced': A highly relatable, realistic scenario applying the topic to everyday life.  
3. 'Analytical': A deeper, more complex question that requires strong critical thinking and understanding of the topic's mechanics.

Keep the wording simple enough for the specified grade level. Format your response strictly as a JSON object matching the provided schema."

## **6\. Future Scope / V2 Considerations (Do not build in V1, but leave code extensible)**

* **AI Summary:** A button on the Presentation view that generates a 2-sentence summary connecting the WYR question back to the core academic standard.  
* **Student Voting:** QR code generation so students can vote from their own devices.

