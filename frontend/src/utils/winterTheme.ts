/**
 * Utility functions for winter theme detection and management
 */

/**
 * Determines if the winter theme should be active based on the form message group
 * Winter theme is active when the most recent (form) message group is from Fall semester
 */
export function isWinterTheme(formMessageGroup: string | undefined): boolean {
    if (!formMessageGroup || formMessageGroup === "none") {
        return false;
    }
    
    // Check if the message group starts with "fa_" (Fall semester)
    return formMessageGroup.startsWith("fa_");
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
