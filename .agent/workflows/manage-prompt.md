---
description: How to update and test the strict translation prompt
---

This workflow guides you through updating the strict translation prompt and verifying the changes using the test script.

### 1. Update the Prompt Template
Modify the parameterized prompt template at [translation_strict.md](file:///Users/mac/Documents/git/speaknative/prompts/translation_strict.md).

Common parameters you can use in the template:
- `{{LOCATION}}`: e.g., Cartagena, Medellin
- `{{USER_GENDER}}`: male, female, neutral
- `{{RECIPIENT_GENDER}}`: male, female, neutral
- `{{SLANG_COUNT}}`: 0-5

### 2. Run Validation Tests
After updating the template, run the test script to ensure the output format and translation quality are correct.

// turbo
```bash
npx ts-node scripts/test_strict_prompt.ts
```

### 3. Review Test Output
Check the console output of the test script. It should show the generated prompt and the response from Gemini for several test cases.
Verify that:
- There is no conversational filler.
- The translation is accurate and preserves subjects.
- Slang variations are modern and relevant to the location.
- The output format is strictly:
  ```
  translation
  slang1
  slang2
  ...
  ```
