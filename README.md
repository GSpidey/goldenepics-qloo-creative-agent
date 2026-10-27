# GoldenEpics Qloo Creative Agent

Audience-guided campaign planning for small businesses and independent creators.

Status: planning and documentation. Implementation and a functional demonstration are pending.

## Planned workflow

1. Describe a product, campaign goal and intended audience.
2. Provide cultural interests or taste references.
3. An agent queries the Qloo API, interprets relevant results and develops creative directions.
4. Compare concepts, refine a direction and export a campaign brief with scripts and visual guidance.

Qloo evidence and the agent's creative interpretations will be distinguishable so creators can understand why a direction was suggested.

## Development scope

The submission will include the complete source, interface, agent orchestration, Qloo integration, sample inputs, tests and setup instructions for this workflow. Provider credentials will be configured through environment variables. A judge-accessible working demo and an evidence-based account of implemented features are release requirements.

## Milestones

- Obtain Qloo API access and verify a real taste query.
- Implement the brief-to-recommendations-to-creative-directions workflow.
- Validate behavior with real API responses, including unavailable-service handling.
- Prepare a reproducible public release, functional demo and submission description.

Target: Qloo Agentic Hackathon, October 30, 2026, 11:45 p.m. Eastern / 8:45 p.m. Pacific.
Official rules: https://qloo.devpost.com/rules

## Relationship to GoldenEpics Studio

This focused open-source application contributes an audience-research capability to GoldenEpics Studio's broader advertising workflow. Its release will be independently runnable with documented provider configuration. Shared components and their provenance will be documented.

Related commerce project: https://github.com/GSpidey/goldenepics-paypal-campaign-commerce

## License

MIT. Third-party dependencies retain their respective licenses.
