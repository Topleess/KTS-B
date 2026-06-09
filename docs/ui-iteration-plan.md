# KTS Beauty UI Iteration Plan

## Product Goal
Сделать KTS Beauty нативно ощущающимся Telegram/mobile-first beauty assistant: стабильная геометрия, предсказуемый скролл, единые компоненты, меньше декоративного шума на рабочих экранах.

## Non-Goals
- Не подключать backend.
- Не реализовывать реальные покупки, сканер, загрузку фото и генерацию рутины.
- Не добавлять новые крупные экраны до стабилизации shell и UI-системы.

## Interaction Rules
- На каждом экране ровно один scroll container.
- Fixed bottom UI всегда резервирует место через bottom inset.
- Bottom nav виден только на основных tab-экранах и согласован с detail/back flow.
- Fixed CTA используется только в сценариях пошагового действия.
- Blur/fade не лечит layout-проблемы, а добавляется только после корректной геометрии.
- Рабочие экраны не используют тяжелый фон, крупный editorial heading и glassmorphism одновременно.

## Iterations
1. Mobile shell and scroll geometry.
2. Questionnaire template.
3. UI primitives and tokens.
4. Internal app standardization.
5. Navigation and persistence cleanup.
6. Mobile QA and polish.

## QA Checklist
- iPhone-sized viewport 390x844.
- Android-sized viewport 360x800.
- Short and long questionnaire content.
- Detail screen back behavior.
- Bottom nav does not cover content.
- CTA does not cover options.
- No layout jump during transitions.
- Light/dark theme readable.
