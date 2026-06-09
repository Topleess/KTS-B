export type ApiProduct = {
  id: string;
  external_key: string | null;
  brand: string;
  name: string;
  category: string;
  description: string;
  image_url: string | null;
  actives: string[];
  inci: string;
};

export type ApiRoutineStep = {
  id: string;
  period: string;
  sequence_order: number;
  step_type: string;
  purpose: string;
  rationale: string;
  instructions: string;
  schedule_rule: Record<string, unknown>;
  is_active: boolean;
  product: ApiProduct | null;
};

export type ApiRoutineStepCreate = {
  period: string;
  sequence_order?: number;
  step_type: string;
  purpose?: string;
  rationale?: string;
  instructions?: string;
  schedule_rule?: Record<string, unknown>;
  product_id?: string | null;
};

export type ApiRoutineStepUpdate = Partial<ApiRoutineStepCreate> & {
  is_active?: boolean;
};

export type ApiRoutinePlan = {
  id: string;
  version: number;
  is_active: boolean;
  created_at: string;
  steps: ApiRoutineStep[];
};

export type ApiRoutineSession = {
  id: string;
  routine_plan_id: string;
  period: string;
  status: string;
  completed_step_ids: string[];
  started_at: string;
  completed_at: string | null;
};

export type ApiRoutineProgress = {
  routine: ApiRoutinePlan;
  session: ApiRoutineSession | null;
  period: string;
  total_steps: number;
  completed_steps: number;
  completion_percent: number;
  next_step: ApiRoutineStep | null;
};

export type ApiSkinProfile = {
  id: string;
  skin_type: string;
  sensitivity_level: string;
  budget_limit: number | null;
  goals: string[];
  restrictions: Record<string, unknown>;
  preferred_retailers: string[];
  location_mode: string;
  manual_city: string | null;
};

export type ApiPermissions = {
  camera: string;
  geolocation: string;
  skin_photos: string;
  notifications: string;
};

export type ApiPermissionsUpdate = Partial<ApiPermissions>;

export type ApiConsentItem = {
  key: string;
  status: string;
  version: string;
  updated_at: string | null;
};

export type ApiConsents = {
  consents: ApiConsentItem[];
};

export type ApiConsentUpdate = {
  status: string;
  version?: string;
};

export type ApiNotificationSettings = {
  routine_reminders: boolean;
  uv_alerts: boolean;
  price_alerts: boolean;
  observation_followups: boolean;
};

export type ApiNotificationSettingsUpdate = Partial<ApiNotificationSettings>;

export type ApiAuthUser = {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  display_name: string | null;
};

export type ApiAuthResponse = {
  user: ApiAuthUser;
};

export type ApiDataExport = {
  exported_at: string;
  user: Record<string, unknown>;
  profile: Record<string, unknown> | null;
  routine_plans: Array<Record<string, unknown>>;
  routine_steps: Array<Record<string, unknown>>;
  routine_sessions: Array<Record<string, unknown>>;
  owned_products: Array<Record<string, unknown>>;
  observations: Array<Record<string, unknown>>;
  uploaded_photos: Array<Record<string, unknown>>;
  scan_candidates: Array<Record<string, unknown>>;
  price_alerts: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  assistant_threads: Array<Record<string, unknown>>;
  assistant_messages: Array<Record<string, unknown>>;
  pending_actions: Array<Record<string, unknown>>;
};

export type ApiDeleteAccountReceipt = {
  status: "deleted";
  deleted_files: number;
};

export type ApiIntegrationStatusItem = {
  name: string;
  status: string;
  mode: string;
  detail: string;
  required_for_production: boolean;
};

export type ApiIntegrationsStatus = {
  app_env: string;
  overall_status: string;
  integrations: ApiIntegrationStatusItem[];
};

export type ApiAction = {
  id: string;
  action_type: string;
  status: string;
  preview: Record<string, unknown>;
  payload: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
  confirmed_at: string | null;
};

export type ApiPriceOffer = {
  id: string;
  product_id: string;
  retailer_id: string;
  retailer_name: string;
  price: number;
  old_price: number | null;
  discount_label: string | null;
  stock_status: string;
  url: string | null;
  collected_at: string;
};

