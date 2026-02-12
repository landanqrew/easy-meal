/**
 * Test script for AI recipe generation
 * Run with: GEMINI_API_KEY=your_key bun run packages/api/src/services/ai.test.ts
 */
import { generateRecipe, normalizeIngredients } from './ai';
async function testRecipeGeneration() {
    console.log('='.repeat(60));
    console.log('Testing Recipe Generation');
    console.log('='.repeat(60));
    const preferences = {
        protein: 'chicken',
        vegetables: ['broccoli', 'bell peppers'],
        cuisine: 'Asian',
        mealType: 'dinner',
        cookingMethod: 'stovetop',
        timeConstraint: 'quick',
        servings: 4,
        dietaryRestrictions: ['gluten-free'],
    };
    console.log('\nPreferences:', JSON.stringify(preferences, null, 2));
    console.log('\nGenerating recipe...\n');
    try {
        const recipe = await generateRecipe(preferences);
        console.log('Generated Recipe:');
        console.log('-'.repeat(40));
        console.log(`Title: ${recipe.title}`);
        console.log(`Description: ${recipe.description}`);
        console.log(`Servings: ${recipe.servings}`);
        console.log(`Prep Time: ${recipe.prepTime} min`);
        console.log(`Cook Time: ${recipe.cookTime} min`);
        console.log(`Cuisine: ${recipe.cuisine}`);
        console.log('\nIngredients:');
        recipe.ingredients.forEach((ing) => {
            const prep = ing.preparation ? `, ${ing.preparation}` : '';
            console.log(`  - ${ing.quantity} ${ing.unit} ${ing.name} [${ing.category}]${prep}`);
        });
        console.log('\nInstructions:');
        recipe.instructions.forEach((step) => {
            console.log(`  ${step.stepNumber}. ${step.text}`);
        });
        return recipe;
    }
    catch (error) {
        console.error('Error generating recipe:', error);
        throw error;
    }
}
async function testIngredientNormalization(recipeIngredients) {
    console.log('\n' + '='.repeat(60));
    console.log('Testing Ingredient Normalization');
    console.log('='.repeat(60));
    // Simulate existing ingredients in database
    const existingIngredients = [
        'chicken breast',
        'broccoli',
        'bell pepper',
        'garlic',
        'olive oil',
        'salt',
        'black pepper',
        'soy sauce',
    ];
    console.log('\nRecipe ingredients:', recipeIngredients);
    console.log('Existing DB ingredients:', existingIngredients);
    console.log('\nNormalizing...\n');
    try {
        const matches = await normalizeIngredients(recipeIngredients, existingIngredients);
        console.log('Normalization Results:');
        console.log('-'.repeat(40));
        matches.forEach((match) => {
            const status = match.isNew ? '(NEW)' : '(matched)';
            const category = match.isNew ? ` [${match.category}]` : '';
            console.log(`  "${match.recipeIngredient}" -> "${match.matchedTo}" ${status}${category}`);
        });
        const newIngredients = matches.filter((m) => m.isNew);
        console.log(`\nSummary: ${matches.length - newIngredients.length} matched, ${newIngredients.length} new`);
        return matches;
    }
    catch (error) {
        console.error('Error normalizing ingredients:', error);
        throw error;
    }
}
async function main() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('Error: GEMINI_API_KEY environment variable is required');
        console.log('Run with: GEMINI_API_KEY=your_key bun run packages/api/src/services/ai.test.ts');
        process.exit(1);
    }
    try {
        // Test recipe generation
        const recipe = await testRecipeGeneration();
        // Test ingredient normalization with the generated recipe's ingredients
        const ingredientNames = recipe.ingredients.map((i) => i.name);
        await testIngredientNormalization(ingredientNames);
        console.log('\n' + '='.repeat(60));
        console.log('All tests passed!');
        console.log('='.repeat(60));
    }
    catch (error) {
        console.error('\nTest failed:', error);
        process.exit(1);
    }
}
main();
