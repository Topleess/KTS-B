# Отчет по фронтенду KTS Beauty

## 1. Общее описание приложения

KTS Beauty сейчас реализован как мобильный интерактивный frontend-прототип beauty-assistant. Приложение ведет пользователя от первого экрана и онбординга к анкете, имитирует сбор персональной рутины ухода, а затем открывает внутреннюю часть приложения с рутиной, сканом, каталогом и профилем.

Текущий уровень зрелости: UI-прототип с полной визуальной навигацией и моковыми данными. Пользовательские сценарии кликабельны, но бизнес-логика подбора, backend, авторизация, Telegram SDK, реальные API-запросы и постоянное хранение результата пока не подключены.

Основной пользовательский сценарий:

```text
welcome -> onboarding -> pre-q -> q1..q7 -> generating -> result -> internal app
```

Приложение собрано вокруг mobile-first опыта: корневой layout ограничивает ширину до 430px, использует высоту `100dvh`, safe-area отступы и нижнюю навигацию внутри app shell.

## 2. Технологический стек и точки входа

### Стек

- `Next.js 15` с App Router.
- `React 19`.
- `TypeScript`.
- `Tailwind CSS 4` через `@import "tailwindcss"` и `@theme`.
- `motion/react` для анимаций и drag-жеста на welcome-экране.
- `lucide-react` для иконок.
- `next/image` для продуктовых изображений, логотипов магазинов и skin dynamics.

### Ключевые файлы

- `app/layout.tsx` - глобальная HTML/body-обертка, шрифты `Inter` и `Playfair Display`, metadata, viewport-настройки, mobile-shell контейнер.
- `app/page.tsx` - главный клиентский экран и верхний state-machine по `view`.
- `app/globals.css` - дизайн-токены, CSS variables для light/dark тем и Tailwind theme aliases.
- `components/WelcomeScreen.tsx` - первый экран со slider-жестом.
- `components/Screens.tsx` - onboarding, intro перед анкетой, генерация, результат.
- `components/QuestionnaireScreens.tsx` - общий wizard layout и 7 шагов анкеты.
- `components/InternalApp.tsx` - внутреннее приложение после анкеты: tabs, detail screens, mock-фичи.
- `components/UI.tsx` - базовые UI-компоненты и тип `AppAnswers`.
- `lib/mock-data.ts` - моковые доменные данные и типы внутреннего приложения.
- `public/assets` - изображения бренда, товаров, ритейлеров и динамики кожи.

Юридические страницы вынесены в отдельные route-файлы:

- `app/legal/privacy/page.tsx`
- `app/legal/consent/page.tsx`

Обе страницы сейчас являются заглушками под будущие юридические документы.

## 3. Карта экранов

### Верхний сценарий до входа во внутреннее приложение

| View | Компонент | Что делает |
| --- | --- | --- |
| `welcome` | `WelcomeScreen` | Первый экран с брендом, hero-текстом, ссылками на документы и drag-to-start контролом. |
| `onboarding` | `OnboardingCarousel` | Карусель из 4 слайдов о возможностях приложения. Есть прогресс, назад, дальше и пропуск. |
| `pre-q` | `PreQuestionnaireIntro` | Вступление перед анкетой: объясняет, что будет собран персональный уход. |
| `q1` | `QStep1` | Выбор направлений: лицо, тело, волосы, SPF. |
| `q2` | `QStep2` | Выбор фокусов кожи: постакне, жирный блеск, увлажнение и т.д. |
| `q3` | `QStep3` | Выбор типа кожи. |
| `q4` | `QStep4` | Ограничения: чувствительность и исключаемые ингредиенты. |
| `q5` | `QStep5` | Возраст и опыт в уходе. |
| `q6` | `QStep6` | Бюджет и предпочитаемые магазины. |
| `q7` | `QStep7` | Уточняющие блоки: фото кожи и текущие средства. Сейчас визуально подготовлены как future-фичи. |
| `generating` | `GeneratingScreen` | Имитация анализа через таймеры и статусы. |
| `result` | `RoutineResultScreen` | Экран "рутина готова" с кратким summary. |

### Внутреннее приложение

Внутренняя часть открывается для view:

