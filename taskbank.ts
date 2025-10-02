/**
 * TaskBank Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';
const enum Relation {
    B = "must happen before",
    A = "must happen after",
    IB = "must happen immediately before",
    IA = "must happen immediately after"
}
const reverseRelationMap = {
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
            "2. Do not recommend any 'immediately after' dependencies for tasks that already have one"
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
- Produce between 3-5 suggestions total.


${existingTasksSection}
${this.dependenciesToString(this.dependencies)}

CRITICAL REQUIREMENTS:
${criticalRequirements.join('\n')}

Return your suggestions in the following format:
"Dependencies:
- 'Task 1 Name' 'relation' 'Task 2 Name'
- ...
"

`;

// Return your response as a JSON object with this exact structure:
// {
//   "dependencies": [
//     {
//       "title": "exact activity title from the list above",
//       "startTime": valid_slot_number_0_to_47
//     }
//   ]
// }

// Return ONLY the JSON object, no additional text.

    }

    // /**
    //  * Parse the LLM response and apply the generated assignments
    //  */
    // private parseAndApplyAssignments(responseText: string, unassignedActivities: Activity[]): void {
    //     try {
    //         // Extract JSON from response (in case there's extra text)
    //         const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    //         if (!jsonMatch) {
    //             throw new Error('No JSON found in response');
    //         }

    //         const response = JSON.parse(jsonMatch[0]);
            
    //         if (!response.assignments || !Array.isArray(response.assignments)) {
    //             throw new Error('Invalid response format');
    //         }

    //         console.log('📝 Applying LLM assignments...');

    //         const activitiesByTitle = new Map<string, Activity[]>();
    //         for (const activity of unassignedActivities) {
    //             const list = activitiesByTitle.get(activity.title) ?? [];
    //             list.push(activity);
    //             activitiesByTitle.set(activity.title, list);
    //         }

    //         const issues: string[] = [];
    //         const validatedAssignments: { activity: Activity; startTime: number }[] = [];
    //         const occupiedSlots = new Map<number, Activity>();

    //         for (const existingAssignment of this.assignments) {
    //             for (let offset = 0; offset < existingAssignment.activity.duration; offset++) {
    //                 occupiedSlots.set(existingAssignment.startTime + offset, existingAssignment.activity);
    //             }
    //         }

    //         for (const rawAssignment of response.assignments) {
    //             if (typeof rawAssignment !== 'object' || rawAssignment === null) {
    //                 issues.push('Encountered an assignment entry that is not an object.');
    //                 continue;
    //             }

    //             const { title, startTime } = rawAssignment as { title?: unknown; startTime?: unknown };

    //             if (typeof title !== 'string' || title.trim().length === 0) {
    //                 issues.push('Assignment is missing a valid activity title.');
    //                 continue;
    //             }

    //             const pool = activitiesByTitle.get(title);
    //             if (!pool || pool.length === 0) {
    //                 issues.push(`No available occurrences of activity "${title}" to assign.`);
    //                 continue;
    //             }

    //             const activity = pool.shift() as Activity;

    //             if (typeof startTime !== 'number' || !Number.isInteger(startTime)) {
    //                 issues.push(`Activity "${title}" has a non-integer start time.`);
    //                 continue;
    //             }

    //             if (startTime < 0 || startTime > 47) {
    //                 issues.push(`Activity "${title}" has an out-of-range start time (${startTime}).`);
    //                 continue;
    //             }

    //             const endSlot = startTime + activity.duration;
    //             if (endSlot > 48) {
    //                 issues.push(`Activity "${title}" would extend past the end of the day.`);
    //                 continue;
    //             }

    //             let conflictDetected = false;
    //             for (let offset = 0; offset < activity.duration; offset++) {
    //                 const slot = startTime + offset;
    //                 const occupyingActivity = occupiedSlots.get(slot);
    //                 if (occupyingActivity) {
    //                     issues.push(`Time slot ${this.formatTimeSlot(slot)} is already taken by "${occupyingActivity.title}" and conflicts with "${title}".`);
    //                     conflictDetected = true;
    //                     break;
    //                 }
    //             }

    //             if (conflictDetected) {
    //                 // Put the activity back so we can report subsequent issues accurately.
    //                 pool.unshift(activity);
    //                 continue;
    //             }

    //             for (let offset = 0; offset < activity.duration; offset++) {
    //                 occupiedSlots.set(startTime + offset, activity);
    //             }

    //             validatedAssignments.push({ activity, startTime });
    //         }

    //         if (issues.length > 0) {
    //             throw new Error(`LLM provided disallowed assignments:\n- ${issues.join('\n- ')}`);
    //         }

    //         for (const assignment of validatedAssignments) {
    //             this.assignActivity(assignment.activity, assignment.startTime);
    //             console.log(`✅ Assigned "${assignment.activity.title}" to ${this.formatTimeSlot(assignment.startTime)}`);
    //         }
            
    //     } catch (error) {
    //         console.error('❌ Error parsing LLM response:', (error as Error).message);
    //         console.log('Response was:', responseText);
    //         throw error;
    //     }
    // }

    // private activitiesToString (activities: Activity [] ): string {
    //         return activities.map(activity => {
    //         const durationStr = activity.duration === 1 ? '30 minutes' : `${activity.duration * 0.5} hours`;
    //         return `- ${activity.title} (${durationStr})`;
    //     }).join('\n');
    // }

    // private assignmentsToString(assignments: Assignment[]): string {
    //     return assignments
    //         .map(assignment => {
    //             const time = this.formatTimeSlot(assignment.startTime);
    //             const durationStr = assignment.activity.duration === 1 ? '30 minutes' : `${assignment.activity.duration * 0.5} hours`;
    //             return `- ${assignment.activity.title} at ${time} (${durationStr})`;
    //         })
    //         .join('\n');
    // }

    private tasksToString (tasks: Task[]) : string {
         return tasks.map(task => {
            return `- ${task.name} (${task.desc})`;
        }).join('\n');
    }

    private dependenciesToString (dependencies: Dependency[]) : string {
        return dependencies.map(dependency => {
            return `- ${dependency.task1} (${dependency.depRel}) ${dependency.task2}`;
        }).join('\n');    }

    /**
     * Display the current schedule in a readable format
     */
