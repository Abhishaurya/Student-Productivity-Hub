import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListBlocklistItems,
  useCreateBlocklistItem,
  useDeleteBlocklistItem,
  useGetFocusShieldStats,
  getListBlocklistItemsQueryKey,
  getGetFocusShieldStatsQueryKey,
} from '@workspace/api-client-react';
import { Card, CardContent, Button, Input, Select } from '../components/ui';
import { ShieldCheck, Plus, Trash2, Flame, Trophy, Ban } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  social: 'Social Media',
  video: 'Video / Streaming',
  games: 'Games',
  messaging: 'Messaging',
  other: 'Other',
};

export default function FocusShield() {
  const { data: items, isLoading } = useListBlocklistItems();
  const { data: stats } = useGetFocusShieldStats();
  const queryClient = useQueryClient();
  const createItem = useCreateBlocklistItem();
  const deleteItem = useDeleteBlocklistItem();

  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<'social' | 'video' | 'games' | 'messaging' | 'other'>('social');

  const handleAdd = () => {
    if (!label.trim()) return;
    createItem.mutate(
      { data: { label: label.trim(), category } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBlocklistItemsQueryKey() });
          setLabel('');
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteItem.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBlocklistItemsQueryKey() });
        },
      },
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="mt-4 md:mt-0">
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-2 md:mb-4 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary" /> Focus Shield
        </h1>
        <p className="text-muted-foreground text-base md:text-xl">
          Name your distractions, then let Pomodoro nudge you back when you drift toward them.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-primary text-primary-foreground border-primary">
          <CardContent className="p-4 md:p-5">
            <Flame className="w-5 h-5 text-secondary mb-2" />
            <p className="text-2xl md:text-3xl font-display font-bold">{stats?.currentStreak ?? 0}</p>
            <p className="text-primary-foreground/70 text-xs md:text-sm font-semibold">Current streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-5">
            <Trophy className="w-5 h-5 text-secondary mb-2" />
            <p className="text-2xl md:text-3xl font-display font-bold">{stats?.longestStreak ?? 0}</p>
            <p className="text-muted-foreground text-xs md:text-sm font-semibold">Best streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-5">
            <ShieldCheck className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl md:text-3xl font-display font-bold">{stats?.distractionFreeSessions ?? 0}</p>
            <p className="text-muted-foreground text-xs md:text-sm font-semibold">Clean sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-5">
            <Ban className="w-5 h-5 text-destructive mb-2" />
            <p className="text-2xl md:text-3xl font-display font-bold">{stats?.totalDistractions ?? 0}</p>
            <p className="text-muted-foreground text-xs md:text-sm font-semibold">Total distractions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5 md:p-6 space-y-5">
          <h3 className="font-bold text-lg">Your blocklist</h3>
          <p className="text-sm text-muted-foreground -mt-3">
            Add the apps or sites that pull you away. During a focus session, Focus Shield tracks tab-switches so you can see how well you resisted them — a real OS-level block isn't possible from the browser, but the accountability is.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Instagram, YouTube, Discord"
              className="flex-1 h-11"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="h-11 sm:w-44">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Button onClick={handleAdd} disabled={!label.trim() || createItem.isPending} className="h-11 gap-2">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          <div className="space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!isLoading && items?.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No blocked distractions yet — add your first one above.</p>
            )}
            {items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-accent/30">
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{CATEGORY_LABELS[item.category]}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
