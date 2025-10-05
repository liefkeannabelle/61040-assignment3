# Assignment 3: An AI-Augmented Concept
## Task Tackler: Task Bank
### Augmenting Concept Design
**Original concept:**
```
concept TaskBank[Relation]
purpose allow for tasks to relate to one another
principle users can enter tasks and denote their relationship to other existing tasks.
state
    a set of Tasks with 
        a taskName String
        an optional description String
        a set of Dependencies with
            a depTask Task
            a depRelation Relation
actions
    addTask (name : String, ? desc : String ) : Task
        requires : there is not already a Task with taskName = name
        effects : a new Task with taskName = name and description = desc is returned and added to the set of Tasks
    deleteTask (task : Task) 
        requires : task is in set of Tasks
        effects : task is removed from set of Tasks
    addDependency (task1 : Task, task2 : Task, dependency : Relation) : Dependency
        requires : task1 and task2 are both in set of Tasks
        effects : for task1's set of Dependencies, task2 and dependency are added. for task2's set of Dependencies, task1 and the inverse of dependency are added.
    deleteDependency (task : Task, dependency : Dependency)
        requires : task has dependency in its set of Dependencies
        effects : dependency is removed from task's set of Dependencies and the corresponding Dependency is deleted from depTask's set of Dependencies
    getDependencies (task : Task) : Set<Dependency>
        requires : task is in set of Tasks
        effects : returns the set of Dependencies for task
    evaluateOrder (task1 : Task, task2 : Task) : Boolean
        requires : task1 and task2 are in set of Tasks
        effects : returns True iff task1 and task2 are in a valid order according to their dependencies
```
**Proposed augmentation:** The place where AI support seems to fit best in this concept design is as a part of the addDependencies function. While a user constructs a new task, an AI Assistant could evaluate the name and description of the new task as well as those already in the task bank to recommend potential dependencies. Then, a user could simply accept a suggestion rather than having to enter the information themselves.

This would produce the following, augmented concept design:
```
concept TaskBank[Relation]
purpose allow for tasks to relate to one another
principle users can enter tasks and denote their relationship to other existing tasks by entering their own or accepting AI-assisted recommendations.
state
    a set of Tasks with 
        a taskName String
        an optional description String
        a set of Dependencies with
            a depTask Task
            a depRelation Relation
actions
    addTask (name : String, ? desc : String ) : Task
        requires : there is not already a Task with taskName = name
        effects : a new Task with taskName = name and description = desc is returned and added to the set of Tasks
    deleteTask (task : Task) 
        requires : task is in set of Tasks
        effects : task is removed from set of Tasks
    addDependency (task1 : Task, task2 : Task, dependency : Relation) : Dependency
        requires : task1 and task2 are both in set of Tasks
        effects : for task1's set of Dependencies, task2 and dependency are added. for task2's set of Dependencies, task1 and the inverse of dependency are added.
    deleteDependency (task : Task, dependency : Dependency)
        requires : task has dependency in its set of Dependencies
        effects : dependency is removed from task's set of Dependencies and the corresponding Dependency is deleted from depTask's set of Dependencies
    getDependencies (task : Task) : Set<Dependency>
        requires : task is in set of Tasks
        effects : returns the set of Dependencies for task
    evaluateOrder (task1 : Task, task2 : Task) : Boolean
        requires : task1 and task2 are in set of Tasks
        effects : returns True iff task1 and task2 are in a valid order according to their dependencies
```

### Designing User Interaction
With this augmentation in mind, this is my thought as to how it would manifest on the Task Tackler application itself. Alongside the "add dependencies" button when creating a new task, it would provide suggested dependencies. The user could then easily click these recommendations and add the relation. 
![user_interactions](/user_interaction.jpg)

### Exploring Test Cases
I started with a few basic test cases (1-3) to ensure that my approach worked when the suggested relationships were very easy. Throughout this process, I iteratively modifed the prompt until the results felt consisently satisfactory. At this point, the prompt was:
```
const criticalRequirements = [
    "1. Do not recommend any 'must happen immediately before' dependencies for tasks that already have one",
    "2. Do not recommend any 'must happen immediately after' dependencies for tasks that already have one",
    "3. Do not list two relations for the same pair of tasks."
];

if (existingDependencies.length > 0) {
    criticalRequirements.push(`${criticalRequirements.length + 1}. Do not recommend any relations that conflict with or reiterate the existing dependencies.`);
}

return `
"You are a helpful AI assistant that tries to identify potential dependencies between tasks according to their name and description.

YOUR CONSIDERATIONS:
- You will be recommending relationships between tasks from the task bank.
- The possible relationships are: ${Relation} EXCEPT 'Void'. Do not enter a relationship as Void. 
- For each relationship, use the exact phrase written above.
- Do not list a relationship as "must happen immediately before" or "must happen immediately after" unless the need for immediacy is clear.
- You should base your suggestions on the name and description of each task as well as the existing relationships between tasks.
- A task cannot have multiple tasks with relationships "must happen immediately before" or "must happen immediately after".
- Relationships are bidirectional: if task A must come before task B, task B must come after task A. Only include ONE of these relations in the suggestions.
- Prioritize suggestions for tasks with 0 or 1 existing dependencies.
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

Return ONLY the JSON object, no additional text."

