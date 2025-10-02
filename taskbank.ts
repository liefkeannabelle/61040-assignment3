/**
 * TaskBank Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';
export const enum Relation {
    B = "must happen before",
    A = "must happen after",
    IB = "must happen immediately before",
    IA = "must happen immediately after"
}
export const reverseRelationMap = {
  [Relation.A]: Relation.B,
  [Relation.B]: Relation.A,
  [Relation.IA]: Relation.IB,
  [Relation.IB]: Relation.IA
};

// A single task
export interface Task {
    name : string;
    desc : string;
}

// A single dependency relation
export interface Dependency {
    task1 : Task;
    task2 : Task;
    depRel : Relation;
}

export class TaskBank {
    private tasks: Task[] = [];
    private dependencies: Dependency[] = [];

    getTasks() : Task[]{
        return this.tasks.slice();
    }

    getDependencies() : Dependency[]{
        return this.dependencies.slice();
    }

    addTask(name: string, desc: string): Task{
        const newTask: Task = {
            name,
            desc
        };
        this.tasks.push(newTask);
        return newTask;
    }

    deleteTask(delTask: Task): void {
        // Remove assignments for this activity
        this.dependencies = this.dependencies.filter(dependency => dependency.task1 !== delTask);
        this.dependencies = this.dependencies.filter(dependency => dependency.task2 !== delTask);
        
        // Remove the activity
        this.tasks = this.tasks.filter(task => task !== delTask);
    }

    addDependency(firstTask: Task, secondTask: Task, forwardRel: Relation): void{
        const forwardDep: Dependency = {
            task1: firstTask,
            task2: secondTask,
            depRel: forwardRel
        };

        const revRel = reverseRelationMap[forwardRel];
        
        const reverseDep: Dependency = {
            task1: secondTask,
            task2: firstTask,
            depRel: revRel
        };

        this.dependencies.push(forwardDep);
        this.dependencies.push(reverseDep);

    }

    // not sure how to mirror this
    // deleteDependency(dependency: Dependency) : void { 
    //     this.dependencies = this.dependencies.filter(dependency => )
    // }

    // unassignActivity(activity: Activity): void {
    //     this.assignments = this.assignments.filter(assignment => assignment.activity !== activity);
    // }

    async suggestDependencies(llm: GeminiLLM): Promise<void> {
        try {
            console.log('🤖 Requesting potential dependencies from Gemini AI...');
            
            // const unassignedActivities = this.activities.filter(a => !this.isAssigned(a));

            // if (unassignedActivities.length === 0) {
            //     console.log('✅ All activities are already assigned!');
            //     return;
            // }

            const existingTasks = this.tasks.slice();
            const existingDependencies = this.dependencies.slice();

            const prompt = this.createAssignmentPrompt(existingTasks, existingDependencies);
            const text = await llm.executeLLM(prompt);
            
            console.log('✅ Received response from Gemini AI!');
            console.log('\n🤖 RAW GEMINI RESPONSE');
            console.log('======================');
            console.log(text);
            console.log('======================\n');
            
        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }

    /**
     * Helper functions and queries follow
     */


    /**
     * Create the prompt for Gemini with hardwired preferences
     */
    private createAssignmentPrompt(existingTasks: Task[], existingDependencies: Dependency[]): string {
        const existingTasksSection = `\nTASK BANK:\n${this.tasksToString(existingTasks)}\n`;

        const criticalRequirements = [
            "1. Do not recommend any 'immediately before' dependencies for tasks that already have one",
            "2. Do not recommend any 'immediately after' dependencies for tasks that already have one",
            "3. Do not list two relations for the same pair of tasks.",
            "4. Do not suggest any existing dependencies."
        ];

        if (existingDependencies.length > 0) {
            criticalRequirements.push(`${criticalRequirements.length + 1}. Do not recommend any relations that conflict or overlap with the existing dependencies.`);
        }

        return `
You are a helpful AI assistant that tries to identify potential dependencies between tasks according to their name and description.

YOUR CONSIDERATIONS:
- You will be recommending relationships between tasks from the task bank.
- The possible relationships are: "before", "after", "immediately before", and "immediately after".
- A task cannot have multiple things immediately before or immediately after itself.
- Relationships are bidirectional: if task A must come before task B, task B must come after task A.
- You should base your suggestions on the name and description of each task as well as the existing relationships between tasks.
- Prioritize suggestions for tasks with 0 or 1 existing dependencies.

${existingTasksSection}
${this.dependenciesToString(this.dependencies)}

CRITICAL REQUIREMENTS:
${criticalRequirements.join('\n')}

Return your suggestions in the following format:
"Suggested Dependencies:
'Task 1 Name':
- 'relation' 'Task 2 Name'
- 'relation' 'Task 3 Name'
...
"
Do not return anything except these suggestions.
`;
    }

    public tasksToString (tasks: Task[]) : string {
         return tasks.map(task => {
            return `- ${task.name} (${task.desc})`;
        }).join('\n');
    }

    public dependenciesToString (dependencies: Dependency[]) : string {
        return dependencies.map(dependency => {
            return `- ${dependency.task1.name} (${dependency.depRel}) ${dependency.task2.name}`;
        }).join('\n');    
    }
}