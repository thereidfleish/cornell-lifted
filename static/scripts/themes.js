// Function to create and add snowflakes
function addSnowflakes() {
  // Only add snowflakes if we're in fall theme
  if (!document.body.classList.contains('fall')) {
    return;
  }

  // Remove any existing balloons from hero section
  const heroDecorations = document.querySelectorAll('.hero-decoration .balloon');
  heroDecorations.forEach(balloon => {
    balloon.style.display = 'none';
  });

  // Add snowflake container if it doesn't exist
  let snowflakeContainer = document.querySelector('.hero-decoration .snowflake-container');
  if (!snowflakeContainer) {
    snowflakeContainer = document.createElement('div');
    snowflakeContainer.className = 'snowflake-container';

    // Create 5 snowflakes (matching the original balloon count)
    for (let i = 0; i < 5; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflakeContainer.appendChild(snowflake);
    }

    // Add to hero decoration
    const heroDecoration = document.querySelector('.hero-decoration');
    if (heroDecoration) {
      heroDecoration.appendChild(snowflakeContainer);
    }
  }

  // Do the same for CTA section if it exists
  const ctaBalloons = document.querySelectorAll('.cta-balloons .balloon');
  ctaBalloons.forEach(balloon => {
    balloon.style.display = 'none';
  });

  let ctaSnowflakes = document.querySelector('.cta-balloons .snowflake-container');
  if (!ctaSnowflakes && document.querySelector('.cta-balloons')) {
    ctaSnowflakes = document.createElement('div');
    ctaSnowflakes.className = 'snowflake-container cta-snowflakes';

    // Create 3 snowflakes for CTA (matching original balloon count)
    for (let i = 0; i < 3; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      ctaSnowflakes.appendChild(snowflake);
    }

    // Add to CTA balloons
    const ctaBalloons = document.querySelector('.cta-balloons');
    if (ctaBalloons) {
      ctaBalloons.appendChild(ctaSnowflakes);
    }
  }
}

// Update the existing seasonal detection to include snowflake implementation
document.addEventListener('DOMContentLoaded', function () {
  // Keep the existing seasonal detection
  const month = new Date().getMonth();

  if (month >= 2 && month <= 5) {
    document.body.classList.add('spring');
    console.log('Spring theme applied');
  } else if (month >= 8 && month <= 12) {
    document.body.classList.add('fall');
    console.log('Fall theme applied');
    // Add snowflakes for fall
    setTimeout(addSnowflakes, 10); // Small delay to ensure DOM is ready
  } else {
    // Currently using spring for Jan-Feb, fall for Jul-Aug
    if (month <= 1) { // January and February
      document.body.classList.add('fall'); // From previous year's fall
      setTimeout(addSnowflakes, 100); // Add snowflakes for fall
    } else { // July and August
      document.body.classList.add('spring'); // From current year's spring
    }
  }
});