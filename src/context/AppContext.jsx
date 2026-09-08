import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================================================
// 3. useContext: AppContext
// Provides global state (User name, Theme, and saved assessment data)
// across the entire SkinGen AI application without prop drilling.
// ============================================================================

const AppContext = createContext();

const LOCAL_STORAGE_KEY = 'skingen_assessment_data';
const THEME_STORAGE_KEY = 'skingen_theme_preference';

const defaultAssessment = {
  name: 'Khushi',
  age: 19,
  skinType: 'Combination', // 'Normal' | 'Dry' | 'Oily' | 'Combination'
  waterIntake: 2.5,        // in Liters per day
  sunExposure: 2,          // hours per day
  score: 62,               // Default matching Figma circular score
  riskLevel: 'Moderate',   // Matching Figma: Moderate Skin Health Risk
  hereditaryRisk: 'Low',   // Matching Figma: Low Hereditary Risk
  lastAssessmentDate: 'Sep 2',
  notes: 'Routine AI monitoring recommended'
};

export const AppProvider = ({ children }) => {
  // // useState: Managing user profile and theme across the app
  const [user, setUser] = useState({
    name: 'Khushi',
    email: 'khushi.satam@skingen.ai',
    healthProfileComplete: 85, // 85% Complete from Figma
    avatarInitial: 'J'
  });

  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'assessment' | 'result' | 'risk' | 'care'
  const [currentAssessment, setCurrentAssessment] = useState(defaultAssessment);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // ==========================================================================
  // 2. useEffect: Local Storage Data Persistence
  // Loads previously saved assessment data on initial app mount
  // and saves new assessment updates automatically.
  // ==========================================================================

  // Load saved data when the application starts
  useEffect(() => {
    // // useEffect: Reading persisted data from localStorage on mount
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setCurrentAssessment(parsed);
        if (parsed.name) {
          setUser(prev => ({ ...prev, name: parsed.name, avatarInitial: parsed.name.charAt(0).toUpperCase() }));
        }
      }

      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []); // Empty dependency array ensures this runs once on initial mount

  // Save assessment data to localStorage whenever it changes
  useEffect(() => {
    // // useEffect: Auto-saving assessment state to localStorage
    if (currentAssessment) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentAssessment));
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
      }
    }
  }, [currentAssessment]);

  // Sync theme changes with body class & localStorage
  useEffect(() => {
    // // useEffect: Syncing theme to DOM and localStorage
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Update document title dynamically
  useEffect(() => {
    // // useEffect: Updating browser tab title
    document.title = `SkinGen AI | ${activeTab.toUpperCase()}`;
  }, [activeTab]);

  // useCallback: Memoized theme toggling function
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Show a temporary banner notification
  const triggerNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Save new assessment results globally
  const saveAssessment = useCallback((newAssessment) => {
    setCurrentAssessment(newAssessment);
    setAssessmentHistory(prev => [newAssessment, ...prev.slice(0, 4)]);
    if (newAssessment.name) {
      setUser(prev => ({ ...prev, name: newAssessment.name, avatarInitial: newAssessment.name.charAt(0).toUpperCase() }));
    }
    triggerNotification('Assessment completed & saved successfully!');
  }, [triggerNotification]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        currentAssessment,
        saveAssessment,
        assessmentHistory,
        isAuthModalOpen,
        setIsAuthModalOpen,
        notification,
        triggerNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook to consume AppContext
// // useContext: Hook consumer function
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
