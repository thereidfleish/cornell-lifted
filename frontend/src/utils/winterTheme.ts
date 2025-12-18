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

/**
 * Get the appropriate logo path based on whether winter theme is active
 */
export function getLogoPath(isWinter: boolean): string {
    return isWinter ? "/images/logo_winter.png" : "/images/logo.png";
}

/**
 * Get the appropriate logo URL for emails based on whether winter theme is active
 */
export function getEmailLogoUrl(isWinter: boolean): string {
    return isWinter 
        ? "https://cornelllifted.com/images/logo_winter.png" 
        : "https://cornelllifted.com/images/logo.png";
}
