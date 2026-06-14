# Architecture

Mobile app: Expo React Native

Current flow:
Home -> New Bill Setup -> Assign Items -> Quick Review/Summary -> History

AI flow to add next:
Receipt Photo -> Node API -> Azure AI Document Intelligence -> Parsed items -> Mobile app

Copilot SDK flow to add later:
Split results -> Backend Copilot SDK agent -> Explain split / generate payment message / detect unfair split

# SnapSplit Architecture

```mermaid
flowchart TD
    A[User opens SnapSplit mobile app] --> B[Expo React Native Mobile App]

    B --> C[Split Bill Flow]
    C --> D[Take Picture / Upload Receipt / Demo Receipt]

    D --> E[Node.js Express API]
    E --> F[Azure AI Document Intelligence]
    F --> G[Prebuilt Receipt Model]

    G --> H[Normalized Receipt Data]
    H --> I[Receipt Review Screen]

    I --> J[Edit Restaurant Name]
    I --> K[Edit Items, Prices, and Quantity]

    J --> L[Setup Split]
    K --> L

    L --> M[Add People]
    L --> N[Add Tip]
    L --> O[Choose Split Mode]

    O --> P[Equal Split]
    O --> Q[Manual Item Assignment]

    P --> R[Split Engine]
    Q --> R

    R --> S[Split Summary]
    S --> T[Save to History]

    T --> U[History Screen]
    U --> V[Bill Detail Screen]

    V --> W[Original Receipt Image]
    V --> X[Pretty Split Summary]
```

## Data Flow

1. The user uploads or takes a receipt photo.
2. The mobile app sends the image to the Node.js API.
3. The API sends the receipt to Azure AI Document Intelligence.
4. Azure extracts receipt information using the prebuilt receipt model.
5. The app opens the editable Receipt Review screen.
6. The user confirms or edits restaurant name, items, prices, and quantities.
7. The user adds people, tip, and chooses split mode.
8. SnapSplit calculates the final amount per person.
9. The final split is saved to History with the original receipt and split summary.