- `routine`
- `scan`
- `catalog`
- `profile`

Эти значения передаются в `InternalApp` как `initialTab`.

Основные tabs:

| Tab | Экран | Что показывает |
| --- | --- | --- |
| `routine` | `RoutineScreen` | Рутину по дням и периодам: утро, вечер, 1-2 раза. |
| `scan` | `ScanScreen` | Точки входа в INCI-сканер, штрихкод, фото продукта, фото кожи. |
| `catalog` | `CatalogScreen` | Каталог с фильтр-чипами и списком товаров из моковых данных. |
| `profile` | `ProfileScreen` | Профиль, переключение темы, ссылки на "Мои средства", "Динамика кожи", очистка данных. |

Детальные экраны внутри `InternalApp`:

| `screen.name` | Компонент | Назначение |
| --- | --- | --- |
| `routineStep` | `RoutineStepDetail` | Деталка шага рутины: зачем шаг, почему подходит, как использовать. |
| `replaceProduct` | `ReplaceProduct` | Подбор альтернативы для шага рутины. Выбор остается локальным и не сохраняется. |
| `productDetail` | `ProductDetail` | Карточка товара: бренд, цена, магазин, активы, INCI, причины рекомендации. |
| `priceCompare` | `PriceCompare` | Сравнение цен по магазинам и mock-график динамики цены. |
| `inciResult` | `InciResult` | Mock-разбор состава INCI с полезными, нейтральными и осторожными ингредиентами. |
| `myProducts` | `MyProducts` | Кабинет средств пользователя с фильтрами по статусам. |
| `skinDynamics` | `SkinDynamics` | Фото по неделям, метрики динамики кожи и возможные факторы влияния. |

## 4. Навигация и обработка действий

### Верхняя навигация в `app/page.tsx`

Главный экран реализован как client component и хранит верхнее состояние:

- `view` - текущий экран верхнего flow.
- `QDirection` - направление перехода для анимации.
- `answers` - ответы анкеты.
- `hasRoutine` - флаг, что рутина сгенерирована.

Переходы выполняются функцией:

```ts
const nav = (v: string, dir: number = 1) => {
  setQDirection(dir);
  setView(v);
};
```

Рендер сделан через `switch (view)` внутри `AnimatePresence`. Каждый экран получает callback-и вроде `onNext`, `onBack`, `onSkip`, которые просто вызывают `nav(...)`.

Примеры:

- `WelcomeScreen.onNext` переводит в `onboarding`.
- `OnboardingCarousel.onNext` переводит в `pre-q`.
- `PreQuestionnaireIntro.onNext` переводит в `q1`.
- `QStep7.onNext` переводит в `generating`.
- `GeneratingScreen.onNext` выставляет `hasRoutine = true` и переводит в `result`.
- `RoutineResultScreen.onFinish` переводит во внутренний tab `routine`.

Анимации верхних экранов:

- `AnimatePresence` с `mode="wait"`.
- `AnimatedQStep` для шагов анкеты.
- `fadeVariants` для opacity/scale переходов.
- Отдельный background image меняет blur, brightness и scale в зависимости от `view`.

### Внутренний роутинг в `InternalApp`

`InternalApp` не использует URL-routing. Внутри есть два уровня состояния:

- `tab: AppTab` - текущий нижний tab.
- `screen: ScreenState` - текущий detail screen внутри tab.

Основные методы:

```ts
const open = (next: ScreenState) => setScreen(next);
const back = () => setScreen({ name: "main" });
const navigateTab = (next: string) => {
  setTab(next as AppTab);
  setScreen({ name: "main" });
};
```

`BottomNav` вызывает `navigateTab`. Любой detail screen открывается через `open({ name: "...", productId?, stepId? })`.

Дополнительно реализовано сохранение scroll-позиции для последних карточек товара:

- `recentDetailScroll` хранит до 2 последних `{ productId, scrollTop }`.
- При уходе с `productDetail` позиция запоминается.
- При повторном открытии того же продукта scroll восстанавливается.

### Обработка анкеты

Ответы анкеты хранятся в `answers: AppAnswers`, а шаги получают `answers` и `setAnswers`.

