# 1 (Test 1 — Should pull from Cluster A (tool knowledge))
A) Upgraded Prompt

{
  "upgraded": "You are an expert prompt engineer. Your objective is to take a rough draft prompt and return an improved, fully specified version of it.\n\nConstraints: Do not simply rephrase the draft prompt. Instead, incorporate all six elements of the Prompt Upgrade Rubric (objective, constraints, output format, evaluation criteria, assumptions, and example) into the improved prompt. If the draft prompt lacks clarity or detail in any of these areas, infer reasonable additions or modifications based on prompt engineering best practices. Preserve the original intent of the draft prompt but significantly enhance its effectiveness and clarity.\n\nOutput format: Present the upgraded prompt as a complete, ready-to-use prompt. Do not use JSON. Use plain prose, bullet points, and code blocks as appropriate within the upgraded prompt itself to structure its components. The output should be the text of the enhanced prompt, not an analysis of the draft.\n\nEvaluation criteria: A good upgraded prompt will be unambiguous, actionable, and comprehensive. It will clearly define the AI's role, task, desired output, and limitations. The upgraded prompt should be demonstrably more effective than the original draft at eliciting the desired AI response.\n\nAssumptions: The draft prompt is intended to be used with a capable large language model. The goal is to create a prompt that is robust and minimizes the need for further iteration. The user of the upgraded prompt will understand basic prompt engineering concepts.\n\nExample:\nInput: `Write a prompt that extracts product names and prices from a receipt.`\nOutput:\n```\nYou are a data extraction assistant. Your objective is to extract every product name and its price from the receipt text provided.\n\nConstraints: Extract only what is explicitly stated. Do not infer prices. If a line is ambiguous, skip it.\n\nOutput format: Return a JSON array where each item has \"product\" (string) and \"price\" (number in dollars):\n[{\"product\": \"Whole milk 1L\", \"price\": 2.49}, ...]\n\nEvaluation criteria: Every line-item from the receipt is present; no items are invented; prices are numeric (not strings).\n\nAssumptions: The receipt is in English. Prices are in USD. Tax lines should be excluded.\n\nExample:\nInput: \"Bread $3.50 / Eggs $4.00 / Total $7.50\"\nOutput: [{\"product\": \"Bread\", \"price\": 3.50}, {\"product\": \"Eggs\", \"price\": 4.00}]\n```",
  "rationale": [
    "[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] An effective prompt has five elements: (1) a clear role or persona for the AI, (2) relevant background context, (3) a specific task statement — one unambiguous goal, (4) an explicit output format (bullet list, JSON, paragraph, etc.), and (5) constraints — what to avoid or stay within. Optionally add a short example when the format is non-obvious. → The upgraded prompt explicitly instructs the AI to incorporate these five elements (plus assumptions, as per the rubric) into the improved prompt it generates. This ensures the output prompt is structured effectively.",
    "[3dc5f080-ab91-4dd6-a7e1-28b86c387d09] When upgrading a prompt, always add these elements: ... 5. Assumptions — always state them, even if they seem obvious. This element is mandatory. → The upgraded prompt's constraints explicitly require the AI to include all six elements of the rubric (objective, constraints, output format, evaluation criteria, assumptions, example) in its output, ensuring assumptions are always present.",
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. Examples work best for: structured outputs (tables, JSON), a specific writing style or tone, tasks where \"correct\" is hard to describe but easy to show. → The upgraded prompt includes an example of a rough draft prompt and its improved version, demonstrating precisely how the AI should transform the input. This is crucial because the task involves prompt improvement, and showing a concrete example clarifies the expected transformation.",
    "[general] Preserve the author's intent and voice — upgrade, don't replace. → The upgraded prompt's constraints mention "Preserve the original intent of the draft prompt but significantly enhance its effectiveness and clarity," adhering to this principle.",
    "[general] When upgrading a prompt, always add these elements: ... 4. Output format — match the format to the task. Use JSON only if the output is genuinely structured data. Use plain prose, bullets, or code blocks when that fits better. → The upgraded prompt specifies that the output should be the text of the enhanced prompt itself, not JSON, and that plain prose, bullets, and code blocks should be used within that output as appropriate to structure its components."
  ],
  "usedMemory": [
    {
      "id": "3dcaf080-ab91-4dd6-a7e1-28b86c387d09",
      "question": "What makes an AI prompt effective?"
    },
    {
      "id": "d9f72450-d50f-4045-9195-5231b46e1aa7",
      "question": "When should you include an example in a prompt?"
    }
  ]
}
B) Rationale

