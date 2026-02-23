import type { RecipePreferences, GeneratedRecipe } from '@easy-meal/shared';
export type { RecipePreferences, GeneratedRecipe };
export declare function generateRecipe(preferences: RecipePreferences): Promise<GeneratedRecipe>;
export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};
export type ChatRecipeResponse = {
    message: string;
    recipe?: GeneratedRecipe;
};
export declare function chatRecipeGeneration(messages: ChatMessage[], dietaryRestrictions?: string[]): Promise<ChatRecipeResponse>;
export declare function extractRecipeFromPDF(pdfBase64: string, mimeType: string, existingIngredientNames: string[]): Promise<GeneratedRecipe>;
export type IngredientMatch = {
    recipeIngredient: string;
    matchedTo: string;
    isNew: boolean;
    category?: string;
};
export declare function normalizeIngredients(recipeIngredients: string[], existingIngredients: string[]): Promise<IngredientMatch[]>;
//# sourceMappingURL=ai.d.ts.map