Тип ответов:

```ts
export type AppAnswers = {
  category: string[];
  focus: string[];
  skinType: string;
  restrictions: { sensitivity: Record<string, boolean>; exclude: string[] };
  age: string;
  experience: string;
  budget: string;
  stores: string[];
};
```

Механика шагов:

- `QStep1` - multi-select по `category`.
- `QStep2` - multi-select по `focus`.
- `QStep3` - single-select `skinType`.
- `QStep4` - toggles в `restrictions.sensitivity` и multi-select в `restrictions.exclude`; шаг необязательный.
- `QStep5` - single-select `age` и `experience`.
- `QStep6` - single-select `budget` и multi-select `stores`.
- `QStep7` - сейчас не меняет `answers`; показывает future-блоки.

Доступность кнопки "Далее" контролируется через `canNext` в `WizardLayout`. Обязательные шаги блокируют переход, пока пользователь не сделал нужный выбор.

### Тема и очистка данных

Тема хранится в `localStorage` под ключом `kts-theme`. При старте `app/page.tsx` читает сохраненное значение и переключает класс `.dark` на `document.documentElement`.

В `ProfileScreen` переключение темы делает три действия:

```ts
setTheme(next);
localStorage.setItem("kts-theme", next);
document.documentElement.classList.toggle("dark", next === "dark");
```

Очистка данных идет через `handleClear()` в `app/page.tsx`:

- `localStorage.clear()`.
- `hasRoutine` сбрасывается в `false`.
- `answers` сбрасывается в `defaultAnswers`.
- На `document.documentElement` добавляется `.dark`.
- `view` возвращается в `welcome`.

Важно: `localStorage.clear()` удаляет все ключи localStorage для домена, а не только ключи приложения.

### Декоративные и mock-only действия

Часть интерфейса сейчас подготовлена визуально, но не имеет настоящей бизнес-логики:

- Кнопки "Купить" не ведут во внешний магазин.
- "Загрузить фото" и "Добавить средства" на `QStep7` не открывают upload/input flow.
- "Применить замену" в `ReplaceProduct` возвращает назад, но не меняет рутину.
- Фильтры каталога визуально выбираются, но список не фильтруется по выбранному фильтру.
- INCI-анализ, price compare, cabinet и skin dynamics используют моковые данные.
- "Данные анкеты" в профиле имеет пустой `onClick`.

## 5. Состояние и данные

### Локальное React-состояние

Ключевое состояние верхнего flow:

- `view`
- `QDirection`
- `answers`
- `hasRoutine`

Ключевое состояние внутреннего приложения:

- `tab`
- `screen`
- `recentDetailScroll`
- локальные фильтры: период рутины, день, фильтр каталога, фильтр замен, фильтр моих средств.
- локальные UI-состояния: открытие notification dropdown, тема профиля.

`hasRoutine` живет только в памяти React. После перезагрузки страницы флаг теряется.

`answers` тоже живут только в памяти React. После перезагрузки или очистки они сбрасываются.

### Моковые данные

Основная моковая доменная модель находится в `lib/mock-data.ts`.

Типы:

- `AppTab`
- `AppScreen`
- `Product`
- `RoutineStep`

Данные:

- `profileSummary` - имя, тип кожи, цели, бюджет.
- `retailers` - магазины и логотипы.
- `products` - основной список продуктов.
- `alternatives` - альтернативные продукты для замены.
- `routineSteps` - шаги утренней и вечерней рутины.
- `cabinet` - средства пользователя и статусы.
- `priceOffers` - предложения магазинов.
- `skinDynamics` - фото и метрики по неделям.
- `inciAnalysis` - результат mock INCI-разбора.

Хелперы:

- `getProduct(id)` - ищет продукт в `products` и `alternatives`, fallback на первый продукт.
- `getRetailer(id)` - ищет ритейлера, fallback на первого ритейлера.

### Отсутствующие слои

Сейчас нет:

- backend/API-клиента;
- server actions;
- React Query/SWR или другого слоя данных;
- авторизации;
- Telegram Mini App SDK;
- сохранения анкеты;
- сохранения результата рутины;
- реального генератора рекомендаций;
- реального поиска/скана/загрузки фото;
- аналитики событий.

