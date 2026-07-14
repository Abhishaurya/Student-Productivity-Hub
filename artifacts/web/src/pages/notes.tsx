import { useState, useRef, useEffect } from 'react';
import { useListNotes, useCreateNote, useUpdateNote, useDeleteNote, useSummarizeNote, getListNotesQueryKey, useListCourses } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, Button, Input, Textarea, Badge, Select } from '../components/ui';
import { FileText, Plus, Trash2, Sparkles, BookOpen, ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../components/ui';

export default function Notes() {
  const { data: notes, isLoading } = useListNotes();
  const { data: courses } = useListCourses();
  const queryClient = useQueryClient();

  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const summarizeNote = useSummarizeNote();

  const handleCreate = () => {
    createNote.mutate({
      data: {
        title: 'Untitled Note',
        content: '',
        tags: []
      }
    }, {
      onSuccess: (newNote) => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
        setActiveNoteId(newNote.id);
      }
    });
  };

  const activeNote = notes?.find(n => n.id === activeNoteId);

  // Auto-save logic
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleUpdate = (id: number, field: string, value: any) => {
    // Optimistic update locally
    queryClient.setQueryData(getListNotesQueryKey(), (old: any) => {
      if (!old) return old;
      return old.map((n: any) => n.id === id ? { ...n, [field]: value } : n);
    });

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateNote.mutate({ id, data: { [field]: value } }, {
        // Silently succeed, only invalidate if we need fresh summary
      });
    }, 1000);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this note?')) {
      deleteNote.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
          if (activeNoteId === id) setActiveNoteId(null);
        }
      });
    }
  };

  const handleSummarize = () => {
    if (!activeNoteId) return;
    summarizeNote.mutate({ id: activeNoteId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() })
    });
  };

  const getCourse = (id?: number | null) => courses?.find(c => c.id === id);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4 md:mb-6 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-1 md:mb-2">Smart Notes</h1>
          <p className="text-muted-foreground text-base md:text-lg">Jot down concepts. Let AI summarize them.</p>
        </div>
        <Button onClick={handleCreate} disabled={createNote.isPending} className="gap-2 rounded-full px-6 h-12 md:h-10 w-full md:w-auto text-base md:text-sm">
          <Plus className="w-5 h-5 md:w-4 md:h-4" /> New Note
        </Button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0 relative">
        {/* Sidebar List */}
        <div className={cn(
          "w-full md:w-1/3 flex-col gap-3 overflow-y-auto md:pr-2 pb-8",
          activeNote ? "hidden md:flex" : "flex"
        )}>
          {isLoading && <div className="animate-pulse space-y-3"><div className="h-24 bg-muted rounded-xl"/><div className="h-24 bg-muted rounded-xl"/></div>}
          
          {notes?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No notes yet.</p>
            </div>
          ) : (
            notes?.map(note => {
              const course = getCourse(note.courseId);
              return (
                <button
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${activeNoteId === note.id ? 'bg-primary text-primary-foreground shadow-md border-primary' : 'bg-card text-card-foreground border-border hover:border-primary/50 hover:bg-muted/50'}`}
                >
                  <h4 className="font-bold mb-1 truncate text-base md:text-sm">{note.title || 'Untitled Note'}</h4>
                  <p className={`text-sm md:text-xs line-clamp-2 mb-3 md:mb-2 ${activeNoteId === note.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {note.content || 'Empty note...'}
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className={activeNoteId === note.id ? 'text-primary-foreground/90' : 'text-muted-foreground'}>
                      {format(parseISO(note.updatedAt), 'MMM d')}
                    </span>
                    {course && (
                      <span className="flex items-center gap-1" style={{ color: activeNoteId === note.id ? 'inherit' : course.color }}>
                        <BookOpen className="w-3 h-3" /> <span className="truncate max-w-[100px]">{course.code}</span>
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Editor Area */}
        <div className={cn(
          "flex-1 flex-col bg-card md:border border-border md:rounded-2xl md:shadow-sm overflow-hidden absolute md:relative inset-0 md:inset-auto z-10 md:z-auto transition-all",
          activeNote ? "flex" : "hidden md:flex"
        )}>
          {activeNote ? (
            <>
              {/* Editor Header */}
              <div className="p-2 md:p-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0 gap-2">
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 -ml-1 text-muted-foreground" onClick={() => setActiveNoteId(null)}>
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Select 
                    className="h-10 md:h-8 w-[140px] md:w-40 text-xs bg-background border-transparent" 
                    value={activeNote.courseId || ''} 
                    onChange={e => handleUpdate(activeNote.id, 'courseId', e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Link to course...</option>
                    {courses?.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleSummarize} disabled={summarizeNote.isPending || !activeNote.content.trim()} className="gap-2 h-10 md:h-8 text-xs px-3 md:px-4">
                    <Sparkles className="w-4 h-4 md:w-3 md:h-3" /> <span className="hidden md:inline">{summarizeNote.isPending ? 'Summarizing...' : 'Summarize'}</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(activeNote.id)}>
                    <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 overflow-y-auto flex flex-col">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={e => handleUpdate(activeNote.id, 'title', e.target.value)}
                  placeholder="Note Title"
                  className="w-full bg-transparent px-6 md:px-8 pt-6 md:pt-8 pb-4 text-2xl md:text-3xl font-display font-bold outline-none placeholder:text-muted-foreground/30 shrink-0"
                />
                
                {activeNote.summary && (
                  <div className="mx-6 md:mx-8 mb-6 p-4 bg-secondary/10 border border-secondary/20 rounded-xl shrink-0">
                    <div className="flex items-center gap-2 text-secondary-foreground font-bold text-sm mb-2 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> AI Summary
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{activeNote.summary}</p>
                  </div>
                )}

                <textarea
                  value={activeNote.content}
                  onChange={e => handleUpdate(activeNote.id, 'content', e.target.value)}
                  placeholder="Start typing your notes here..."
                  className="w-full flex-1 bg-transparent px-6 md:px-8 pb-8 text-base outline-none resize-none placeholder:text-muted-foreground/30 leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center hidden md:flex">
              <FileText className="w-16 h-16 opacity-10 mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">Select a note</h3>
              <p>Or create a new one to start writing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
