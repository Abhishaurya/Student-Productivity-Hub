import { useState, useEffect } from 'react';
import { useCreatePomodoroSession, useGetPomodoroStats, getGetPomodoroStatsQueryKey, useListCourses, useListTasks } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Select } from '../components/ui';
import { Timer as TimerIcon, Play, Pause, Square, CheckCircle2, Flame } from 'lucide-react';

export default function Pomodoro() {
  const { data: stats } = useGetPomodoroStats();
  const { data: courses } = useListCourses();
  const { data: tasks } = useListTasks({ status: 'pending' });
  const createSession = useCreatePomodoroSession();
  const queryClient = useQueryClient();

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'short_break'>('focus');
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = () => {
    // Play sound (simulated by browser native, but we skip actual audio file for now)
    if (mode === 'focus') {
      createSession.mutate({
        data: {
          durationMinutes: 25,
          courseId: selectedCourseId ? parseInt(selectedCourseId) : undefined,
          taskId: selectedTaskId ? parseInt(selectedTaskId) : undefined
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPomodoroStatsQueryKey() });
          setMode('short_break');
          setTimeLeft(5 * 60);
        }
      });
    } else {
      setMode('focus');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'short_break') => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-display font-bold tracking-tight mb-4 flex items-center justify-center gap-3">
          <TimerIcon className="w-10 h-10 text-primary" /> Focus
        </h1>
        <p className="text-muted-foreground text-xl">Deep work sessions, block by block.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Timer Section */}
        <Card className="md:col-span-2 border-primary/20 shadow-xl overflow-hidden relative">
          <div 
            className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
          <CardContent className="p-10 flex flex-col items-center justify-center min-h-[400px]">
            <div className="flex gap-4 mb-8 bg-muted p-1 rounded-full">
              <button 
                onClick={() => switchMode('focus')}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${mode === 'focus' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Pomodoro
              </button>
              <button 
                onClick={() => switchMode('short_break')}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${mode === 'short_break' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Short Break
              </button>
            </div>

            <div className="text-[120px] font-display font-bold tracking-tighter leading-none mb-10 text-foreground tabular-nums drop-shadow-sm">
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-4">
              <Button size="lg" className="w-24 h-24 rounded-full rounded-2xl flex items-center justify-center text-3xl shadow-lg hover:scale-105" onClick={toggleTimer}>
                {isActive ? <Pause className="w-10 h-10" fill="currentColor" /> : <Play className="w-10 h-10 ml-2" fill="currentColor" />}
              </Button>
              <Button variant="outline" size="icon" className="w-16 h-16 rounded-2xl text-muted-foreground" onClick={resetTimer}>
                <Square className="w-6 h-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings & Stats Section */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Session Context</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Link Course</label>
                  <Select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                    <option value="">None (General Focus)</option>
                    {courses?.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Link Task</label>
                  <Select value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}>
                    <option value="">None</option>
                    {tasks?.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-primary">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-secondary" /> Today's Focus
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-display font-bold">{stats?.todaySessions || 0}</p>
                  <p className="text-primary-foreground/70 text-sm font-semibold">Sessions</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold">{stats?.todayMinutes || 0}</p>
                  <p className="text-primary-foreground/70 text-sm font-semibold">Minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
