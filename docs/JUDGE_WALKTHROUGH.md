# Judge walkthrough

## Two-minute workflow

1. Open the app. Choose **Explore a sample** to learn the interface. Its records are explicitly fictional; this does not demonstrate live Qloo integration.
2. Enter your product, a short description, aggregate intended audience and one campaign goal. Choose voice and format.
3. Open **Cultural research**. Remove fictional references and search for a public book, film, artist or brand. Confirm the exact entity from the returned candidate descriptions.
4. Choose **Find creative connections**. The agent performs a bounded sequence of book, movie and brand research calls. Successful categories survive a failure in another category.
5. Compare the three directions. Inspect **Without cultural research**, **What the evidence changes**, the evidence IDs and the provenance trail. Theme selection uses disclosed rules on returned tags/descriptions; it is creative interpretation, not Qloo's recommendation of an advertisement.
6. Select a direction, add production notes and export Markdown or JSON. Reload to verify device-local persistence.

## What makes Qloo essential

The live path starts from confirmed Qloo entity IDs, discovers cross-domain related entities and uses their metadata to select creative treatments. Different returned cultural signals change the proposed scenes and hooks. Without usable evidence it does not invent live cultural directions. Sparse metadata produces an explicitly exploratory reference rather than a false theme claim.

## Evaluation and honest limits

The tests compare contrasting cultural metadata and verify that treatments change. They are controlled fixtures, not measured real-world marketing results. No conversion uplift, individual preference inference, endorsement, LLM generation or finished media production is claimed. Live search, book/movie/brand insights, partial-result retention, exports and reload persistence have been verified; see CURRENT_STATE.md. Some reference/category combinations have no usable signal. Add another reference when the app explains that a category needs one.
