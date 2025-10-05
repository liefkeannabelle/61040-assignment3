/**
 * TaskBank Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';
export enum Relation {
    B = "must happen before",
    A = "must happen after",
    IB = "must happen immediately before",
    IA = "must happen immediately after",
    V = "VOID"
}
export const reverseRelationMap = {
  [Relation.A]: Relation.B,
  [Relation.B]: Relation.A,
  [Relation.IA]: Relation.IB,
  [Relation.IB]: Relation.IA,
  [Relation.V]: Relation.V
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
        this.dependencies = this.dependencies.filter(dependency => dependency.task1 !== delTask);
        this.dependencies = this.dependencies.filter(dependency => dependency.task2 !== delTask);
        
        this.tasks = this.tasks.filter(task => task !== delTask);
    }

    addDependency(firstTask: Task, secondTask: Task, forwardRel: Relation): void{
        const forwardDep: Dependency = {
            task1: firstTask,
            task2: secondTask,
            depRel: forwardRel
        };

        const revRel : Relation = reverseRelationMap[forwardRel];
        
        const reverseDep: Dependency = {
            task1: secondTask,
            task2: firstTask,
            depRel: revRel
        };

        this.dependencies.push(forwardDep);
        this.dependencies.push(reverseDep);

    }

    async suggestDependencies(llm: GeminiLLM): Promise<void> {
        try {
            console.log('🤖 Requesting potential dependencies from Gemini AI...');

            const existingTasks = this.tasks.slice();
            const existingDependencies = this.dependencies.slice();

            const prompt = this.createAssignmentPrompt(existingTasks, existingDependencies);
            const text = await llm.executeLLM(prompt);
            
            console.log('✅ Received response from Gemini AI!');
            console.log('\n🤖 RAW GEMINI RESPONSE');
            console.log('======================');
            console.log(text);
            console.log('======================\n');

            const sugTaskBank = this.parseAndAddTasks(text, existingTasks, existingDependencies);
            console.log(sugTaskBank.dependenciesToString(sugTaskBank.dependencies));
            
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
            "1. Do not recommend any 'must happen immediately before' dependencies for tasks that already have one",
            "2. Do not recommend any 'must happen immediately after' dependencies for tasks that already have one",
            "3. Do not list two relations for the same pair of tasks."
        ];

        if (existingDependencies.length > 0) {
            criticalRequirements.push(`${criticalRequirements.length + 1}. Do not recommend any relations that conflict with or reiterate the existing dependencies.`);
        }

        return `
You are a helpful AI assistant that tries to identify potential dependencies between tasks according to their name and description.

YOUR CONSIDERATIONS:
- You will be recommending relationships between tasks from the task bank.
- The possible relationships are: ${Relation} EXCEPT 'Void'. Do not enter a relationship as Void. 
- For each relationship, use the exact phrase written above.
- Do not list a relationship as "must happen immediately before" or "must happen immediately after" unless the need for immediacy is clear.
- You should base your suggestions on the name and description of each task as well as the existing relationships between tasks. 
- Do not suggest relationships between tasks that are clearly unrelated. It is okay to produce no suggestions for a task if no other tasks are related to it.
- It is okay to produce multiple suggestions with the same task if many other tasks depend on it. You don't need to be 100% sure that they are related, but should be able to justify your suggestion if asked.
- A task cannot have multiple tasks with relationships "must happen immediately before" or "must happen immediately after".
- Relationships are bidirectional: if task A must come before task B, task B must come after task A. Only include ONE of these relations in the suggestions.
- Your suggestions must NOT include any existing dependencies or conflict with existing dependencies.

${existingTasksSection}
${this.dependenciesToString(this.dependencies)}

CRITICAL REQUIREMENTS:
${criticalRequirements.join('\n')}


Return your response as a JSON object with this exact structure:
{
  "suggestions": [
    {
      "task1": "exact task name from task bank",
      "task2": "exact task name from task bank",
      "relation": "dependency relation from options above"
    }
  ]
}

Return ONLY the JSON object, no additional text.`

    }

        private parseAndAddTasks(responseText: string, curTasks: Task[], curDeps: Dependency[]): TaskBank {
            let suggestedTaskBank = new TaskBank;
            suggestedTaskBank.tasks = structuredClone(curTasks);
            //suggestedTaskBank.dependencies = structuredClone(curDeps);

            try {
                // Extract JSON from response (in case there's extra text)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('No JSON found in response');
                }
    
                const response = JSON.parse(jsonMatch[0]);
                
                if (!response.suggestions || !Array.isArray(response.suggestions)) {
                    throw new Error('Invalid response format');
                }
    
                console.log('📝 Processing LLM suggestions...');
    
                const issues: string[] = [];

                for (const rawSuggestion of response.suggestions) {
                    if (typeof rawSuggestion !== 'object' || rawSuggestion === null) {
                        issues.push('Encountered a suggestion entry that is not an object.');
                        continue;
                    }
    
                    const { task1, task2, relation } = rawSuggestion as { task1?: unknown; task2: unknown, relation?: unknown };

                    let firstTask : Task = {
                        name : "BLANK",
                        desc : "BLANK"
                    };
                    let secondTask : Task = {
                        name : "BLANK",
                        desc : "BLANK"
                    };
                    let rel = Relation.V;
                    const possRels = Object.values(Relation);
                    for(const task of curTasks){
                        if(task.name == task1){
                            firstTask = task;
                        }
                        if(task.name == task2){
                            secondTask = task;
                        }
                        for(const possRel of possRels){
                            if(relation == possRel){
                                rel = possRel;
                            }
                        }
                    }

                    let canAdd = true;
                    for(const cur of curDeps){
                        if(task1 == cur.task1.name && task2 == cur.task2.name){
                            canAdd = false;
                        }
                    }

                    if(canAdd){
                        suggestedTaskBank.addDependency(firstTask, secondTask, rel);
                    }
                }
    
                if (issues.length > 0) {
                    throw new Error(`LLM provided disallowed assignments:\n- ${issues.join('\n- ')}`);
                }
    
                
            } catch (error) {
                console.error('❌ Error parsing LLM response:', (error as Error).message);
                console.log('Response was:', responseText);
                throw error;
            }
            return suggestedTaskBank;
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