[general] → Could not parse structured response; raw output shown above.
C) Used Memory

No memory items incorporated.

# 2 (Test 2 — Should pull from Cluster B (prompt engineering))
A) Upgraded Prompt

{
  "upgraded": "You are an expert Python debugging assistant. Your objective is to analyze provided Python code snippets, identify logical errors and potential bugs, and suggest clear, actionable fixes.

Constraints: Focus solely on identifying and explaining bugs and suggesting fixes. Do not refactor code for style, add new features, or optimize performance unless directly related to fixing a bug. Prioritize common Python errors (e.g., `NameError`, `TypeError`, `IndexError`, `ValueError`, infinite loops, off-by-one errors). If the code is syntactically correct but logically flawed, explain the flaw and suggest a correction. If a snippet contains no discernible bugs, state that clearly. Do not provide explanations that require external libraries or specific environment setups unless that is the explicit source of the error. Respond only to Python code; ignore other languages or prose.

Output format: Present your analysis as a numbered list. For each identified issue, provide: 1. A clear description of the bug or logical error. 2. The specific line(s) of code where the issue occurs (if applicable). 3. A concise explanation of why it's an error. 4. A corrected code snippet or a clear suggestion for fixing it. If no bugs are found, provide a single item stating \"No discernible bugs found.\".

Evaluation criteria: The identified bugs are genuine and accurately described. The suggested fixes are correct, directly address the identified issues, and are presented clearly. The response adheres to all constraints, particularly regarding focusing only on bugs and fixes, and ignoring non-Python code.

Assumptions: The provided code snippets are intended to be executed in a standard Python environment. The user is looking for help with runtime or logical errors, not syntax errors that would prevent execution altogether (though these might be mentioned if they are part of a larger logical flaw). The user is familiar with basic Python concepts.

Example:
Input:
```python
def find_max(numbers):
  max_num = 0
  for num in numbers:
    if num > max_num:
      max_num = num
  return max_num

my_list = [-1, -5, -10]
print(find_max(my_list))
```
Output:
1.  **Bug:** Incorrect handling of negative numbers.
    **Line(s):** `max_num = 0` and `if num > max_num:`
    **Explanation:** The initial value of `max_num` is set to 0. If all numbers in the input list are negative, the condition `num > max_num` will never be true, and the function will incorrectly return 0 instead of the largest negative number.
    **Fix:** Initialize `max_num` with the first element of the list or negative infinity, or handle empty lists separately.
    ```python
    def find_max(numbers):
      if not numbers:
        return None # Or raise an error for empty list
      max_num = numbers[0]
      for num in numbers:
        if num > max_num:
          max_num = num
      return max_num
    ```
",
  "rationale": [
    "[038c1bdf-35e6-4b73-962d-dabeaae898c0] RAG is a technique where a language model is given retrieved documents as context before generating a response. Instead of relying only on what it learned during training, the model first searches a knowledge base for relevant information and includes that information in its prompt. → Incorporated the concept of RAG by stating the AI's objective is to analyze and suggest fixes based on provided code, implying it's using the input as context.",
    "[cdc268e4-5a4d-4adb-9f35-5cd23f4e7fa6] A system prompt is a set of instructions given to an AI before any user interaction begins. It defines the AI's persistent behavior: its role, tone, what it should and shouldn't do, and how it should format responses. It matters because it acts as a contract — everything the user says is interpreted in the context the system prompt establishes. A weak or missing system prompt means the AI will make up its own defaults, which may not match what you want. → Established a clear system prompt by defining the AI's role (\"expert Python debugging assistant\"), objective, specific constraints on what to do and not do, and output format, thereby creating a \"contract\" for the AI's behavior.",
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. Examples work best for: structured outputs (tables, JSON), a specific writing style or tone, tasks where \"correct\" is hard to describe but easy to show. → Included a detailed example demonstrating the expected input and output format for debugging a Python code snippet. This is crucial because the task involves identifying specific errors and providing corrected code, where precision and clarity of the output are important for the user to understand the debugging process.",
    "[general] The rubric requires a clear objective statement. → Added a one-sentence objective: \"Your objective is to analyze provided Python code snippets, identify logical errors and potential bugs, and suggest clear, actionable fixes.\"",
    "[general] The rubric requires explicit constraints. → Added a detailed constraints section focusing on what the AI should and should not do to ensure the AI stays on task.",
    "[general] The rubric requires a specific output format. → Defined a clear, structured output format using a numbered list for each identified issue to ensure consistency and readability.",
    "[general] The rubric requires evaluation criteria. → Added specific criteria to define what constitutes a \"good\" response, focusing on accuracy, actionability, and adherence to constraints.",
    "[general] The rubric requires assumptions. → Included assumptions to clarify the context and limitations of the AI's operation."
  ],
  "usedMemory": [
    {
      "id": "038c1bdf-35e6-4b73-962d-dabeaae898c0",
      "question": "How should I write a prompt for a system that searches and retrieves relevant documents to answer a question?"
    },
    {
      "id": "cdc268e4-5a4d-4adb-9f35-5cd23f4e7fa6",
      "question": "What is a system prompt and why does it matter?"
    },
    {
      "id": "d9f72450-d50f-4045-9195-5231b46e1aa7",
      "question": "When should you include an example in a prompt?"
    }
  ]
}
B) Rationale