```

I then wanted to consider a few more unique test cases that may cause the LLM to struggle.

To test a few of these edge cases, I implemented the following test cases:

4. No relationship between tasks.

5. Many relationships with the same task.

6. Tasks without descriptions.

Here is the experience I had with each:

4. No relationship between tasks. 

For this test case, I presented a list of tasks with no relationships. The hope would be that the LLM would not suggest any relationships, prioritizing accuracy over quantity. Unfortunately, with the prompt as given, it suggested a few relationships between tasks:
```
- Do reading (must happen before) Do math pset
- Do math pset (must happen after) Do reading
- Respond to emails (must happen before) Do reading
- Do reading (must happen after) Respond to emails
- Clean room (must happen before) Respond to emails
- Respond to emails (must happen after) Clean room
```
To address this, I went in and basically included some "reassurance" that it does not *need* to make suggestions if there are no relationships. Specifically, I added:
```
- Do not suggest relationships between tasks that are clearly unrelated. It is okay to produce no suggestions for a task if no other tasks are related to it.
```
to the list of considerations. With this added, the LLM successfully made no recommendations for this test case. I also doubled back to make sure it was still correctly producing the obvious suggestions from before, which it was.

5. Many relationships with the same task.

So far, most tasks had relationships with just a few other tasks. However, sometimes, you have a bottleneck in your day that must happen before five or six other things. Based off the prompt right now, I'm not sure it will be able to handle that situation well. Interestingly, I got the following output for the test case with the original prompt:
```
- Pick up room (must happen before) Vacuum room
- Vacuum room (must happen after) Pick up room
- Pick up room (must happen before) Do dishes
- Do dishes (must happen after) Pick up room
- Watch lecture videos (must happen before) Do reading
- Do reading (must happen after) Watch lecture videos
- Do reading (must happen before) Do practice problems
- Do practice problems (must happen after) Do reading
- Do practice problems (must happen before) Watch review video
- Watch review video (must happen after) Do practice problems
- Watch review video (must happen before) Make cheat sheet
- Make cheat sheet (must happen after) Watch review video
- Make cheat sheet (must happen before) Take at home exam
- Take at home exam (must happen after) Make cheat sheet
```

For the first set of tasks that all needed to happen after "pick up room", the LLM did a good job identifying these dependencies. However, for the second set that all needed to happen before "take at home exam", the LLM introduced some unnecessary dependencies like "Do practice problems (must happen before) Watch review video" and "Do reading (must happen after) Watch lecture videos" but did not offer suggestions between these tasks at "take at home exam". By the design of the suggestions, these unnecessary suggestions are okay, so long as they make some logical sense. In this case, I have no issue with the LLM presenting these as options for a user to select, and I can imagine many cases where they would. However, I do want to get things like "Watch lecture videos (must happen before) Take at home exam" in the list of suggestions as well. To achieve this, I once again took the reassurance route and added this to its considerations:
```
- It is okay to produce multiple suggestions with the same task if many other tasks depend on it. You don't need to be 100% sure that they are related, but should be able to justify your suggestion if asked.
```
This successfully generated all the suggestions related to "take at home exam". While the list did become quite long, I also had to remember that this is not the interface users would be presented with, and for them, these suggestions would only be presented as grouped by the task they are currently looking at, so it would be much more approachable. 

6. Tasks without descriptions.

Up until this point, I had presented tasks with pretty illustrative descriptions. Of course, more practically, this won't always be the case, and in my initial concept design, I had imagined the descriptions being optional. So, I want to get a sense of how feasible and what kind of prompting would help support this. In doing so, I got the following output:
```
- Shower (must happen immediately before) Get dressed
- Get dressed (must happen immediately after) Shower
- Get dressed (must happen immediately before) Do makeup
- Do makeup (must happen immediately after) Get dressed
- Start laundry (must happen before) Pick up room
- Pick up room (must happen after) Start laundry
- Pick up room (must happen before) Vacuum room
- Vacuum room (must happen after) Pick up room
- Vacuum room (must happen before) Decorate room
- Decorate room (must happen after) Vacuum room
- Do dishes (must happen before) Pick up room
- Pick up room (must happen after) Do dishes
- Write discussion post (must happen after) Do reading
- Do reading (must happen before) Write discussion post
```
I was pleasantly surprised to see that it picked up on a lot of these possible relationships without the descriptions. In fact, I tested to see if my solution to the last test case made a difference and found that it did. By encouraging the LLM to recommend any justifiable suggestions, it was willing to make these suggestions despite limited information. 

So, with all of these changes, my prompt became:
```
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
```

### Validation
Admittedly, I tackled these tasks a bit out of order. So between tackling my "easy" test cases and the more complex test cases, I went in to validate the outputs. Originally, just to get a sense of how things were working, I had been judging the success strictly by the raw LLM output. However, as the lists got longer, I wanted something more parseable, so it became time to validate the outputs. The validations to implement were:

1. Ensure the output was a valid-formatted JSON and just the JSON. - If the output did not fit the desired output format, an error was thrown as no further analysis of the output could be made. This ensures that all proper checks can be made. This is done in lines 172-181 of taskbank.ts.

2. Make sure the suggestions contained the necessary information (two tasks & a relationship) - Similar to the first, an error is thrown if any suggestions lack necessary information. Once again, this signals a failure on the LLM's end and must be fixed before it can be validated properly. This is done in lines 193-217 of taskbank.ts.

3. Ensure the suggestion does not already exist within the set of dependencies or conflict with an existing dependency. - In this case, this does not require an error to be thrown, but it is necessary to flag so that only unique, valid suggestions are recommended to users. In this case, any suggestion that contains a task pair already associated with a dependency is redundant or conflicting, so can be eliminated. This is done in lines 219-224 of taskbank.ts. 

## Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
