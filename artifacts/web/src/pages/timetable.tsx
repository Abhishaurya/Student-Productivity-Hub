import { useState } from 'react';
import { useListTimetableSlots, useCreateTimetableSlot, useDeleteTimetableSlot, getListTimetableSlotsQueryKey, useListCourses } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Input, Select, Badge } from '../components/ui';
import { Calendar as CalendarIcon, Plus, Trash2, MapPin, Clock } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timetable() {
  const { data: slots, isLoading } = useListTimetableSlots();
  const { data: courses } = useListCourses();
  const createSlot = useCreateTimetableSlot();
  const deleteSlot = useDeleteTimetableSlot();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // Monday default
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');

  const handleCreate = () => {
    if (!courseId) return;
    createSlot.mutate({
      data: {
        courseId: parseInt(courseId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        location: location || undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTimetableSlotsQueryKey() });
        setIsCreating(false);
        setLocation('');
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteSlot.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTimetableSlotsQueryKey() })
    });
  };

  const getCourse = (id: number) => courses?.find(c => c.id === id);

  // Group slots by day
  const slotsByDay = DAYS.map((day, index) => ({
    name: day,
    slots: slots?.filter(s => s.dayOfWeek === index).sort((a, b) => a.startTime.localeCompare(b.startTime)) || []
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Weekly Timetable</h1>
          <p className="text-muted-foreground text-lg">Your class schedule at a glance.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-2 rounded-full px-6">
          <Plus className="w-4 h-4" /> Add Class Slot
        </Button>
      </header>

      {isCreating && (
        <Card className="border-primary/50 shadow-md">
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-xl mb-4">Add Class Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="space-y-1 lg:col-span-2">
                <label className="text-sm font-semibold text-muted-foreground">Course *</label>
                <Select value={courseId} onChange={e => setCourseId(e.target.value)}>
                  <option value="">Select a course...</option>
                  {courses?.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Day</label>
                <Select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Time (Start/End)</label>
                <div className="flex gap-2">
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-sm font-semibold text-muted-foreground">Room / Location</label>
                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room 101" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!courseId || createSlot.isPending}>
                Save Slot
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Only show Monday-Friday unless weekends have slots */}
        {slotsByDay.filter((day, i) => i >= 1 && i <= 5 || day.slots.length > 0).map(day => (
          <div key={day.name} className="flex flex-col h-full bg-muted/20 rounded-2xl p-4 border border-border/50">
            <h3 className="font-display font-bold text-center border-b border-border/50 pb-3 mb-4 uppercase tracking-wider text-sm">{day.name}</h3>
            <div className="space-y-3 flex-1">
              {day.slots.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground/40 font-medium text-sm">
                  Free Day
                </div>
              ) : (
                day.slots.map(slot => {
                  const course = getCourse(slot.courseId);
                  const color = course?.color || 'var(--muted)';
                  return (
                    <div key={slot.id} className="relative group p-4 rounded-xl border bg-card hover:shadow-md transition-all">
                      <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-xl" style={{ backgroundColor: color }} />
                      <button onClick={() => handleDelete(slot.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <h4 className="font-bold text-sm leading-tight mb-2 pr-6">{course?.name || 'Unknown'}</h4>
                      <div className="space-y-1 text-xs text-muted-foreground font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                        {slot.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 opacity-70" />
                            <span className="truncate">{slot.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
