import { useState } from 'react';
import { useListGradeEntries, useGetCgpaSummary, useCreateGradeEntry, useDeleteGradeEntry, useGetGoal, useUpdateGoal, getListGradeEntriesQueryKey, getGetCgpaSummaryQueryKey, getGetGoalQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Input, Badge } from '../components/ui';
import { GraduationCap, Target, TrendingUp, Plus, Trash2 } from 'lucide-react';

export default function Grades() {
  const { data: grades, isLoading: loadingGrades } = useListGradeEntries();
  const { data: cgpaSummary, isLoading: loadingCgpa } = useGetCgpaSummary();
  const { data: goal } = useGetGoal();
  
  const createGrade = useCreateGradeEntry();
  const deleteGrade = useDeleteGradeEntry();
  const updateGoal = useUpdateGoal();
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [semesterName, setSemesterName] = useState('Fall 2024');
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('3');
  const [gradePoint, setGradePoint] = useState('10');

  // Goal Form State
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [targetCgpa, setTargetCgpa] = useState('9.0');

  const handleAddGrade = () => {
    if (!courseName || !semesterName) return;
    createGrade.mutate({
      data: {
        semesterName,
        courseName,
        credits: parseInt(credits),
        gradePoint: parseFloat(gradePoint)
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGradeEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCgpaSummaryQueryKey() });
        setCourseName('');
        // Keep semester to easily add multiple in same sem
      }
    });
  };

  const handleDeleteGrade = (id: number) => {
    deleteGrade.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGradeEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCgpaSummaryQueryKey() });
      }
    });
  };

  const handleSaveGoal = () => {
    updateGoal.mutate({
      data: { targetCgpa: parseFloat(targetCgpa) }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGoalQueryKey() });
        setIsEditingGoal(false);
      }
    });
  };

  // Group grades by semester
  const gradesBySem = grades?.reduce((acc, curr) => {
    if (!acc[curr.semesterName]) acc[curr.semesterName] = [];
    acc[curr.semesterName].push(curr);
    return acc;
  }, {} as Record<string, typeof grades>);

  const semStats = cgpaSummary?.semesters || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Grades & CGPA</h1>
          <p className="text-muted-foreground text-lg">Measure your academic performance.</p>
        </div>
      </header>

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary text-primary-foreground border-primary overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <GraduationCap className="w-64 h-64" />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col justify-center h-full">
            <Badge variant="secondary" className="w-fit mb-4 text-secondary-foreground">Current Standing</Badge>
            <div className="flex items-end gap-4">
              <span className="text-6xl font-display font-bold leading-none">{cgpaSummary?.cgpa > 0 ? cgpaSummary.cgpa.toFixed(2) : '--'}</span>
              <span className="text-xl font-bold text-primary-foreground/70 mb-1">CGPA</span>
            </div>
            <p className="mt-4 font-medium opacity-90">Total Credits Earned: {cgpaSummary?.totalCredits || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-secondary bg-secondary/5">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="outline" className="border-secondary text-secondary-foreground font-bold uppercase">Target Goal</Badge>
              {!isEditingGoal && (
                <Button variant="ghost" size="sm" onClick={() => { setTargetCgpa(goal?.targetCgpa?.toString() || '9.0'); setIsEditingGoal(true); }} className="h-8">Edit Goal</Button>
              )}
            </div>
            
            {isEditingGoal ? (
              <div className="flex items-center gap-3">
                <Input type="number" step="0.01" value={targetCgpa} onChange={e => setTargetCgpa(e.target.value)} className="text-2xl font-bold h-14 w-32 bg-background border-secondary" />
                <Button onClick={handleSaveGoal} disabled={updateGoal.isPending}>Save</Button>
                <Button variant="ghost" onClick={() => setIsEditingGoal(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-end gap-4">
                <span className="text-6xl font-display font-bold leading-none text-foreground">{goal?.targetCgpa ? goal.targetCgpa.toFixed(2) : 'N/A'}</span>
                <span className="text-xl font-bold text-muted-foreground mb-1">Target</span>
              </div>
            )}
            
            {goal?.targetCgpa && cgpaSummary?.cgpa > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-secondary-foreground">
                    {cgpaSummary.cgpa >= goal.targetCgpa ? 'Goal Reached!' : `${(goal.targetCgpa - cgpaSummary.cgpa).toFixed(2)} to go`}
                  </span>
                </div>
                <div className="h-3 w-full bg-secondary/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all" 
                    style={{ width: `${Math.min(100, (cgpaSummary.cgpa / goal.targetCgpa) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Semester Breakdown & Grade Entry */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" /> Grade History
            </h2>
            <Button variant="outline" onClick={() => setIsAdding(!isAdding)} className="gap-2 rounded-full">
              <Plus className="w-4 h-4" /> Add Grade Entry
            </Button>
          </div>

          {isAdding && (
            <Card className="border-primary shadow-md">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Add Course Grade</h3>
                <div className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                  <div className="space-y-1 w-full">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Semester</label>
                    <Input value={semesterName} onChange={e => setSemesterName(e.target.value)} placeholder="e.g. Fall 2024" />
                  </div>
                  <div className="space-y-1 w-full md:w-[40%]">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Course Name</label>
                    <Input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="e.g. CS101" />
                  </div>
                  <div className="space-y-1 w-24 flex-shrink-0">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Credits</label>
                    <Input type="number" value={credits} onChange={e => setCredits(e.target.value)} />
                  </div>
                  <div className="space-y-1 w-24 flex-shrink-0">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Grade</label>
                    <Input type="number" step="0.1" value={gradePoint} onChange={e => setGradePoint(e.target.value)} />
                  </div>
                  <Button onClick={handleAddGrade} disabled={!courseName || createGrade.isPending} className="w-full md:w-auto h-11 shrink-0">
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {!gradesBySem || Object.keys(gradesBySem).length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No grades entered yet. Add some to calculate your CGPA.</p>
              </div>
            ) : (
              Object.entries(gradesBySem).map(([sem, semGrades]) => {
                const stat = semStats.find(s => s.semesterName === sem);
                return (
                  <Card key={sem} className="overflow-hidden border-transparent shadow-sm">
                    <div className="bg-muted/40 p-4 border-b border-border flex justify-between items-center">
                      <h3 className="font-display font-bold text-lg">{sem}</h3>
                      <div className="flex gap-4 text-sm font-bold uppercase tracking-wider">
                        <span className="text-muted-foreground">Credits: <span className="text-foreground">{stat?.credits || 0}</span></span>
                        <span className="text-primary">GPA: <span className="text-foreground">{stat?.gpa.toFixed(2) || '0.00'}</span></span>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground bg-background">
                            <th className="px-6 py-3 font-semibold">Course</th>
                            <th className="px-6 py-3 font-semibold w-24 text-center">Credits</th>
                            <th className="px-6 py-3 font-semibold w-24 text-center">Grade</th>
                            <th className="px-6 py-3 font-semibold w-16 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {semGrades.map(g => (
                            <tr key={g.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-6 py-4 font-medium">{g.courseName}</td>
                              <td className="px-6 py-4 text-center text-muted-foreground">{g.credits}</td>
                              <td className="px-6 py-4 text-center font-bold text-primary">{g.gradePoint.toFixed(1)}</td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => handleDeleteGrade(g.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Sidebar Tips */}
        <div className="space-y-6">
          <Card className="bg-accent text-accent-foreground border-transparent">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-xl mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" /> Quick Tip
              </h3>
              <p className="text-sm leading-relaxed font-medium opacity-90">
                To reach your target CGPA of {goal?.targetCgpa || 9.0}, ensure that your semester GPA consistently stays above the target. Focus heavily on 4-credit courses as they impact your CGPA the most.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
