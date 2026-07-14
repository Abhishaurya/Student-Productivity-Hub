import { useState } from 'react';
import { useListAttendanceRecords, useGetAttendanceSummary, useCreateAttendanceRecord, useDeleteAttendanceRecord, getListAttendanceRecordsQueryKey, getGetAttendanceSummaryQueryKey, useListCourses } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Select, Input, Badge } from '../components/ui';
import { UserCheck, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Attendance() {
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const { data: records, isLoading: loadingRecords } = useListAttendanceRecords({ courseId: selectedCourseId });
  const { data: summary, isLoading: loadingSummary } = useGetAttendanceSummary();
  const { data: courses } = useListCourses();
  
  const createRecord = useCreateAttendanceRecord();
  const deleteRecord = useDeleteAttendanceRecord();
  const queryClient = useQueryClient();

  // Quick log state
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logCourseId, setLogCourseId] = useState('');

  const handleLog = (status: 'present' | 'absent' | 'excused') => {
    if (!logCourseId) return;
    createRecord.mutate({
      data: {
        courseId: parseInt(logCourseId),
        date: logDate,
        status
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAttendanceRecordsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAttendanceSummaryQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteRecord.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAttendanceRecordsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAttendanceSummaryQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Attendance</h1>
        <p className="text-muted-foreground text-lg">Track your presence and stay above the requirement.</p>
      </header>

      {/* Quick Log Action */}
      <Card className="border-primary/20 shadow-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <CardContent className="p-6">
          <h3 className="font-display font-bold text-xl mb-4">Quick Log</h3>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-sm font-semibold text-muted-foreground">Course</label>
              <Select value={logCourseId} onChange={e => setLogCourseId(e.target.value)}>
                <option value="">Select a course...</option>
                {courses?.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </Select>
            </div>
            <div className="w-full md:w-48 space-y-1">
              <label className="text-sm font-semibold text-muted-foreground">Date</label>
              <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 text-primary border-primary/30 hover:bg-primary/10 gap-2" onClick={() => handleLog('present')} disabled={!logCourseId || createRecord.isPending}>
                <CheckCircle2 className="w-4 h-4" /> Present
              </Button>
              <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 gap-2" onClick={() => handleLog('absent')} disabled={!logCourseId || createRecord.isPending}>
                <XCircle className="w-4 h-4" /> Absent
              </Button>
              <Button variant="outline" className="flex-1 text-amber-500 border-amber-500/30 hover:bg-amber-500/10 gap-2" onClick={() => handleLog('excused')} disabled={!logCourseId || createRecord.isPending}>
                <Clock className="w-4 h-4" /> Excused
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Summary Stats */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" /> Overall Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingSummary ? (
              <div className="col-span-full h-32 bg-muted rounded-xl animate-pulse" />
            ) : summary?.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                No attendance records logged yet.
              </div>
            ) : (
              summary?.map(s => {
                const course = courses?.find(c => c.id === s.courseId);
                const isRisk = s.percentage < 75;
                return (
                  <Card key={s.courseId} className={isRisk ? "border-destructive/30 bg-destructive/5" : ""}>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="font-bold pr-4">
                          <div className="text-xs text-muted-foreground font-mono mb-1" style={{ color: course?.color }}>{course?.code}</div>
                          <h4 className="leading-tight line-clamp-1">{s.courseName}</h4>
                        </div>
                        <div className={`text-2xl font-display font-bold ${isRisk ? 'text-destructive' : 'text-primary'}`}>
                          {s.percentage.toFixed(0)}%
                        </div>
                      </div>
                      
                      {/* Mini progress bar */}
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-3">
                        <div 
                          className={`h-full rounded-full ${isRisk ? 'bg-destructive' : 'bg-primary'}`} 
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span className="text-primary">{s.present} Present</span>
                        <span className="text-destructive">{s.absent} Absent</span>
                        <span className="text-amber-500">{s.excused} Excused</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Logs History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-secondary" /> History
            </h2>
            <Select 
              value={selectedCourseId || ''} 
              onChange={e => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="h-8 text-xs w-32 py-1 px-2"
            >
              <option value="">All Courses</option>
              {courses?.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </Select>
          </div>

          <Card>
            <CardContent className="p-0 divide-y divide-border h-[500px] overflow-y-auto">
              {loadingRecords ? (
                <div className="p-8 text-center text-muted-foreground">Loading history...</div>
              ) : records?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No records found.</div>
              ) : (
                records?.map(record => {
                  const course = courses?.find(c => c.id === record.courseId);
                  return (
                    <div key={record.id} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {record.status === 'present' && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Present</Badge>}
                          {record.status === 'absent' && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Absent</Badge>}
                          {record.status === 'excused' && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">Excused</Badge>}
                          <span className="text-xs font-bold text-muted-foreground">{format(parseISO(record.date), 'MMM d, yyyy')}</span>
                        </div>
                        <p className="font-semibold text-sm">{course?.name}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
