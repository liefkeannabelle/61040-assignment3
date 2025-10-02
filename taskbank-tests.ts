import { TaskBank, Relation, reverseRelationMap } from './taskbank';
import { GeminiLLM, Config } from './gemini-llm';

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
 * Test case 1: Obvious Suggestions
 * Tests a very basic, obvious relationship between a minimal number of tasks.
 */
export async function testObviousSuggestions(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Obvious Suggestions');
    console.log('==================================');
    
    const taskBank = new TaskBank();
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    
    // Add some activities
    console.log('📝 Adding tasks...');
    const getBreakfastIng = taskBank.addTask("Get breakfast ingredients", "Buy eggs, sausage, and bread for breakfast.");
    const makeBreakfast = taskBank.addTask("Make breakfast", "Make eggs, sausage, and toast for breakfast.");
    const getLunchIng = taskBank.addTask("Get lunch ingredients", "Buy chicken, potatoes, and green beans for lunch.");
    const makeLunch = taskBank.addTask("Make lunch", "Make grilled chicken, mashed potatoes, and roasted green beans for lunch.")
    console.log(taskBank.tasksToString(taskBank.getTasks()));

    // Manually assign activities to time slots
    console.log('⏰ Adding dependencies...');
    const getBFBeforeMakeBF = taskBank.addDependency(getBreakfastIng, makeBreakfast, Relation.B);
    console.log(taskBank.dependenciesToString(taskBank.getDependencies()));
    
    // Display the schedule
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
        await testObviousSuggestions();

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