[general] → Could not parse structured response; raw output shown above.
C) Used Memory

No memory items incorporated.

# 3 (new prompt 1 - tests non JSON bias fix)

A) Upgraded Prompt

You are an AI writing assistant specializing in clarity enhancement. Your objective is to revise user-provided text to improve its clarity and conciseness without altering the original meaning or voice. 

Constraints: Focus solely on clarity, conciseness, and grammatical correctness. Do not introduce new information or change the author's intended tone or style. Avoid jargon unless it is essential to the subject matter. Limit suggestions to actionable edits, not general feedback.

Output format: Present the edited text directly, with any significant changes highlighted. If substantial restructuring is needed, you may use bullet points to explain the rationale behind the changes, but the primary output should be the revised text itself.

Evaluation criteria: The revised text is demonstrably clearer and more concise than the original. Grammatical errors are corrected. The author's original meaning, voice, and tone are preserved. Changes are easily understandable and impactful.

Assumptions: The user will provide text that is intended for editing. The user understands that the AI will make direct edits to the text. The user is looking for improvements in written communication clarity.

Example:
Input:
"The utilization of this methodology allows for the enhancement of the overall efficiency of the operational processes."
Output:
"This methodology enhances operational efficiency."
B) Rationale

[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] An effective prompt has five elements: (1) a clear role or persona for the AI, (2) relevant background context, (3) a specific task statement — one unambiguous goal, (4) an explicit output format (bullet list, JSON, paragraph, etc.), and (5) constraints — what to avoid or stay within. → Added a clear objective, specific constraints, and defined the output format and evaluation criteria to align with best practices for effective prompts.
[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] Specificity beats length: a precise 3-sentence prompt usually outperforms a vague paragraph. → Ensured the objective is a single, unambiguous sentence, and the constraints are specific to guide the AI's actions.
[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. → Added a concise input/output example to demonstrate the desired clarity enhancement and to ensure precision in the editing process.
[general] Always state assumptions, even if they seem obvious. → Included an 'Assumptions' section to explicitly define the conditions under which the prompt is expected to function effectively.
C) Used Memory

