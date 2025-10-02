<concept_spec>

concept 
    TaskBank[Relation]

purpose 
    allow for tasks to relate to one another

principle 
    users can enter tasks and denote their relationship to other existing tasks by entering their own or accepting AI-assisted recommendations.

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