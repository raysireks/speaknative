---
description: How to test the matching quality and slang penalty logic
---

To verify how the system matches a phrase across locales (including the slang penalty), use the following command:

```bash
# Template
export GOOGLE_APPLICATION_CREDENTIALS="service-account.json"
npx tsx src/scripts/test_matching_quality.ts "YOUR PHRASE" "SOURCE_LOCALE"

# Example: Testing "Qué hora es?" from Medellín
npx tsx src/scripts/test_matching_quality.ts "Qué hora es?" "es-CO-MDE"
```

The script will output the top matching variations for each locale, highlighting the "WINNER" (the phrase the user will actually see) and showing the impact of the slang penalty if applied.
