import { TaskBank, Relation, reverseRelationMap } from './taskbank';
import { GeminiLLM, Config } from './gemini-llm';
import test from 'node:test';

function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}

/**
 * Test case 1: Obvious Suggestions, Few Tasks
 * Tests a very basic, obvious relationship between a minimal number of tasks, 
 * given a model of a similar relationship.
 */
export async function testObviousSuggestionsFewTasks(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Obvious Suggestions, Few Tasks');
    console.log('==================================');
    
    // Initialize task bank, configuration, and LLM
    const taskBank = new TaskBank();
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    
    // Add tasks to task bank
    console.log('📝 Adding tasks...');
    const getBreakfastIng = taskBank.addTask("Get breakfast ingredients", "Buy eggs, sausage, and bread for breakfast.");
    const makeBreakfast = taskBank.addTask("Make breakfast", "Make eggs, sausage, and toast for breakfast.");
    const getLunchIng = taskBank.addTask("Get lunch ingredients", "Buy chicken, potatoes, and green beans for lunch.");
    const makeLunch = taskBank.addTask("Make lunch", "Make grilled chicken, mashed potatoes, and roasted green beans for lunch.")

    // Add dependencies
    console.log('⏰ Adding dependencies...');
    const getBFBeforeMakeBF = taskBank.addDependency(getBreakfastIng, makeBreakfast, Relation.B);
    
    // Display the schedule
    taskBank.suggestDependencies(llm);
}

/**
 * Test case 2: Obvious Suggestions, Some Tasks
 * Tests a few basic, obvious relationships between a handful of tasks.
 */
export async function testObviousSuggestionsSomeTasks(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: Obvious Suggestions, Many Tasks');
    console.log('==================================');
    // Initialize task bank, configuration, and LLM
    const taskBank = new TaskBank();
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    
    // Add tasks to task bank
    console.log('📝 Adding tasks...');
    const getIngredients = taskBank.addTask("Get ingredients", "Buy ingredients for meal prep.");
    const cook = taskBank.addTask("Cook", "Cook meals for the week.");
    const doDishes = taskBank.addTask("Do dishes", "Wash all the dirty dishes from cooking.");
    const doReading = taskBank.addTask("Do reading", "Read assigned chapter for political science class.");
    const takeReadingQuiz = taskBank.addTask("Take reading quiz", "Complete questions related to assigned chapter.");
    const watchLectureVideos = taskBank.addTask("Watch lecture videos", "Catch up on lecture videos for math class.");
    const makeCheatSheet = taskBank.addTask("Make cheat sheet", "Make cheat sheet on all lectures for math test.")

    // Add dependencies
    console.log('⏰ Adding dependencies...');
    const getIngBeforeCook = taskBank.addDependency(getIngredients, cook, Relation.B);
    
    // Get suggestions and display them
    taskBank.suggestDependencies(llm);
}

/**
 * Test case 3: Obvious Suggestions, Many Tasks
 * Tests a few basic, obvious relationships between a large number of tasks.
 */
export async function testObviousSuggestionsManyTasks(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: Obvious Suggestions, Many Tasks');
    console.log('==================================');
    
    // Initialize task bank, configuration, and LLM
    const taskBank = new TaskBank();
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    
    // Add tasks to task bank
    console.log('📝 Adding tasks...');
    const cleanRoom = taskBank.addTask("Clean room", "Pick up clothes, trash, and dishes from around my bedroom.");
    const startLaundry = taskBank.addTask("Start laundry", "Start washing dirty clothes.");
    const putAwayLaundry = taskBank.addTask("Put away laundry", "Put away clean clothes.");
    const doDishes = taskBank.addTask("Do dishes", "Wash all the dirty dishes.");
    const takeOutTrash = taskBank.addTask("Take out trash", "Bring trash to the dumpster.");
    const doReading = taskBank.addTask("Do reading", "Read assigned chapter for political science class.");
    const takeReadingQuiz = taskBank.addTask("Take reading quiz", "Complete questions related to assigned chapter.");
    const watchLectureVideos = taskBank.addTask("Watch lecture videos", "Catch up on lecture videos for math class.");
    const makeCheatSheet = taskBank.addTask("Make cheat sheet", "Make cheat sheet on all lectures for math test.")
    const doMathPset = taskBank.addTask("Do math pset", "Do math problem set based on recent material.");
    const respondEmails = taskBank.addTask("Respond to emails", "Go through inbox and respond to all recent emails.");
    const updateCalendar = taskBank.addTask("Update calendar", "Update calendar to reflect changes communicated via email.");
    const makeAgenda = taskBank.addTask("Make agenda", "Make meeting agenda for exec meeting based on recent updates communicated via email.");
    const sendAnnouncement = taskBank.addTask("Send announcement", "Send message with meeting details and agenda.");

    // Add dependencies - none for this test case
    console.log('⏰ Adding dependencies...');
    
    // Get suggestions and display them
    taskBank.suggestDependencies(llm);
}
/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('🎓 TaskBank Test Suite');
    console.log('========================\n');
    
    try {
        // Run manual scheduling test
        await testObviousSuggestionsFewTasks();
        await testObviousSuggestionsSomeTasks();
        await testObviousSuggestionsManyTasks();

        console.log('\n🎉 All test cases completed successfully!');
        
    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}