## 6. UI-система и визуальный подход

### Базовые компоненты

В `components/UI.tsx` лежит набор shared UI-компонентов:

- `Button` - варианты `primary`, `secondary`, `ghost`, disabled state.
- `GlassCard` - базовая glassmorphism-карточка с border, blur, inner highlight.
- `BlurCTAFooter` - нижняя fixed CTA-зона с blur/gradient и safe-area padding.
- `IconButton` - круглая кнопка назад или кнопка с кастомной иконкой.
- `OptionCard` - карточка выбора для анкеты.
- `Chip` - компактный selectable chip.
- `RetailerChip` - chip магазина с логотипом.
- `Toggle` - визуальный toggle, сейчас не является центральным элементом активных экранов.
- `ScreenHeader` - header-компонент, выглядит как legacy/shared, в основной новой внутренней части почти не используется.
- `BottomNav` - нижняя навигация по tabs.

В `InternalApp.tsx` также есть локальные UI-компоненты, которые пока не вынесены в shared:

- `TopBar`
- `NotificationBell`
- `SegmentedControl`
- `FilterChipRow`
- `ProductCard`
- `RoutineStepCard`
- `ProductPackshot`
- `DetailScaffold`
- `InfoBlock`
- `MockLineChart`

### Стили и темы

Тема построена через CSS variables в `app/globals.css`.

Light variables находятся в `:root`, dark variables - в `.dark`. Tailwind aliases задаются через `@theme`, например:

- `--color-kts-bg: var(--bg)`
- `--color-kts-accent: var(--accent)`
- `--color-kts-text: var(--text)`
- `--font-ui: var(--font-inter)`
- `--font-editorial: var(--font-playfair)`

Визуальный стиль:

- glassmorphism;
- темная тема по умолчанию;
- теплые beauty-оттенки;
- editorial headings через Playfair Display;
- округлые карточки и pill-controls;
- blur footer поверх scrollable content;
- брендовый background portrait на верхнем flow.

### Layout

Глобальный контейнер в `app/layout.tsx`:

- `max-w-[430px]`;
- `h-[100dvh]`;
- `overflow-y-auto overflow-x-hidden`;
- `paddingTop: env(safe-area-inset-top)`;
- `paddingBottom: env(safe-area-inset-bottom)`;
- `suppressHydrationWarning` на `<html>`, потому что тема меняется на клиенте.

Внутренние экраны используют нижний padding около `130px`, чтобы контент не попадал под `BottomNav`.

### Анимации

Используются:

- `motion.div` и `AnimatePresence` для переходов экранов.
- Drag gesture на welcome slider.
- Таймер прогресса в onboarding carousel.
- Таймер статусов в generating screen.
- CSS-анимации `spin` и `pulse` для визуализации генерации.

## 7. Текущие ограничения и риски

### Архитектура навигации

Навигация реализована строковыми состояниями и `switch`-ветками. Это быстро для прототипа, но при росте приложения появятся риски:

- сложно типизировать переходы;
- нет URL deep links;
- нельзя обновить страницу на detail screen без потери контекста;
- сложно добавлять guards, analytics и persistence;
- легко получить невалидный `view` или `screen.name`.

### Дублирование экранов

`components/MainScreens.tsx` содержит старую/альтернативную реализацию внутренних экранов (`HomeView`, `RoutineView`, `ScanView`, `CatalogView`, `ProfileView`). Судя по текущему `app/page.tsx`, активная внутренняя реализация идет через `InternalApp.tsx`, а `MainScreens.tsx` не используется.

Риск: будущий разработчик может начать дорабатывать неактуальный файл.

### Данные и бизнес-логика

Анкета собирает ответы, но эти ответы не используются для реальной генерации рутины. `GeneratingScreen` только имитирует работу таймерами, а `RoutineResultScreen` показывает статический summary.

Текущая рутина берется из `routineSteps`, а не из `answers`.

### Persistence

Нет постоянного хранения:

- ответов анкеты;
- статуса `hasRoutine`;
- результата рутины;
- выбранной замены продукта;
- пользовательских фильтров;
- прогресса onboarding.

