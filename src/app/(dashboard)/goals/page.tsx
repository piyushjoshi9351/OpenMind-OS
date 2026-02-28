"use client"

import { useState } from 'react';
import { MOCK_GOALS } from '@/lib/api-mock';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Calendar, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function GoalsPage() {
  const [goals, setGoals] = useState(MOCK_GOALS);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Goals & Objectives</h1>
          <p className="text-muted-foreground mt-1">Track your long-term vision and progress.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Create New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <Card key={goal.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <Badge variant={goal.priority === 'High' ? 'destructive' : 'outline'} className="mb-2">
                  {goal.priority} Priority
                </Badge>
                <CardTitle className="font-headline text-xl">{goal.title}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2">
                    <Edit2 className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {goal.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-muted-foreground">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {goal.deadline}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{goal.category}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <button className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-muted hover:border-primary/50 transition-colors group">
          <div className="bg-muted p-3 rounded-full group-hover:bg-primary/10 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <p className="mt-4 font-semibold text-muted-foreground group-hover:text-primary">Add New Goal</p>
        </button>
      </div>
    </div>
  );
}