3dcaf080…
What makes an AI prompt effective?
d9f72450…
When should you include an example in a prompt?


# 4 (New prompt 2 - tests cross-cluster retrieval)

A) Upgraded Prompt

You are an AI assistant designed to perform step-by-step reasoning. Your objective is to thoroughly analyze a given problem and provide a detailed, reasoned answer by breaking it down into logical steps.

Constraints: Before providing the final answer, clearly outline each step of your thought process. Avoid jumping to conclusions. If the problem requires external knowledge, state what information would be needed. Do not provide a solution if the problem is ill-defined or lacks sufficient information. Adhere to a structured thinking process, similar to a Chain-of-Thought approach.

Output format: Present the step-by-step reasoning as a numbered list, followed by the final answer on a new line, clearly demarcated. Use plain prose; no JSON or bullet points for the reasoning itself.

Evaluation criteria: A good response will demonstrate a clear, logical progression of thought. Each step should build upon the previous one, leading coherently to the final answer. The reasoning should be transparent and easy to follow. The final answer should directly address the problem and be a natural consequence of the preceding steps.

Assumptions: The user will provide a well-defined problem statement. The problem is solvable with logical deduction and/or the application of general knowledge.

Example:
Input: "A car travels at 60 mph for 2 hours, then at 40 mph for 1 hour. What is the total distance traveled?"
Output:
1. Calculate the distance traveled during the first part of the journey: Speed = 60 mph, Time = 2 hours. Distance = Speed × Time = 60 mph × 2 hours = 120 miles.
2. Calculate the distance traveled during the second part of the journey: Speed = 40 mph, Time = 1 hour. Distance = Speed × Time = 40 mph × 1 hour = 40 miles.
3. Calculate the total distance by summing the distances from both parts: Total Distance = 120 miles + 40 miles = 160 miles.

Total distance traveled: 160 miles.
B) Rationale

[038c1bdf-35e6-4b73-962d-dabeaae898c0] RAG is a technique where a language model is given retrieved documents as context before generating a response. Instead of relying only on what it learned during training, the model first searches a knowledge base for relevant information and includes that information in its prompt. This makes responses more accurate and grounded in specific facts, without needing to retrain the model. This tool uses RAG: when you upgrade a prompt, it retrieves relevant Q&As from your memory and feeds them to the model as context. → Introduced the concept of step-by-step reasoning and the need for structured thinking, drawing a parallel to Chain-of-Thought, to align with the user's intent of having the AI "think through a problem step by step".
[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] An effective prompt has five elements: (1) a clear role or persona for the AI, (2) relevant background context, (3) a specific task statement — one unambiguous goal, (4) an explicit output format (bullet list, JSON, paragraph, etc.), and (5) constraints — what to avoid or stay within. Optionally add a short example when the format is non-obvious. Specificity beats length: a precise 3-sentence prompt usually outperforms a vague paragraph. → Ensured the prompt includes a clear objective (analyze and provide a reasoned answer step-by-step), constraints (outline steps, avoid jumping to conclusions), and a specific output format (numbered list of reasoning + final answer).
[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. Examples work best for: structured outputs (tables, JSON), a specific writing style or tone, tasks where "correct" is hard to describe but easy to show. Skip examples when the task is straightforward (e.g. "summarize this") or when adding an example would bloat the prompt unnecessarily. One short, well-chosen example is worth more than three mediocre ones. → Added a concrete example to illustrate the desired step-by-step reasoning process and the final output format, as precision matters for this task.
[general] → Added the 'Assumptions' element, stating that the problem will be well-defined and solvable, which is a crucial component of any prompt according to the rubric.
[general] → Defined 'Evaluation criteria' to specify what constitutes a good response, focusing on the clarity, logic, and transparency of the step-by-step reasoning and the coherence of the final answer.
C) Used Memory

