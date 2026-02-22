export type UserPreferences = {
    defaultServings: number;
    cuisinePreferences: string[];
};
export type DietaryRestriction = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'keto' | 'low-sodium' | 'halal' | 'kosher';
export type IngredientCategory = 'produce' | 'dairy' | 'meat' | 'seafood' | 'pantry' | 'frozen' | 'bakery' | 'beverages' | 'other';
export type RecipeSource = 'ai_generated' | 'manual' | 'imported';
export type GroceryListStatus = 'active' | 'completed' | 'archived';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type RecipeType = 'full_meal' | 'entree' | 'side' | 'dessert' | 'appetizer' | 'snack' | 'drink' | 'other';
export type TimeConstraint = 'quick' | 'medium' | 'leisurely';
export type CookingMethod = 'stovetop' | 'oven' | 'grill' | 'slow-cooker' | 'instant-pot' | 'air-fryer' | 'no-cook';
export type Cuisine = 'american' | 'italian' | 'mexican' | 'asian' | 'mediterranean' | 'indian' | 'thai' | 'japanese' | 'french' | 'other';
export type RecipePreferences = {
    protein?: string;
    vegetables?: string[];
    fruits?: string[];
    cuisine?: string;
    mealType?: MealType;
    recipeType?: RecipeType;
    cookingMethod?: CookingMethod | string;
    timeConstraint?: TimeConstraint;
    servings?: number;
    dietaryRestrictions?: DietaryRestriction[];
    additionalNotes?: string;
};
export type GeneratedIngredient = {
    name: string;
    quantity: number;
    unit: string;
    category: IngredientCategory | string;
    preparation?: string;
};
export type GeneratedRecipe = {
    title: string;
    description: string;
    servings: number;
    prepTime: number;
    cookTime: number;
    cuisine: string;
    type?: RecipeType;
    ingredients: GeneratedIngredient[];
    instructions: {
        stepNumber: number;
        text: string;
    }[];
};
export type ApiResponse<T> = {
    data: T;
    error?: never;
} | {
    data?: never;
    error: string;
};
export type HealthResponse = {
    status: 'ok';
    timestamp: string;
};
export type MealPlanEntry = {
    id: string;
    recipeId: string;
    date: string;
    mealType: MealType;
    sortOrder: number;
    recipe: {
        id: string;
        title: string;
        prepTime: number | null;
        cookTime: number | null;
        type: RecipeType;
    };
};
//# sourceMappingURL=index.d.ts.map