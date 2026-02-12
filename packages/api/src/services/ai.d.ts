import type { RecipePreferences, GeneratedRecipe } from '@easy-meal/shared';
export type { RecipePreferences, GeneratedRecipe };
export declare function generateRecipe(preferences: RecipePreferences): Promise<GeneratedRecipe>;
export type IngredientMatch = {
    recipeIngredient: string;
    matchedTo: string;
    isNew: boolean;
    category?: string;
};
export declare function normalizeIngredients(recipeIngredients: string[], existingIngredients: string[]): Promise<IngredientMatch[]>;
//# sourceMappingURL=ai.d.ts.map