export type ApiPriceSnapshot = ApiPriceOffer;

export type ApiPriceSummary = {
  product_id: string;
  best_offer: ApiPriceOffer | null;
  average_price: number | null;
  min_price: number | null;
  max_price: number | null;
  offers_count: number;
  history_count: number;
  last_collected_at: string | null;
};

export type ApiPriceAlert = {
  id: string;
  product_id: string;
  threshold_price: number | null;
  retailers: string[];
  is_active: boolean;
  created_at: string;
  product: ApiProduct | null;
};

export type ApiRecommendation = {
  product: ApiProduct;
  score: number;
  reasons: string[];
  best_offer: ApiPriceOffer | null;
  next_action: string;
};

export type ApiProductCheckResponse = {
  verdict: string;
  summary: string;
  reasons: string[];
  cautions: string[];
  useful_ingredients: string[];
  neutral_ingredients: string[];
  caution_ingredients: string[];
  product: ApiProduct | null;
};

export type ApiUploadedPhotoAccess = {
  url: string;
  expires_in_seconds: number;
  access_type: "backend_stream" | "presigned_url" | string;
};

export type ApiObservation = {
  id: string;
  product_id: string | null;
  feeling: string;
  severity: number;
  notes: string;
  metrics: Record<string, unknown>;
  created_at: string;
};

export type ApiUserProduct = {
  id: string;
  status: string;
  note: string;
  amount_left_percent: number | null;
  product: ApiProduct;
};

export type ApiUserProductSummary = {
  total: number;
  by_status: Record<string, number>;
  low_amount_count: number;
  tracked_count: number;
  wishlist_count: number;
  active_count: number;
};

export type ApiUserProductDetail = {
  owned: ApiUserProduct;
  price_summary: ApiPriceSummary;
  active_price_alerts: ApiPriceAlert[];
  recent_observations: ApiObservation[];
  next_action: string;
};

export type ApiUserProductCreate = {
  product_id: string;
  status?: string;
  note?: string;
  amount_left_percent?: number | null;
};

export type ApiUserProductUpdate = {
  status?: string;
  note?: string;
  amount_left_percent?: number | null;
};

export type ApiCareToday = {
  date: string;
  greeting: string;
  active_period: string;
  environment: {
    city: string;
    temperature_c: number;
    uv_index: number;
    humidity_percent: number;
    spf_hint: string;
    source: string;
  };
  routine: ApiRoutinePlan;
  products_low: ApiUserProduct[];
  recent_observations: ApiObservation[];
  events: Array<Record<string, unknown>>;
};

export type ApiCareTimelineAction = {
  type: string;
  label: string;
  payload: Record<string, unknown>;
};

export type ApiCareTimelineItem = {
  id: string;
  item_type: string;
  title: string;
  body: string;
  priority: number;
  action: ApiCareTimelineAction | null;
  created_at: string | null;
};

export type ApiCareEvent = {
  id: string;
  event_type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  status: "unread" | "read" | "dismissed" | string;
  created_at: string;
};

export type ApiEventSummary = {
  total: number;
  unread: number;
  dismissed: number;
  by_type: Record<string, number>;
};

export type AssistantTextBlock = {
  type: "text";
  text: string;
  segments?: RichTextSegment[];
};

export type RichTextSegment =
  | { type: "text"; text: string }
  | {
      type: "inline_action";
      label: string;
      action:
        | "open_routine"
        | "open_product"
        | "open_price_comparison"
        | "start_price_tracking"
        | "open_observation_form"
        | "open_profile_setting";
      payload: Record<string, unknown>;
    };

export type AssistantActionBlock = {
  type: "action_card";
  action_id: string;
  card_type: string;
  payload: {
    title?: string;
    summary?: string;
    action_type: string;
    action_id: string;
    payload: Record<string, unknown>;
  };
};

export type AssistantBlock = AssistantTextBlock | AssistantActionBlock | Record<string, unknown>;

export type AssistantStreamResult = {
  threadId: string | null;
  messageId: string | null;
  blocks: AssistantBlock[];
};
