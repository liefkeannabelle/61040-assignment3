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

5. Unclear relationship between tasks.

6. Many relationships with the same task.


## Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
