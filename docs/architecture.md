# Architecture

Mobile app: Expo React Native

Current flow:
Home -> New Bill Setup -> Assign Items -> Quick Review/Summary -> History

AI flow to add next:
Receipt Photo -> Node API -> Azure AI Document Intelligence -> Parsed items -> Mobile app

Copilot SDK flow to add later:
Split results -> Backend Copilot SDK agent -> Explain split / generate payment message / detect unfair split
