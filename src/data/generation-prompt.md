# Phrase Generation Prompt

This object contains the top 100 most useful phrases for a language learner, strictly categorized by word count.

## Structure rules
- The output must be a single JSON object containing an array of phrase objects.
- Each phrase object must have an `id` (integer 1-100).
- Each phrase object has a `common` object and a `slang` object.
- The `common` object requires keys: `co-cartagena`, `co-medellin`, `us-ca`.
- The `slang` object is optional but should be included if there is a relevant regional slang term.

## Content Distribution Rules (Strict)
1.  **Top 10 (ID 1-10)**: Exactly **1 word** in the primary language (Spanish/English).
    *   *Examples: Hola, Hello, Gracias, Thanks, Sí, Yes.*
2.  **Top 20 (ID 11-30)**: Exactly **2 words**.
    *   *Examples: Buenos días, Good morning, Muchas gracias, Thank you.*
3.  **Top 30 (ID 31-60)**: Exactly **3 words**.
    *   *Examples: ¿Cómo estás tú?, How are you?, No hay problema, No problem here.*
4.  **Top 40 (ID 61-100)**: Exactly **4 words**.
    *   *Examples: Mucho gusto en conocerte, Nice to meet you, ¿Qué hora es ya?, What time is it?*

## Regional Dialects
- **co-cartagena**: Coastal Colombian Spanish (Costeño). Informal, often cuts 's' at end of words, vibrant.
- **co-medellin**: Paisa Spanish. Melodic, uses "vos" (though standard "tú"/"usted" is fine for common phrases), specific slang like "parce".
- **us-ca**: Modern California English (Standard US English).
    - **Slang**: SoCal slang, specifically used by Gen Z and Millennials. Avoid dated slang.

## Slang
- If a region has a specific slang word/phrase that conveys the same meaning as the common phrase, add it to the `slang` object.
- **Example**:
    - Common: "Amigo" / "Friend"
    - Slang: `{"co-medellin": "Parce", "us-ca": "Bro"}`