После перезагрузки приложения пользователь возвращается к начальному состоянию, кроме темы.

### Интеграции

Нет boundary для будущего backend:

- нет service layer;
- нет API types;
- нет adapters для генерации рутины;
- нет обработчиков ошибок загрузки;
- нет loading/error states для сетевых операций.

Если backend добавлять прямо в компоненты, UI быстро смешается с бизнес-логикой.

### Тестирование

В проекте нет тестов. Скрипты есть только:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run clean`

Для текущего состояния особенно полезны e2e smoke-тесты, потому что большая часть логики - это пользовательские переходы.

### UX-риски

- `localStorage.clear()` очищает весь localStorage домена.
- Некоторые кликабельные элементы выглядят рабочими, но ничего не сохраняют и не открывают реальные действия.
- `BottomNav` всегда доступен во внутреннем приложении, но detail screens не отражаются в URL.
- Фильтр каталога меняет выбранный chip, но не влияет на список.

## 8. Рекомендации по доработке

### 1. Стабилизировать навигационную модель

Для ближайшей доработки лучше заменить произвольные строки на типизированную модель:

- `type AppView = "welcome" | "onboarding" | ...`
- `type InternalScreen = { name: "main" } | { name: "productDetail"; productId: string } | ...`
- централизованная карта переходов для верхнего flow;
- отдельные helper-и для переходов назад/вперед.

Если нужны deep links, следующий шаг - перенос части внутренних экранов на URL routes или синхронизация `screen` с query/hash.

### 2. Разделить доменную модель и UI

Сейчас тип `AppAnswers` лежит в `components/UI.tsx`, хотя это не UI-тип. Лучше вынести в доменную область, например:

```text
lib/domain/questionnaire.ts
lib/domain/routine.ts
```

Туда же стоит перенести:

- `defaultAnswers`;
- типы вопросника;
- типы результата рутины;
- функции маппинга анкеты в запрос генерации.

### 3. Добавить слой генерации рутины

Ввести сервисную функцию:

```ts
generateRoutine(answers: AppAnswers): Promise<RoutineResult>
```

На первом этапе она может возвращать mock-результат из локального файла, но UI уже будет работать через стабильный интерфейс. Потом mock можно заменить API-запросом без переписывания экранов.

Минимальная цель:

- `GeneratingScreen` получает не просто таймер, а ожидает завершения генерации.
- `RoutineResultScreen` показывает результат из `RoutineResult`.
- `InternalApp` использует сгенерированную рутину, а не глобальный `routineSteps`.

### 4. Добавить persistence

Короткий путь для прототипа:

- сохранять `answers` в `localStorage`;
- сохранять `hasRoutine`;
- сохранять generated routine result;
- очищать только ключи приложения, например `kts-theme`, `kts-answers`, `kts-routine`.

Более правильный production-путь:

- хранить draft анкеты и результат на backend;
- связывать с пользователем Telegram Mini App или другой авторизацией;
- иметь миграции версии схемы анкеты.

### 5. Развести shared UI и feature UI

Оставить в `components/UI.tsx` только универсальные элементы. Feature-компоненты лучше сгруппировать по областям:

```text
components/questionnaire
components/onboarding
components/internal-app
components/product
components/routine
```

Это снизит размер `InternalApp.tsx`, который сейчас содержит и роутинг, и экраны, и локальные UI-блоки.

### 6. Зафиксировать статус `MainScreens.tsx`

Нужно выбрать один из вариантов:

- удалить файл, если это legacy;
- переименовать в `MainScreens.legacy.tsx` и добавить комментарий;
- вернуть в активное использование, если он нужен как упрощенная версия.

Рекомендуемый вариант: удалить или явно пометить как legacy, потому что актуальная реализация находится в `InternalApp.tsx`.

### 7. Добавить минимальные проверки сценариев

Минимальный полезный набор e2e/smoke:

- welcome slider переводит в onboarding;
- onboarding можно пройти до `pre-q`;
- анкета блокирует `Далее` на обязательных шагах без выбора;
- после `q7` открывается генерация и затем результат;
- кнопка "Открыть приложение" ведет в tab `routine`;
- bottom nav переключает `routine`, `scan`, `catalog`, `profile`;
- карточка продукта открывает `productDetail`;
- из карточки продукта открывается `priceCompare`;
- тема переключается в профиле и сохраняется в `localStorage`.

## 9. Public API / Interfaces

Текущие интерфейсы, которые важно учитывать при доработке:

### `AppAnswers`

Находится в `components/UI.tsx`. Описывает состояние анкеты. Рекомендуется вынести из UI-модуля в доменный модуль.

### `AppTab`

Находится в `lib/mock-data.ts`.

```ts
export type AppTab = "routine" | "scan" | "catalog" | "profile";
```

Используется для нижней навигации внутреннего приложения.

### `AppScreen`

Находится в `lib/mock-data.ts`.

```ts
export type AppScreen =
  | "main"
  | "routineStep"
  | "replaceProduct"
  | "productDetail"
  | "priceCompare"
  | "inciResult"
  | "myProducts"
  | "skinDynamics";
