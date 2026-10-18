import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ============================================================================
// 3. useContext: AppContext
// Provides global state (User name, Theme, and saved assessment data)
// across the entire SkinGen AI application without prop drilling.
// ============================================================================

const AppContext = createContext();

const LOCAL_STORAGE_KEY = 'skingen_assessment_data';
const THEME_STORAGE_KEY = 'skingen_theme_preference';

export const deriveNameFromEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const localPart = email.split('@')[0] || '';
  const clean = localPart.replace(/[0-9+]/g, '').trim();
  if (!clean) return '';
  const parts = clean.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
};

const defaultAssessment = {
  name: '',
  age: 24,
  skinType: 'Combination', // 'Normal' | 'Dry' | 'Oily' | 'Combination'
  waterIntake: 2.5,        // in Liters per day
  sunExposure: 2,          // hours per day
  score: 62,               // Default matching Figma circular score
  riskLevel: 'Moderate',   // Moderate Skin Health Risk
  hereditaryRisk: 'Low',   // Low Hereditary Risk
  lastAssessmentDate: 'Today',
  notes: 'Routine AI monitoring recommended'
};

export const tabToPath = {
  dashboard: '/',
  profile: '/profile',
  assessment: '/assessment',
  result: '/result',
  userform: '/user-details',
  risk: '/risk',
  care: '/care',
  family: '/family',
  reports: '/reports',
  about: '/about',
  settings: '/settings'
};

export const pathToTab = (pathname) => {
  const clean = pathname ? pathname.replace(/^\//, '').toLowerCase().split('/')[0] : '';
  if (!clean || clean === 'dashboard') return 'dashboard';
  if (clean === 'profile') return 'profile';
  if (clean === 'assessment') return 'assessment';
  if (clean === 'result' || clean === 'results') return 'result';
  if (clean === 'userform' || clean === 'user-details' || clean === 'form') return 'userform';
  if (clean === 'risk') return 'risk';
  if (clean === 'care') return 'care';
  if (clean === 'family') return 'family';
  if (clean === 'reports') return 'reports';
  if (clean === 'about') return 'about';
  if (clean === 'settings') return 'settings';
  return 'dashboard';
};

export const AppProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Load current authenticated user from persistent storage, or start with neutral empty state
  const [user, setUser] = useState(() => {
    try {
      const isAuth = localStorage.getItem('skingen_demo_auth') === 'true';
      const savedUser = localStorage.getItem('skingen_current_user');
      if (isAuth && savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          return {
            name: parsed.name || '',
            email: parsed.email || '',
            healthProfileComplete: parsed.healthProfileComplete || 85,
            avatarInitial: parsed.avatarInitial || (parsed.name ? parsed.name.trim().charAt(0).toUpperCase() : 'U')
          };
        }
      }
    } catch (e) {
      console.error('Error restoring user session:', e);
    }
    return {
      name: '',
      email: '',
      healthProfileComplete: 85,
      avatarInitial: 'U'
    };
  });

  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTabState] = useState(() => pathToTab(location?.pathname || '/'));
  const [currentAssessment, setCurrentAssessment] = useState(defaultAssessment);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [spfConfirmed, setSpfConfirmed] = useState(false);
  
  // Frontend Demo Authentication state: defaults to false if no demo session active
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('skingen_demo_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Synchronize activeTab whenever the URL route changes (back/forward or navigation)
  useEffect(() => {
    if (location?.pathname) {
      const matched = pathToTab(location.pathname);
      setActiveTabState(matched);
    }
  }, [location?.pathname]);

  // Unified setActiveTab that updates state and transitions the URL route
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    const targetPath = tabToPath[tab] || '/';
    if (location && location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [location, navigate]);

  // Show a temporary banner notification
  const triggerNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Demo Login function: establishes single source of truth for logged-in user
  const login = useCallback((userData) => {
    let cleanName = userData?.name ? userData.name.trim() : '';
    const cleanEmail = userData?.email ? userData.email.trim() : '';

    if (!cleanName && cleanEmail) {
      cleanName = deriveNameFromEmail(cleanEmail);
    }

    const finalUser = {
      name: cleanName,
      email: cleanEmail,
      healthProfileComplete: userData?.healthProfileComplete || 85,
      avatarInitial: cleanName ? cleanName.charAt(0).toUpperCase() : (cleanEmail ? cleanEmail.charAt(0).toUpperCase() : 'U')
    };

    setUser(finalUser);
    setIsAuthenticated(true);

    try {
      localStorage.setItem('skingen_demo_auth', 'true');
      localStorage.setItem('skingen_current_user', JSON.stringify(finalUser));

      if (cleanEmail) {
        const savedUsers = JSON.parse(localStorage.getItem('skingen_users_db') || '{}');
        savedUsers[cleanEmail.toLowerCase()] = finalUser;
        localStorage.setItem('skingen_users_db', JSON.stringify(savedUsers));
      }
    } catch (e) {
      console.error('Error saving user login:', e);
    }

    triggerNotification(`Signed in successfully as ${finalUser.name || 'User'}.`);
    navigate('/');
  }, [navigate, triggerNotification]);

  // Demo Logout function: clears current user state and storage
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser({
      name: '',
      email: '',
      healthProfileComplete: 0,
      avatarInitial: 'U'
    });
    try {
      localStorage.removeItem('skingen_demo_auth');
      localStorage.removeItem('skingen_current_user');
    } catch (e) {
      console.error('Error clearing session:', e);
    }
    triggerNotification('Signed out of clinical session.');
  }, [triggerNotification]);

  // Load saved data when the application starts
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.name === 'Khushi' || parsed.name === 'Jeet') {
          parsed.name = '';
        }
        setCurrentAssessment(prev => ({ ...prev, ...parsed }));
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
        triggerNotification,
        spfConfirmed,
        setSpfConfirmed,
        isAuthenticated,
        login,
        logout
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
