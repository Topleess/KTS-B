"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import type {
  ApiCareTimelineItem,
  ApiCareToday,
  ApiRecommendation,
  ApiRoutinePlan,
  ApiRoutineProgress,
  ApiSkinProfile,
} from "@/lib/api/contracts";

export function useApiProfile() {
  return useQuery({
    queryKey: ["api", "profile"],
    queryFn: () => apiFetch<ApiSkinProfile>("/profile"),
    retry: false,
  });
}

export function useApiRoutine() {
  return useQuery({
    queryKey: ["api", "routine", "active"],
    queryFn: () => apiFetch<ApiRoutinePlan>("/routines/active"),
    retry: false,
  });
}

export function useApiRoutineProgress(period: string) {
  return useQuery({
    queryKey: ["api", "routine", "progress", period],
    queryFn: () => apiFetch<ApiRoutineProgress>(`/routines/progress?period=${encodeURIComponent(period)}`),
    retry: false,
  });
}

export function useApiCareToday() {
  return useQuery({
    queryKey: ["api", "care", "today"],
    queryFn: () => apiFetch<ApiCareToday>("/care/today"),
    retry: false,
  });
}

export function useApiCareTimeline(limit = 20) {
  return useQuery({
    queryKey: ["api", "care", "timeline", limit],
    queryFn: () => apiFetch<ApiCareTimelineItem[]>(`/care/timeline?limit=${limit}`),
    retry: false,
  });
}

export function useApiRecommendations() {
  return useQuery({
    queryKey: ["api", "recommendations"],
    queryFn: () => apiFetch<ApiRecommendation[]>("/recommendations"),
    retry: false,
  });
}