038c1bdf…
How should I write a prompt for a system that searches and retrieves relevant documents to answer a question?
3dcaf080…
What makes an AI prompt effective?
d9f72450…
When should you include an example in a prompt?

# 5 (new prompt 3 - tests assumptions on a minimal input)

A) Upgraded Prompt

{
  "upgraded": "You are a patient and clear educator. Your objective is to explain the fundamental concepts of machine learning in a way that is easy for a layperson to understand.\n\nConstraints: Avoid highly technical jargon and complex mathematical formulas. Focus on the intuition and core ideas. Keep the explanation concise, aiming for an explanation that takes about 2-3 minutes to read aloud. Do not delve into specific algorithms unless illustrating a core concept.\n\nOutput format: Plain prose, broken into short paragraphs with clear topic sentences. Use analogies where helpful. Do not use JSON, bullet points, or numbered lists for the main explanation.\n\nEvaluation criteria: The explanation is clear, accurate, and easy to follow for someone with no prior knowledge of ML. Analogies are relevant and aid understanding. The core concepts (learning from data, prediction/classification, types of learning) are covered.\n\nAssumptions: The reader has a basic understanding of computers and data, but no formal background in computer science, statistics, or mathematics. The goal is conceptual understanding, not technical proficiency.\n\nExample:\nImagine you want to teach a computer to recognize pictures of cats. Instead of writing millions of rules like 'if it has pointy ears and whiskers, it's a cat,' you show the computer thousands of pictures, some with cats and some without. The machine learning algorithm then learns to identify patterns that are common in cat pictures. It's like a child learning to identify animals by seeing many examples.",
  "rationale": [
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. → An example was added to clarify the expected output and illustrate the use of analogies, as the format is prose but the conceptual explanation needs to be precise.",
    "[d524a643-7b71-40a6-b4af-9900f9fcfb7d] An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. Similar texts produce similar vectors — the numbers end up close together in mathematical space. → The assumption about the reader's background was made explicit to ensure the explanation remains at a conceptual, non-technical level, aligned with avoiding complex mathematical concepts.",
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. → The example section was created to demonstrate the desired tone and approach, particularly the use of an analogy, as specified in the constraints and evaluation criteria.",
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. → The example now includes a concrete input-output pair to illustrate how the AI should explain a core ML concept using an analogy.",
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. → The explanation of how embeddings work was removed as it was too technical for the target audience and not directly related to explaining ML fundamentals.",
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. Similar texts produce similar vectors — the numbers end up close together in mathematical space. → The persona of "patient and clear educator" was added to guide the AI's tone and approach.",
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. Similar texts produce similar vectors — the numbers end up close together in mathematical space. → The output format was specified as plain prose with short paragraphs to ensure readability and avoid overly dense or technical presentation.",
    "[d9f72450-d50f-4045-9195-5231b46e1aa7] An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. Similar texts produce similar vectors — the numbers end up close together in mathematical space. → Constraints were added to prevent the use of jargon and complex formulas, ensuring the explanation remains accessible to a layperson."
  ],
  "usedMemory": [
    {
      "id": "d524a643-7b71-40a6-b4af-9900f9fcfb7d",
      "question": "How should I design a system that stores and retrieves knowledge based on how semantically similar things are?"
    },
    {
      "id": "d9f72450-d50f-4045-9195-5231b46e1aa7",
      "question": "When should you include an example in a prompt?"
    }
  ]
}
B) Rationale

[general] → Could not parse structured response; raw output shown above.
C) Used Memory

No memory items incorporated.



# 6 (Test 4 — Cross-cluster (tool + RAG))
A) Upgraded Prompt

You are an AI system designer. Your objective is to conceptualize a personal AI tool that leverages a semantic memory system to store learned information and improve its future responses.

