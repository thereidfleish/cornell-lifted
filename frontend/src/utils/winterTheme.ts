/**
 * Utility functions for winter theme detection and management
 */

/**
 * Determines if the winter theme should be active based on the theme config setting
 * Winter theme is active when theme is set to "fall"
 */
export function isWinterTheme(theme: string | undefined): boolean {
    if (!theme) {
        return false;
    }
    
    // Winter theme is active when theme is "fall"
    return theme === "fall";
}
