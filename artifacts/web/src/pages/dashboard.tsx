import { useGetDashboardSummary, useListCourses } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui';
import { Calendar, CheckCircle2, AlertTriangle, GraduationCap, Bell, ArrowRight, BookOpen, CheckSquare } from 'lucide-react';
import { Link } from 'wouter';
import { format, parseISO } from 'date-fns';

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: courses } = useListCourses();

  const getCourse = (id?: number | null) => courses?.find(c => c.id === id);

  if (loadingSummary || !summary) {
    return <div className="animate-pulse space-y-6">
      <div className="h-12 bg-muted rounded-xl w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-40 bg-muted rounded-2xl"></div>
        <div className="h-40 bg-muted rounded-2xl"></div>
        <div className="h-40 bg-muted rounded-2xl"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Good morning.</h1>
          <p className="text-muted-foreground text-lg">Here's your academic command center for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pomodoro" className="block">
            <Button className="gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6">
              <CheckCircle2 className="w-4 h-4" /> Start Focus Session
            </Button>
          </Link>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground border-primary shadow-lg hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary-foreground/10 rounded-xl">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Current CGPA</Badge>
            </div>
            <div>
              <p className="text-5xl font-display font-bold">{summary.cgpa > 0 ? summary.cgpa.toFixed(2) : '--'}</p>
              <p className="text-primary-foreground/70 font-medium mt-1">Keep pushing forward.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-accent rounded-xl text-accent-foreground">
                <Calendar className="w-6 h-6" />
              </div>
              <Badge variant="outline">Today's Classes</Badge>
            </div>
            <div>
              <p className="text-4xl font-display font-bold">{summary.todayTimetable.length}</p>
              <p className="text-muted-foreground font-medium mt-1">Scheduled for today</p>
            </div>
          </CardContent>
        </Card>

        <Card className={summary.attendanceAtRisk.length > 0 ? "border-destructive/50 bg-destructive/5 hover:-translate-y-1 transition-transform" : "hover:-translate-y-1 transition-transform"}>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className={summary.attendanceAtRisk.length > 0 ? "p-3 bg-destructive/10 rounded-xl text-destructive" : "p-3 bg-muted rounded-xl text-muted-foreground"}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              {summary.attendanceAtRisk.length > 0 && <Badge variant="destructive">Risk</Badge>}
            </div>
            <div>
              <p className="text-4xl font-display font-bold">{summary.attendanceAtRisk.length}</p>
              <p className="text-muted-foreground font-medium mt-1">Courses at attendance risk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" /> Today's Schedule
            </h2>
            <Link href="/timetable" className="text-sm font-semibold text-primary hover:underline">View All</Link>
          </div>
          
          <div className="space-y-3">
            {summary.todayTimetable.length === 0 ? (
              <Card className="border-dashed bg-transparent shadow-none">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No classes today. Time to catch up on assignments!
                </CardContent>
              </Card>
            ) : (
              summary.todayTimetable.map(slot => {
                const course = getCourse(slot.courseId);
                return (
                  <Card key={slot.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center min-w-20 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-bold tracking-tight">
                        <span>{slot.startTime}</span>
                        <span className="text-xs opacity-70 border-t border-current/20 mt-1 pt-1 w-full text-center">{slot.endTime}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg leading-tight">{course?.name || 'Unknown Course'}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          {slot.location && <span className="bg-muted px-2 py-0.5 rounded text-xs">{slot.location}</span>}
                          {course?.code && <span>{course.code}</span>}
                        </p>
                      </div>
                      {course?.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }}></div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-secondary" /> Action Items
            </h2>
            <Link href="/tasks" className="text-sm font-semibold text-primary hover:underline">View All</Link>
          </div>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {summary.upcomingTasks.length === 0 && summary.upcomingReminders.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  You're all caught up! Enjoy your free time.
                </div>
              )}
              
              {summary.upcomingTasks.slice(0, 3).map(task => {
                const course = getCourse(task.courseId);
                return (
                  <div key={`task-${task.id}`} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                    <div className="mt-1 w-5 h-5 rounded border-2 border-primary/30 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold">{task.title}</h4>
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'} className="text-[10px]">
                          {format(parseISO(task.dueDate), 'MMM d')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">{task.type}</Badge>
                        {course && (
                          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: course.color }}></span>
                            {course.code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {summary.upcomingReminders.slice(0, 2).map(rem => (
                <div key={`rem-${rem.id}`} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors bg-accent/10">
                  <Bell className="w-5 h-5 text-accent-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-accent-foreground">{rem.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{format(parseISO(rem.remindAt), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Attendance Warnings */}
      {summary.attendanceAtRisk.length > 0 && (
        <div className="mt-8 animate-in slide-in-from-bottom-4 delay-300">
          <Card className="border-destructive shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-destructive flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Attendance Warning
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {summary.attendanceAtRisk.map(risk => (
                  <div key={risk.courseId} className="bg-destructive/5 rounded-xl p-4 flex flex-col justify-between">
                    <span className="font-semibold text-sm mb-2 line-clamp-1">{risk.courseName}</span>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-display font-bold text-destructive">{risk.percentage.toFixed(0)}%</span>
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Present</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