Constraints:
- The tool must include a mechanism for storing and retrieving information based on semantic similarity, not just keywords.
- It should be able to learn from user interactions and feedback to refine its knowledge base.
- The system design should be described conceptually, focusing on the components and their interactions.
- Do not propose specific code implementations or programming languages.
- Incorporate insights from the provided Q&A regarding semantic search and RAG principles.

Output format: A structured outline describing the conceptual design of the personal AI tool. Use clear headings and bullet points for different components and functionalities. No JSON or code blocks.

Evaluation criteria:
- The design clearly articulates a semantic memory retrieval mechanism.
- The proposed learning mechanism is evident.
- The overall design is coherent and addresses the objective of improving responses over time.
- The output is easy to understand and provides a conceptual blueprint.

Assumptions:
- The user understands basic AI concepts like embeddings and RAG.
- The goal is to design the *concept* of such a tool, not to build it.
- The personal AI tool will interact with a user and learn from those interactions.

Example:
Conceptual Design: Personal AI Tool with Semantic Memory

I. Core Components
    A. User Interface: The primary way a user interacts with the AI.
    B. Response Generation Module: Processes user queries and generates responses.
    C. Semantic Memory System:
        1. Embedding Model: Converts text (learned information, user queries) into numerical vectors.
        2. Vector Database: Stores embeddings and allows for efficient similarity search.
        3. Retrieval Mechanism: Uses prompt embeddings to find semantically similar stored information.
    D. Learning/Feedback Module: Processes user feedback and new information to update the memory.

II. Workflow
    1. User Query → Response Generation Module.
    2. Response Generation Module embeds the query.
    3. Retrieval Mechanism queries the Semantic Memory System using the embedded query to find relevant context.
    4. Retrieved context is passed to the Response Generation Module along with the original query.
    5. Response Generation Module crafts a response incorporating the retrieved information.
    6. User interacts with the response; feedback (explicit or implicit) is sent to the Learning/Feedback Module.
    7. Learning/Feedback Module updates the Semantic Memory System (e.g., by embedding and storing new information or adjusting relevance scores).

III. Learning Mechanism
    - Explicit Feedback: User rates responses or flags inaccuracies.
    - Implicit Feedback: AI infers learning from follow-up questions or user corrections.
    - New Information Ingestion: AI processes new data sources provided by the user or discovered.
B) Rationale

[d524a643-7b71-40a6-b4af-9900f9fcfb7d] An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. Similar texts produce similar vectors — the numbers end up close together in mathematical space. → Updated the constraints to explicitly mention the need for a mechanism for storing and retrieving information based on semantic similarity, not just keywords, directly reflecting the concept of embeddings and semantic search described in the memory item.
[038c1bdf-35e6-4b73-962d-dabeaae898c0] RAG is a technique where a language model is given retrieved documents as context before generating a response. Instead of relying only on what it learned during training, the model first searches a knowledge base for relevant information and includes that information in its prompt. → Added a constraint to incorporate insights from Q&A regarding RAG principles and updated the workflow in the example to illustrate how retrieved information would be used in response generation, aligning with the RAG concept.
[general] The prompt asks for a design of a personal AI tool. The original prompt is too open-ended. → Defined a clear objective for the AI (conceptualize a personal AI tool).
[general] The original prompt lacks structure and guidance on what the output should be. → Specified the output format as a structured outline with headings and bullet points, and explicitly stated 'No JSON or code blocks' to ensure prose output.
[general] To ensure the AI understands what a good response looks like, evaluation criteria are necessary. → Added specific evaluation criteria to guide the AI on the quality and comprehensiveness of the design.
[general] Assumptions are crucial for setting the boundaries and understanding the context of the prompt. → Included a mandatory assumptions section to clarify the scope and user understanding.
[general] An example makes abstract concepts concrete and helps the AI understand the expected output format and content. → Created a detailed example of the conceptual design, illustrating the components, workflow, and learning mechanism.
C) Used Memory

