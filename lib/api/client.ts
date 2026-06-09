import type {
  ApiAction,
  ApiAuthResponse,
  ApiCareTimelineItem,
  ApiCareEvent,
  ApiConsentItem,
  ApiConsents,
  ApiConsentUpdate,
  ApiDataExport,
  ApiDeleteAccountReceipt,
  ApiEventSummary,
  ApiIntegrationsStatus,
  ApiNotificationSettings,
  ApiNotificationSettingsUpdate,
  ApiPermissions,
  ApiPermissionsUpdate,
  ApiPriceOffer,
  ApiPriceSnapshot,
  ApiPriceSummary,
  ApiProductCheckResponse,
  ApiRoutinePlan,
  ApiRoutineProgress,
  ApiRoutineSession,
  ApiRoutineStep,
  ApiRoutineStepCreate,
  ApiRoutineStepUpdate,
  ApiUserProduct,
  ApiUserProductCreate,
  ApiUserProductDetail,
  ApiUserProductSummary,
  ApiUserProductUpdate,
  ApiUploadedPhotoAccess,
  AssistantBlock,
  AssistantStreamResult,
} from "@/lib/api/contracts";
import type { AppAnswers } from "@/lib/domain/questionnaire";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

type ApiOptions = RequestInit & {
  devUser?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.devUser ?? process.env.NODE_ENV !== "production") {
    headers.set("X-Dev-User", "demo");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function assistantStreamUrl() {
  return `${API_BASE_URL}/assistant/stream`;
}

export async function streamAssistantMessage(input: {
  message: string;
  surface?: string;
  threadId?: string | null;
  context?: Record<string, unknown>;
}): Promise<AssistantStreamResult> {
  const headers = new Headers();
  headers.set("Accept", "text/event-stream");
  headers.set("Content-Type", "application/json");
  if (process.env.NODE_ENV !== "production") {
    headers.set("X-Dev-User", "demo");
  }

  const response = await fetch(assistantStreamUrl(), {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      message: input.message,
      surface: input.surface || "care",
      thread_id: input.threadId || null,
      context: input.context || {},
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const raw = await response.text();
  const result: AssistantStreamResult = { threadId: null, messageId: null, blocks: [] };
  for (const event of raw.split("\n\n")) {
    const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
    if (!dataLine) continue;
    const data = JSON.parse(dataLine.slice(6));
    if (event.startsWith("event: thread")) {
      result.threadId = data.thread_id;
    } else if (event.startsWith("event: block")) {
      result.blocks.push(data as AssistantBlock);
    } else if (event.startsWith("event: done")) {
      result.threadId = data.thread_id || result.threadId;
      result.messageId = data.message_id || null;
    }
  }
  return result;
}

export async function confirmAction(actionId: string) {
  return apiFetch(`/actions/${actionId}/confirm`, { method: "POST" });
}

export async function listActions(input: { status?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (input.status) params.set("status", input.status);
  if (input.limit) params.set("limit", String(input.limit));
  const query = params.toString();
  return apiFetch<ApiAction[]>(`/actions${query ? `?${query}` : ""}`);
}

export async function getActionSummary() {
  return apiFetch<{ total: number; by_status: Record<string, number>; by_type: Record<string, number> }>("/actions/summary");
}

export async function rejectAction(actionId: string, reason = "") {
  return apiFetch<ApiAction>(`/actions/${actionId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function undoAction(actionId: string) {
  return apiFetch<{ action: ApiAction; receipt: Record<string, unknown> }>(`/actions/${actionId}/undo`, { method: "POST" });
}

export async function generateRoutineFromQuestionnaire(answers: AppAnswers) {
  return apiFetch<ApiRoutinePlan>("/routines/generate", {
    method: "POST",
    body: JSON.stringify(answers),
  });
}

export async function createRoutineStep(input: ApiRoutineStepCreate) {
  return apiFetch<ApiRoutineStep>("/routines/steps", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRoutineStep(stepId: string, input: ApiRoutineStepUpdate) {
  return apiFetch<ApiRoutineStep>(`/routines/steps/${stepId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deactivateRoutineStep(stepId: string) {
  return apiFetch<ApiRoutineStep>(`/routines/steps/${stepId}`, { method: "DELETE" });
}

export async function listRoutineSessions(limit = 20) {
  return apiFetch<ApiRoutineSession[]>(`/routines/sessions?limit=${limit}`);
}

export async function getCurrentRoutineSession(period: string) {
  return apiFetch<ApiRoutineSession | null>(`/routines/sessions/current?period=${encodeURIComponent(period)}`);
}

export async function getOrStartRoutineSession(period: string) {
  return apiFetch<ApiRoutineSession>("/routines/sessions/current", {
    method: "POST",
    body: JSON.stringify({ period }),
  });
}

export async function getRoutineProgress(period: string) {
  return apiFetch<ApiRoutineProgress>(`/routines/progress?period=${encodeURIComponent(period)}`);
}

export async function completeRoutineStep(sessionId: string, stepId: string) {
  return apiFetch<ApiRoutineSession>(`/routines/sessions/${sessionId}/steps`, {
    method: "POST",
    body: JSON.stringify({ step_id: stepId }),
  });
}

export async function completeRoutineSession(sessionId: string) {
  return apiFetch<ApiRoutineSession>(`/routines/sessions/${sessionId}/complete`, { method: "POST" });
}

export async function checkProduct(input: { query: string; inci?: string | null }) {
  return apiFetch<ApiProductCheckResponse>("/products/check", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function previewCheckAddOwned(productId: string) {
  return apiFetch<ApiAction>(`/products/check/actions/add-owned/${productId}`, { method: "POST" });
}

export async function previewCheckPriceTracking(productId: string) {
  return apiFetch<ApiAction>(`/products/check/actions/track-price/${productId}`, { method: "POST" });
}

export async function previewCheckObservation(input: { product_id?: string | null; notes?: string }) {
  return apiFetch<ApiAction>("/products/check/actions/add-observation", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function addOwnedProduct(input: ApiUserProductCreate) {
  return apiFetch<ApiUserProduct>("/products/owned", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getOwnedProductsSummary() {
  return apiFetch<ApiUserProductSummary>("/products/owned/summary");
}

export async function getOwnedProductDetail(ownedId: string) {
  return apiFetch<ApiUserProductDetail>(`/products/owned/${ownedId}`);
}

export async function updateOwnedProduct(ownedId: string, input: ApiUserProductUpdate) {
  return apiFetch<ApiUserProduct>(`/products/owned/${ownedId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteOwnedProduct(ownedId: string) {
  return apiFetch<{ status: "deleted"; id: string }>(`/products/owned/${ownedId}`, { method: "DELETE" });
}

export async function previewRecommendationAddOwned(productId: string) {
  return apiFetch<ApiAction>(`/recommendations/${productId}/actions/add-owned`, { method: "POST" });
}

export async function previewRecommendationPriceTracking(productId: string) {
  return apiFetch<ApiAction>(`/recommendations/${productId}/actions/track-price`, { method: "POST" });
}

export async function listProductPrices(productId: string) {
  return apiFetch<ApiPriceOffer[]>(`/prices/products/${productId}`);
}

export async function getProductPriceHistory(productId: string, limit = 100) {
  return apiFetch<ApiPriceSnapshot[]>(`/prices/products/${productId}/history?limit=${limit}`);
}

export async function getProductPriceSummary(productId: string) {
  return apiFetch<ApiPriceSummary>(`/prices/products/${productId}/summary`);
}

export async function listEvents(input: { status?: string; eventType?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (input.status) params.set("status", input.status);
  if (input.eventType) params.set("event_type", input.eventType);
  if (input.limit) params.set("limit", String(input.limit));
  const query = params.toString();
  return apiFetch<ApiCareEvent[]>(`/events${query ? `?${query}` : ""}`);
}

export async function getCareTimeline(limit = 20) {
  return apiFetch<ApiCareTimelineItem[]>(`/care/timeline?limit=${limit}`);
}

export async function getEventSummary() {
  return apiFetch<ApiEventSummary>("/events/summary");
}

export async function getIntegrationsStatus() {
  return apiFetch<ApiIntegrationsStatus>("/integrations/status");
}

export async function markEventRead(eventId: string) {
  return apiFetch<{ status: "read"; id: string }>(`/events/${eventId}/read`, { method: "PATCH" });
}

export async function dismissEvent(eventId: string) {
  return apiFetch<{ status: "dismissed"; id: string }>(`/events/${eventId}/dismiss`, { method: "PATCH" });
}

export async function markAllEventsRead() {
  return apiFetch<{ status: "read"; updated: number }>("/events/read-all", { method: "PATCH" });
}

export async function dismissAllEvents() {
  return apiFetch<{ status: "dismissed"; updated: number }>("/events/dismiss-all", { method: "PATCH" });
}

export async function getUploadedPhotoAccess(photoId: string) {
  return apiFetch<ApiUploadedPhotoAccess>(`/scans/uploads/${photoId}/access`);
}

export async function getProfilePermissions() {
  return apiFetch<ApiPermissions>("/profile/permissions");
}

export async function getProfileConsents() {
  return apiFetch<ApiConsents>("/profile/consents");
}

export async function updateProfileConsent(key: string, input: ApiConsentUpdate) {
  return apiFetch<ApiConsentItem>(`/profile/consents/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateProfilePermissions(input: ApiPermissionsUpdate) {
  return apiFetch<ApiPermissions>("/profile/permissions", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getNotificationSettings() {
  return apiFetch<ApiNotificationSettings>("/profile/notification-settings");
}

export async function updateNotificationSettings(input: ApiNotificationSettingsUpdate) {
  return apiFetch<ApiNotificationSettings>("/profile/notification-settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function exportUserData() {
  return apiFetch<ApiDataExport>("/profile/data/export");
}

export async function deleteAccountData() {
  return apiFetch<ApiDeleteAccountReceipt>("/profile/account", { method: "DELETE" });
}

export function getTelegramInitData(): string | null {
  if (typeof window === "undefined") return null;
  type TelegramWindow = Window & {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  };
  return (window as TelegramWindow).Telegram?.WebApp?.initData || null;
}

export function readyTelegramWebApp() {
  if (typeof window === "undefined") return;
  type TelegramWindow = Window & {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
      };
    };
  };
  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
}

export async function bootstrapSession(): Promise<ApiAuthResponse | null> {
  const initData = getTelegramInitData();
  if (initData) {
    return apiFetch<ApiAuthResponse>("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ init_data: initData }),
      devUser: false,
    });
  }
  if (process.env.NODE_ENV !== "production") {
    return apiFetch<ApiAuthResponse>("/auth/dev-login", { method: "POST", devUser: false });
  }
  try {
    return await apiFetch<ApiAuthResponse>("/me", { devUser: false });
  } catch {
    return null;
  }
}
