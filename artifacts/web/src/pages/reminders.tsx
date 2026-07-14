import { useState } from 'react';
import { useListReminders, useCreateReminder, useUpdateReminder, useDeleteReminder, getListRemindersQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Input, Textarea } from '../components/ui';
import { Bell, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';

export default function Reminders() {
  const { data: reminders, isLoading } = useListReminders();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState('');

  const resetForm = () => {
    setTitle(''); setDescription(''); setRemindAt(''); setIsCreating(false);
  };

  const handleCreate = () => {
    if (!title || !remindAt) return;
    createReminder.mutate({
      data: {
        title,
        description: description || undefined,
        remindAt: new Date(remindAt).toISOString(),
        isDone: false
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
        resetForm();
      }
    });
  };

  const toggleDone = (reminder: any) => {
    updateReminder.mutate({
      id: reminder.id,
      data: { isDone: !reminder.isDone }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() })
    });
  };

  const handleDelete = (id: number) => {
    deleteReminder.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() })
    });
  };

  const upcoming = reminders?.filter(r => !r.isDone).sort((a,b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
  const completed = reminders?.filter(r => r.isDone).sort((a,b) => new Date(b.remindAt).getTime() - new Date(a.remindAt).getTime());

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-1 md:mb-2">Reminders</h1>
          <p className="text-muted-foreground text-base md:text-lg">Don't let the little things slip by.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2 rounded-full px-6 h-12 md:h-10 w-full md:w-auto text-base md:text-sm">
          <Plus className="w-5 h-5 md:w-4 md:h-4" /> New Reminder
        </Button>
      </header>

      {isCreating && (
        <Card className="border-secondary shadow-md">
          <CardContent className="p-4 md:p-6">
            <h3 className="font-bold text-lg mb-4">Add Reminder</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">What to remember?</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Register for electives" autoFocus className="h-11 md:h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">When?</label>
                <Input type="datetime-local" value={remindAt} onChange={e => setRemindAt(e.target.value)} className="h-11 md:h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Details (Optional)</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Any extra notes..." className="min-h-[100px]" />
              </div>
            </div>
            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={resetForm} className="h-11 md:h-10">Cancel</Button>
              <Button onClick={handleCreate} disabled={!title || !remindAt || createReminder.isPending} className="h-11 md:h-10">Save</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-display font-bold border-b border-border pb-2 flex items-center gap-2">
          <Bell className="w-5 h-5 text-secondary" /> Upcoming
        </h3>
        <div className="space-y-3">
          {isLoading ? (
            <div className="h-24 md:h-20 bg-muted rounded-xl animate-pulse" />
          ) : upcoming?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming reminders.</p>
          ) : (
            upcoming?.map(rem => {
              const overdue = isPast(parseISO(rem.remindAt));
              return (
                <div key={rem.id} className={`group flex gap-3 md:gap-4 p-4 md:p-5 rounded-2xl border transition-all bg-card hover:shadow-sm ${overdue ? 'border-destructive/30 bg-destructive/5' : 'border-card-border hover:border-secondary/50'}`}>
                  <button onClick={() => toggleDone(rem)} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 p-1">
                    <Circle className="w-6 h-6 md:w-6 md:h-6" />
                  </button>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-bold text-base md:text-lg mb-1 leading-tight">{rem.title}</h4>
                    {rem.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{rem.description}</p>}
                    <span className={`text-xs font-bold uppercase tracking-wider ${overdue ? 'text-destructive' : 'text-secondary-foreground/70'}`}>
                      {overdue ? 'Overdue • ' : ''}{format(parseISO(rem.remindAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(rem.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-2 self-start transition-opacity h-10 w-10 md:h-8 md:w-8 flex items-center justify-center rounded-lg">
                    <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {completed && completed.length > 0 && (
          <div className="mt-8 md:mt-12 space-y-3 opacity-60">
            <h3 className="text-lg font-display font-bold border-b border-border pb-2">Completed</h3>
            {completed.map(rem => (
              <div key={rem.id} className="flex gap-3 md:gap-4 p-4 rounded-xl border border-transparent bg-muted/20">
                <button onClick={() => toggleDone(rem)} className="mt-0.5 text-primary flex-shrink-0 p-1">
                  <CheckCircle2 className="w-6 h-6 md:w-5 md:h-5" />
                </button>
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="font-semibold text-base line-through text-muted-foreground">{rem.title}</h4>
                </div>
                <button onClick={() => handleDelete(rem.id)} className="text-muted-foreground hover:text-destructive p-2 h-10 w-10 md:h-8 md:w-8 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