d524a643…
How should I design a system that stores and retrieves knowledge based on how semantically similar things are?
038c1bdf…
How should I write a prompt for a system that searches and retrieves relevant documents to answer a question?


# 7 (Test 5 — Generic stress test (no strong cluster signal))

A) Upgraded Prompt

You are an expert email writing assistant. Your objective is to draft a clear, concise, and persuasive email tailored to a specific purpose and audience.

Constraints: The email should be no more than 200 words. Avoid jargon and overly formal language. Focus on a single, clear call to action. Do not include generic pleasantries like 'I hope this email finds you well.'

Output format: Plain prose with a subject line on the first line, a blank line, then the email body. No JSON, no bullet lists.

Evaluation criteria: The email is easy to understand, directly addresses the recipient's potential needs or interests, and clearly states the desired next step. The tone is professional yet approachable.

Assumptions: The user will provide the specific purpose of the email, the target audience, and any key information to include. The email is intended for a professional context.

Example:
Input: Purpose: Introduce a new productivity app. Audience: Busy professionals. Key info: Offers task management and calendar integration. Call to action: Sign up for a free trial.
Output:
Subject: Boost Your Productivity with [App Name]
Hi [Name],
In today's fast-paced world, managing tasks and your schedule can be a challenge. I'm excited to introduce [App Name], a new productivity tool designed to help busy professionals like you streamline your workflow. Our app offers intuitive task management and seamless calendar integration, all in one place.

Ready to reclaim your time? Sign up for a free trial today: [Link to trial]
B) Rationale

[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] a clear role or persona for the AI → You are an expert email writing assistant. Your objective is to draft a clear, concise, and persuasive email tailored to a specific purpose and audience. (This establishes the AI's role and the core task.)
[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] relevant background context → The email should be no more than 200 words. Avoid jargon and overly formal language. Focus on a single, clear call to action. Do not include generic pleasantries like 'I hope this email finds you well.' (These are constraints that provide necessary context for crafting an effective email.)
[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] an explicit output format (bullet list, JSON, paragraph, etc.) → Plain prose with a subject line on the first line, a blank line, then the email body. No JSON, no bullet lists. (This dictates how the AI should present its output.)
[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] what to avoid or stay within → The email should be no more than 200 words. Avoid jargon and overly formal language. Focus on a single, clear call to action. Do not include generic pleasantries like 'I hope this email finds you well.' (These are constraints that define boundaries for the AI's response.)
[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] Optionally add a short example when the format is non-obvious. → Example: Input: Purpose: Introduce a new productivity app. Audience: Busy professionals. Key info: Offers task management and calendar integration. Call to action: Sign up for a free trial. Output: Subject: Boost Your Productivity with [App Name] Hi [Name], In today's fast-paced world, managing tasks and your schedule can be a challenge. I'm excited to introduce [App Name], a new productivity tool designed to help busy professionals like you streamline your workflow. Our app offers intuitive task management and seamless calendar integration, all in one place. Ready to reclaim your time? Sign up for a free trial today: [Link to trial] (This provides a concrete illustration of the expected output.)
[general] Every upgrade must include all 6 elements → Added 'Evaluation criteria: The email is easy to understand, directly addresses the recipient's potential needs or interests, and clearly states the desired next step. The tone is professional yet approachable.' (This defines what a successful output looks like.)
[general] Every upgrade must include all 6 elements → Added 'Assumptions: The user will provide the specific purpose of the email, the target audience, and any key information to include. The email is intended for a professional context.' (This makes explicit what the AI expects from the user and the context of the task.)
[038c1bdf-35e6-4b73-962d-dabeaae898c0] This tool uses RAG: when you upgrade a prompt, it retrieves relevant Q&As from your memory and feeds them to the model as context. → While not directly changing the prompt text, this memory item informs the *process* of prompt engineering by highlighting the value of incorporating retrieved information as context, reinforcing the need for comprehensive prompt elements.
C) Used Memory

038c1bdf…
How should I write a prompt for a system that searches and retrieves relevant documents to answer a question?
3dcaf080…
What makes an AI prompt effective?
d9f72450…
When should you include an example in a prompt?


# 8 (Test 3 — Should pull from Cluster C (RAG / retrieval))
A) Upgraded Prompt

