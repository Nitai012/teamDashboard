import {
  type AssessmentDto,
  type AssessmentInput,
  type MemberDto,
  type MemberInput,
  type MemberSkillInput,
  type MemberUpdateInput,
  type SettingsDto,
  type SkillDto,
} from '@team-radar/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api';
import { queryKeys } from './query-client';

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => {
      try {
        await api.session();
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return false;
        throw error;
      }
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export const useMembers = () =>
  useQuery({ queryKey: queryKeys.members, queryFn: api.members.list });
export const useSkills = () => useQuery({ queryKey: queryKeys.skills, queryFn: api.skills.list });
export const useAssessments = () =>
  useQuery({ queryKey: queryKeys.assessments, queryFn: api.assessments.list });
export const useSettings = () =>
  useQuery({ queryKey: queryKeys.settings, queryFn: api.settings.get });

export type TeamData =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | {
      status: 'ready';
      members: MemberDto[];
      skills: SkillDto[];
      assessments: AssessmentDto[];
      settings: SettingsDto;
    };

/** Everything a page needs about the team, loaded together. */
export function useTeamData(): TeamData {
  const members = useMembers();
  const skills = useSkills();
  const assessments = useAssessments();
  const settings = useSettings();

  if (members.data && skills.data && assessments.data && settings.data) {
    return {
      status: 'ready',
      members: members.data,
      skills: skills.data,
      assessments: assessments.data,
      settings: settings.data,
    };
  }
  if ([members, skills, assessments, settings].some((q) => q.isError)) {
    return {
      status: 'error',
      retry: () => {
        void members.refetch();
        void skills.refetch();
        void assessments.refetch();
        void settings.refetch();
      },
    };
  }
  return { status: 'loading' };
}

/* ---------- mutations ---------- */

function useInvalidate() {
  const client = useQueryClient();
  return (...keys: (keyof typeof queryKeys)[]) =>
    Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: queryKeys[key] })));
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: () => client.setQueryData(queryKeys.session, true),
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      client.clear();
      client.setQueryData(queryKeys.session, false);
    },
  });
}

export function useCreateMember() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: MemberInput) => api.members.create(input),
    onSuccess: () => invalidate('members'),
  });
}

export function useUpdateMember() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MemberUpdateInput }) =>
      api.members.update(id, input),
    onSuccess: () => invalidate('members'),
  });
}

export function useDeleteMember() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.members.remove(id),
    onSuccess: () => invalidate('members', 'assessments'),
  });
}

export function useDeleteExamples() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.members.removeExamples,
    onSuccess: () => invalidate('members', 'assessments'),
  });
}

export function useSetMemberSkill() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      skillId,
      input,
    }: {
      memberId: string;
      skillId: string;
      input: MemberSkillInput;
    }) => api.members.setSkill(memberId, skillId, input),
    onSuccess: (member) => {
      client.setQueryData<MemberDto[]>(queryKeys.members, (list) =>
        list?.map((m) => (m.id === member.id ? member : m)),
      );
    },
  });
}

export function useCreateSkill() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (name: string) => api.skills.create(name),
    onSuccess: () => invalidate('skills'),
  });
}

export function useRenameSkill() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.skills.rename(id, name),
    onSuccess: () => invalidate('skills', 'members'),
  });
}

export function useDeleteSkill() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.skills.remove(id),
    onSuccess: () => invalidate('skills', 'members'),
  });
}

export function useSaveAssessment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      memberId,
      date,
      input,
    }: {
      memberId: string;
      date: string;
      input: AssessmentInput;
    }) => api.assessments.save(memberId, date, input),
    onSuccess: () => invalidate('assessments'),
  });
}

export function useDeleteAssessment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.assessments.remove(id),
    onSuccess: () => invalidate('assessments'),
  });
}

export function useSaveAxes() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (axes: string[]) => api.settings.update(axes),
    onSuccess: (settings) => client.setQueryData(queryKeys.settings, settings),
  });
}

export function useImportBackup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: unknown) => api.backup.import(data),
    onSuccess: () => invalidate('members', 'skills', 'assessments', 'settings'),
  });
}
