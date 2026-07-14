import { useState } from 'react';
import { useListTasks, useCreateTask, useUpdateTask, useDeleteTask, getListTasksQueryKey, useListCourses, useGenerateStudyPlan } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Input, Badge, Select, Textarea } from '../components/ui';
import { CheckSquare, Plus, Trash2, Clock, CheckCircle2, Sparkles, X, BrainCircuit } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();
  const { data: courses } = useListCourses();
  const generatePlan = useGenerateStudyPlan();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  const [type, setType] = useState<'assignment'|'exam'>('assignment');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');

  const resetForm = () => {
    setTitle(''); setDescription(''); setCourseId(''); setType('assignment'); setDueDate(''); setPriority('medium');
    setIsCreating(false);
  };

  const handleCreate = () => {
    if (!title || !dueDate) return;
    createTask.mutate({
      data: {
        title,
        description: description || undefined,
        courseId: courseId ? parseInt(courseId) : undefined,
        type,
        dueDate: new Date(dueDate).toISOString(),
        priority
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        resetForm();
      }
    });
  };

  const toggleStatus = (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTask.mutate({ id: task.id, data: { status: newStatus } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
    });
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
    });
  };

  const handleGeneratePlan = () => {
    generatePlan.mutate({}, {
      onSuccess: (data) => {
        setStudyPlan(data.plan);
      }
    });
  };

  const getCourseColor = (id?: number | null) => courses?.find(c => c.id === id)?.color || 'var(--muted)';
  const getCourseCode = (id?: number | null) => courses?.find(c => c.id === id)?.code;

  const filteredTasks = tasks?.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Tasks & Exams</h1>
          <p className="text-muted-foreground text-lg">Keep track of every deadline.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleGeneratePlan} disabled={generatePlan.isPending} className="gap-2">
            <Sparkles className="w-4 h-4" /> {generatePlan.isPending ? 'Generating...' : 'AI Study Plan'}
          </Button>
          <Button onClick={() => setIsCreating(true)} className="gap-2 rounded-full px-6">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        </div>
      </header>

      {studyPlan && (
        <Card className="border-secondary bg-secondary/5 relative overflow-hidden">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-secondary-foreground" onClick={() => setStudyPlan(null)}>
            <X className="w-4 h-4" />
          </Button>
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-xl flex items-center gap-2 mb-4 text-secondary-foreground">
              <BrainCircuit className="w-6 h-6" /> Your AI Strategy
            </h3>
            <div className="prose prose-sm prose-p:leading-relaxed max-w-none text-foreground/80" dangerouslySetInnerHTML={{ __html: studyPlan.replace(/\n/g, '<br/>') }} />
          </CardContent>
        </Card>
      )}

      {isCreating && (
        <Card className="border-primary/50 shadow-md">
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-xl mb-4">Add Task or Exam</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-muted-foreground">Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Read Chapters 4-5" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Type</label>
                <Select value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Due Date *</label>
                <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Course</label>
                <Select value={courseId} onChange={e => setCourseId(e.target.value)}>
                  <option value="">No Course (General)</option>
                  {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Priority</label>
                <Select value={priority} onChange={e => setPriority(e.target.value as any)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-muted-foreground">Description (Optional)</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details, links, or notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!title || !dueDate || createTask.isPending}>
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 border-b border-border pb-4">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-foreground text-background' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredTasks?.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-muted-foreground">No tasks found</h3>
            <p className="text-muted-foreground/70">You're all caught up for now.</p>
          </div>
        ) : (
          filteredTasks?.map(task => {
            const isDone = task.status === 'completed';
            const courseColor = getCourseColor(task.courseId);
            
            return (
              <div key={task.id} className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all ${isDone ? 'bg-muted/30 border-transparent opacity-60' : 'bg-card border-card-border hover:border-primary/30 hover:shadow-sm'}`}>
                <button 
                  onClick={() => toggleStatus(task)}
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground hover:border-primary'}`}
                >
                  {isDone && <CheckSquare className="w-3 h-3" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {task.courseId && (
                      <Badge variant="outline" className="text-[10px] border-none" style={{ backgroundColor: `${courseColor}20`, color: courseColor }}>
                        {getCourseCode(task.courseId)}
                      </Badge>
                    )}
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] opacity-80">
                      {task.priority} priority
                    </Badge>
                    {task.type === 'exam' && <Badge variant="default" className="text-[10px] bg-indigo-500">EXAM</Badge>}
                  </div>
                  <h4 className={`font-bold text-lg leading-tight mb-1 ${isDone ? 'line-through' : ''}`}>{task.title}</h4>
                  {task.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className={!isDone && new Date(task.dueDate) < new Date() ? "text-destructive" : ""}>
                      {format(parseISO(task.dueDate), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