//     displaySchedule(): void {
//         const schedule = this.getSchedule();
        
//         console.log('\n📅 Daily Schedule');
//         console.log('==================');
        
//         let hasActivities = false;
        
//         for (let slot = 0; slot < 48; slot++) {
//             const activities = schedule[slot];
//             if (activities.length > 0) {
//                 hasActivities = true;
//                 const timeStr = this.formatTimeSlot(slot);
                
//                 // Only show the start of each activity (not every half-hour)
//                 const isActivityStart = activities.some(activity => 
//                     this.assignments.find(a => a.activity === activity)?.startTime === slot
//                 );
                
//                 if (isActivityStart) {
//                     const uniqueActivities = [...new Set(activities)];
//                     for (const activity of uniqueActivities) {
//                         const durationStr = activity.duration === 1 ? '30 min' : `${activity.duration * 0.5} hours`;
//                         console.log(`${timeStr} - ${activity.title} (${durationStr})`);
//                     }
//                 }
//             }
//         }
        
//         if (!hasActivities) {
//             console.log('No activities scheduled yet.');
//         }
        
//         console.log('\n📋 Unassigned Activities');
//         console.log('========================');
//         const unassigned = this.activities.filter(a => !this.isAssigned(a));
//         if (unassigned.length > 0) {
//             unassigned.forEach(activity => {
//                 const durationStr = activity.duration === 1 ? '30 min' : `${activity.duration * 0.5} hours`;
//                 console.log(`- ${activity.title} (${durationStr})`);
//             });
//         } else {
//             console.log('All activities are assigned!');
//         }
//     }
}