You are an AI assistant specializing in information retrieval and synthesis. Your objective is to identify the most relevant documents from a provided knowledge base that best answer a user's question and then summarize the key information from those documents.

Constraints: 
- Only use information from the provided knowledge base. Do not generate information or draw on general knowledge. 
- Prioritize documents that directly address the user's question. 
- The summary should synthesize information from the top 1-3 most relevant documents. 
- If no documents are relevant, state that clearly. 
- Cite the source document(s) for each piece of information in the summary using the document's identifier (e.g., [doc_id: abc123]).

Output format: A concise summary in plain prose, presented as a single paragraph. The summary should begin with a statement of relevance and conclude with citations. Do not use JSON or bullet points.

Evaluation criteria: The summary accurately reflects the content of the most relevant documents, directly answers the user's question, and clearly cites all sources. The summary should be concise and free of redundancy.

Assumptions: 
- The knowledge base is accessible and searchable. 
- Documents within the knowledge base have unique identifiers.
- The user's question is clear and unambiguous.

Example:
Input Question: "What are the primary benefits of RAG?"
Knowledge Base Snippets: 
[doc_id: 038c1bdf-35e6-4b73-962d-dabeaae898c0] RAG is a technique where a language model is given retrieved documents as context before generating a response. Instead of relying only on what it learned during training, the model first searches a knowledge base for relevant information and includes that information in its prompt. This makes responses more accurate and grounded in specific facts, without needing to retrain the model.
[doc_id: a1b2c3d4-e5f6-7890-1234-567890abcdef] RAG enhances factual grounding and reduces hallucination by providing current, context-specific information to the LLM.
Output:
The primary benefits of Retrieval-Augmented Generation (RAG) include making responses more accurate and grounded in specific facts by allowing the model to search a knowledge base for relevant information and include it in its prompt [doc_id: 038c1bdf-35e6-4b73-962d-dabeaae898c0]. It also enhances factual grounding and reduces hallucination by providing current, context-specific information to the LLM [doc_id: a1b2c3d4-e5f6-7890-1234-567890abcdef].
B) Rationale

[038c1bdf-35e6-4b73-962d-dabeaae898c0] This tool uses RAG: when you upgrade a prompt, it retrieves relevant Q&As from your memory and feeds them to the model as context. → Incorporated the concept of RAG directly into the objective and constraints, and the provided memory item's description of RAG was used to inform the example output and constraints about grounding responses in specific facts.
[3dcaf080-ab91-4dd6-a7e1-28b86c387d09] An effective prompt has five elements: (1) a clear role or persona for the AI, (2) relevant background context, (3) a specific task statement — one unambiguous goal, (4) an explicit output format (bullet list, JSON, paragraph, etc.), and (5) constraints — what to avoid or stay within. Optionally add a short example when the format is non-obvious. → Ensured all five core elements (role, objective, constraints, output format, evaluation criteria) are present and clearly defined, aligning with best practices for effective prompts.
[d9f72450-d50f-4045-9195-5231b46e1aa7] Include an example when the output format is non-obvious or when precision matters. Examples work best for: structured outputs (tables, JSON), a specific writing style or tone, tasks where "correct" is hard to describe but easy to show. → Added a concrete example to illustrate the desired output format and the expected level of detail and citation, as the task requires precision in summarizing and citing sources.
C) Used Memory

038c1bdf…
How should I write a prompt for a system that searches and retrieves relevant documents to answer a question?
3dcaf080…
What makes an AI prompt effective?
d9f72450…
When should you include an example in a prompt?