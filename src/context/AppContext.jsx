import { createContext, useContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState('light');
  const [highContrast, setHighContrast] = useState(false);
  const [colorblind, setColorblind] = useState(false);
  const [largeButtons, setLargeButtons] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [leftHanded, setLeftHanded] = useState(false);
  const [motionReduce, setMotionReduce] = useState(false);

  // Apply theme classes to body
  useEffect(() => {
    const root = document.documentElement;
    
    // Theme
    if (theme === 'dark') {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }

    // Accessibility
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('colorblind', colorblind);
    root.classList.toggle('large-buttons', largeButtons);
    root.classList.toggle('dyslexia-font', dyslexiaFont);
    root.classList.toggle('left-handed', leftHanded);
    root.classList.toggle('motion-reduce', motionReduce);
    
  }, [theme, highContrast, colorblind, largeButtons, dyslexiaFont, leftHanded, motionReduce]);

  // Load from local storage on mount (stubbed for now, full implementation later)
  useEffect(() => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('kali-settings'));
      if (savedSettings) {
        setTheme(savedSettings.theme || 'light');
        setHighContrast(savedSettings.highContrast || false);
        // ... load rest
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      highContrast, setHighContrast,
      colorblind, setColorblind,
      largeButtons, setLargeButtons,
      dyslexiaFont, setDyslexiaFont,
      leftHanded, setLeftHanded,
      motionReduce, setMotionReduce
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
