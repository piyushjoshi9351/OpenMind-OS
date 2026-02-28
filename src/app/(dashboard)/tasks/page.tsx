"use client"

import { useState } from 'react';
import { MOCK_TASKS } from '@/lib/api-mock';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  Calendar, 
  Tag,
  ChevronRight,
  BarChart2
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function TasksPage() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Daily Tasks</h1>
          <p className="text-muted-foreground mt-1">Execute your roadmap one step at a time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <BarChart2 className="h-4 w-4" /> Analytics
          </Button>
          <Button className="gap-2 shadow-lg">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Quick Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {['all', 'pending', 'completed', 'overdue'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['AI', 'Coding', 'Research', 'Health', 'Deep Learning'].map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-muted-foreground/20">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-10 h-11 bg-white border-none shadow-sm" />
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox checked={task.completed} className="h-5 w-5 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-lg truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {task.deadline}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {Math.round(task.estimatedTime / 60)}h estimated
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {task.tags.join(', ')}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            <button className="w-full py-4 border-2 border-dashed border-muted rounded-xl text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-all">
              + Add a new task for today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}