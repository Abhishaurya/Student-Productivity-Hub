import { useState, useRef } from 'react';
import { useListCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, getListCoursesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Input, Badge } from '../components/ui';
import { BookOpen, Plus, Trash2, Edit2, Save, X, MoreVertical } from 'lucide-react';

const COLORS = [
  '#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#2196F3', '#6A4C93', 
  '#F15BB5', '#00BBF9', '#00F5D4', '#E07A5F', '#3D5A80', '#98C1D9'
];

export default function Courses() {
  const { data: courses, isLoading } = useListCourses();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [credits, setCredits] = useState('3');
  const [color, setColor] = useState(COLORS[0]);

  const resetForm = () => {
    setName(''); setCode(''); setInstructor(''); setCredits('3'); setColor(COLORS[0]);
    setIsCreating(false); setEditingId(null);
  };

  const startEdit = (c: any) => {
    setName(c.name); setCode(c.code || ''); setInstructor(c.instructor || '');
    setCredits(c.credits.toString()); setColor(c.color);
    setEditingId(c.id); setIsCreating(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    const payload = {
      name,
      code: code || undefined,
      instructor: instructor || undefined,
      credits: parseInt(credits) || 0,
      color
    };

    if (editingId) {
      updateCourse.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
          resetForm();
        }
      });
    } else {
      createCourse.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
          resetForm();
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this course?')) {
      deleteCourse.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Courses</h1>
          <p className="text-muted-foreground text-lg">Manage your curriculum and credit load.</p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)} className="gap-2 rounded-full px-6">
            <Plus className="w-4 h-4" /> Add Course
          </Button>
        )}
      </header>

      {(isCreating || editingId) && (
        <Card className="border-primary/50 shadow-md">
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-xl mb-4">
              {editingId ? 'Edit Course' : 'New Course'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Course Name *</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Intro to Computer Science" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Course Code</label>
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. CS101" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Instructor</label>
                <Input value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="e.g. Dr. Smith" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground">Credits</label>
                <Input type="number" value={credits} onChange={e => setCredits(e.target.value)} min="0" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-muted-foreground block mb-2">Course Color Tag</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={!name.trim() || createCourse.isPending || updateCourse.isPending}>
                <Save className="w-4 h-4 mr-2" /> Save Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.length === 0 && !isCreating && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-4">Add your first course to get started.</p>
              <Button onClick={() => setIsCreating(true)} variant="outline">Add Course</Button>
            </div>
          )}

          {courses?.map(course => (
            <Card key={course.id} className="relative group overflow-hidden border-transparent hover:border-border transition-all hover:shadow-md">
              <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: course.color }} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2 font-mono" style={{ borderColor: course.color, color: course.color }}>
                      {course.code || 'NO CODE'}
                    </Badge>
                    <h3 className="font-display font-bold text-xl leading-tight">{course.name}</h3>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button onClick={() => startEdit(course)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(course.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Instructor</span>
                    <span className="font-medium text-foreground">{course.instructor || 'TBD'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Credits</span>
                    <span className="font-medium text-foreground">{course.credits}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
