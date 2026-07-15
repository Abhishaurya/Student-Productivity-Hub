import { useState, useEffect, useRef } from 'react';
import { useCreatePomodoroSession, useGetPomodoroStats, getGetPomodoroStatsQueryKey, useListCourses, useListTasks, useListBlocklistItems, getGetFocusShieldStatsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Select } from '../components/ui';
import { Timer as TimerIcon, Play, Pause, Square, Flame, ShieldAlert } from 'lucide-react';

export default function Pomodoro() {
  const { data: stats } = useGetPomodoroStats();
  const { data: courses } = useListCourses();
  const { data: tasks } = useListTasks({ status: 'pending' });
  const { data: blocklist } = useListBlocklistItems();
  const createSession = useCreatePomodoroSession();
  const queryClient = useQueryClient();

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'short_break'>('focus');
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Focus Shield: count tab-switches/window-blurs while a focus session is running.
  const [distractionCount, setDistractionCount] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const isActiveRef = useRef(isActive);
  const modeRef = useRef(mode);
  isActiveRef.current = isActive;
  modeRef.current = mode;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActiveRef.current && modeRef.current === 'focus') {
        setDistractionCount((c) => c + 1);
        setShowNudge(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!showNudge) return;
    const timeout = setTimeout(() => setShowNudge(false), 6000);
    return () => clearTimeout(timeout);
  }, [showNudge]);

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
    if (mode === 'focus') {
      createSession.mutate({
        data: {
          durationMinutes: 25,
          courseId: selectedCourseId ? parseInt(selectedCourseId) : undefined,
          taskId: selectedTaskId ? parseInt(selectedTaskId) : undefined,
          distractionCount
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPomodoroStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFocusShieldStatsQueryKey() });
          setMode('short_break');
          setTimeLeft(5 * 60);
          setDistractionCount(0);
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
    setDistractionCount(0);
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
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header className="text-center mb-6 md:mb-12 mt-4 md:mt-0">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-2 md:mb-4 flex items-center justify-center gap-3">
          <TimerIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" /> Focus
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">Deep work sessions, block by block.</p>
      </header>

      {showNudge && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-destructive text-destructive-foreground rounded-2xl shadow-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">You drifted away from focus.</p>
            <p className="text-xs opacity-90 mt-1">Focus Shield noticed you switched tabs during your session. Come back and finish strong.</p>
          </div>
        </div>
      )}

      {isActive && mode === 'focus' && distractionCount > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-destructive bg-destructive/10 rounded-xl py-2">
          <ShieldAlert className="w-4 h-4" /> {distractionCount} distraction{distractionCount > 1 ? 's' : ''} this session
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Timer Section */}
        <Card className="md:col-span-2 border-primary/20 shadow-xl overflow-hidden relative">
          <div 
            className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
          <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[350px] md:min-h-[400px]">
            <div className="flex gap-2 md:gap-4 mb-8 bg-muted p-1 rounded-full w-full md:w-auto overflow-hidden">
              <button 
                onClick={() => switchMode('focus')}
                className={`flex-1 md:flex-none px-4 md:px-6 py-3 md:py-2 rounded-full font-bold text-sm transition-all ${mode === 'focus' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Pomodoro
              </button>
              <button 
                onClick={() => switchMode('short_break')}
                className={`flex-1 md:flex-none px-4 md:px-6 py-3 md:py-2 rounded-full font-bold text-sm transition-all ${mode === 'short_break' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Short Break
              </button>
            </div>

            <div className="text-[80px] md:text-[120px] font-display font-bold tracking-tighter leading-none mb-8 md:mb-10 text-foreground tabular-nums drop-shadow-sm">
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-4">
              <Button size="lg" className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center text-3xl shadow-lg hover:scale-105 active:scale-95 transition-all" onClick={toggleTimer}>
                {isActive ? <Pause className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" /> : <Play className="w-8 h-8 md:w-10 md:h-10 ml-2" fill="currentColor" />}
              </Button>
              <Button variant="outline" size="icon" className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] text-muted-foreground" onClick={resetTimer}>
                <Square className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings & Stats Section */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 md:p-6">
              <h3 className="font-bold text-lg mb-4">Session Context</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Link Course</label>
                  <Select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="h-11 md:h-10">
                    <option value="">None (General Focus)</option>
                    {courses?.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Link Task</label>
                  <Select value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)} className="h-11 md:h-10">
                    <option value="">None</option>
                    {tasks?.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-primary">
            <CardContent className="p-5 md:p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-secondary" /> Today's Focus
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl md:text-3xl font-display font-bold">{stats?.todaySessions || 0}</p>
                  <p className="text-primary-foreground/70 text-sm font-semibold">Sessions</p>
                </div>
                <div>
                  <p className="text-3xl md:text-3xl font-display font-bold">{stats?.todayMinutes || 0}</p>
                  <p className="text-primary-foreground/70 text-sm font-semibold">Minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {blocklist && blocklist.length > 0 && (
            <Card>
              <CardContent className="p-5 md:p-6">
                <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Focus Shield is watching for</h3>
                <div className="flex flex-wrap gap-2">
                  {blocklist.slice(0, 6).map((item) => (
                    <span key={item.id} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                      {item.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