```

Используется в `InternalApp` для detail screens.

### `Product`

Находится в `lib/mock-data.ts`. Описывает карточку товара:

- `id`
- `brand`
- `name`
- `category`
- `price`
- `oldPrice`
- `image`
- `retailerId`
- `retailer`
- `description`
- `actives`
- `reasons`
- `caution`
- `inci`

### `RoutineStep`

Находится в `lib/mock-data.ts`. Описывает шаг рутины:

- `id`
- `period`
- `label`
- `goal`
- `productId`
- `why`
- `how`

### Callback-интерфейсы экранов

Верхний flow в основном использует:

- `onNext`
- `onBack`
- `onSkip`
- `onFinish`

Внутреннее приложение использует:

- `onStartQuestionnaire`
- `onClear`
- `open(screen)`
- `back()`
- `onNavigate(tab)`

Эти callback-и сейчас являются основным способом связать экраны без URL-routing.

## 10. Предлагаемый порядок следующих работ

Оптимальный порядок доработки, чтобы не переписывать одно и то же несколько раз:

1. Зафиксировать актуальную архитектуру и удалить/пометить legacy-файлы.
2. Типизировать `view` и `screen` вместо свободных строк.
3. Вынести `AppAnswers` и доменные типы из UI-слоя.
4. Добавить persistence для анкеты и результата.
5. Ввести `generateRoutine(answers)` как service boundary.
6. Подключить результат генерации к `RoutineResultScreen` и `InternalApp`.
7. Добавить e2e smoke-тесты основных переходов.
8. После этого подключать реальные backend/API, Telegram SDK, upload фото и внешние магазины.

## 11. Test Plan

### Проверка отчета

- Все перечисленные экраны сверены с текущими компонентами проекта.
- Обработчики описаны по фактической реализации: `nav`, `open`, `back`, `navigateTab`, `setAnswers`, theme toggle, `handleClear`.
- Рекомендации отделены от текущего состояния.
- Отчет можно использовать как рабочий документ для планирования следующей доработки.

### Проверка приложения перед крупной доработкой

Запустить:

```bash
npm run lint
npm run build
```

Ручной smoke-проход:

```text
welcome -> onboarding -> pre-q -> q1 -> q2 -> q3 -> q4 -> q5 -> q6 -> q7 -> generating -> result -> routine
```

Проверить внутреннее приложение:

- tabs: `routine`, `scan`, `catalog`, `profile`;
- routine step detail;
- product detail;
- price compare;
- replace product;
- INCI result;
- my products;
- skin dynamics;
- profile theme switch;
- clear data.

## 12. Краткий вывод

Фронтенд уже хорошо подходит как визуальный прототип и демонстрация будущего продукта: есть цельный mobile-shell, сильный visual direction, продуманный onboarding, анкета и богатые mock-экраны внутреннего приложения.

Главная техническая задача перед ростом продукта - отделить прототипную навигацию и mock-данные от будущей доменной логики. Самый безопасный путь: сначала типизировать состояния, вынести доменные модели, добавить persistence и сервис генерации рутины. После этого можно подключать backend, реальные рекомендации, сканирование и Telegram-интеграцию без большого переписывания UI.
