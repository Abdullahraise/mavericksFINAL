import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Demo Firebase configuration (for development only)
// In production, you would use your own Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCUMPabu1Lobay3F6myIgTeZk8gNTDXraI",
  authDomain: "mavericks-3158a.firebaseapp.com",
  projectId: "mavericks-3158a",
  storageBucket: "mavericks-3158a.firebasestorage.app",
  messagingSenderId: "969803384859",
  appId: "1:969803384859:web:87c825d31d5f21711b90be",
  measurementId: "G-D91MKV9LPQ"
};

// Configure Firebase persistence for session management
// This enables session persistence across page refreshes and browser restarts
const PERSISTENCE_TYPE = {
  LOCAL: 'LOCAL',     // Persists even when browser is closed
  SESSION: 'SESSION', // Persists until browser is closed
  NONE: 'NONE'        // No persistence (session ends when page is closed)
};

// Set default persistence to LOCAL for better user experience
const DEFAULT_PERSISTENCE = PERSISTENCE_TYPE.LOCAL;


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    console.log('Logout successful');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

import { setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from 'firebase/auth';

// Set persistence type for Firebase Auth
export const setAuthPersistence = async (persistenceType = DEFAULT_PERSISTENCE) => {
  try {
    let persistenceMode;
    
    switch (persistenceType) {
      case PERSISTENCE_TYPE.LOCAL:
        persistenceMode = browserLocalPersistence;
        break;
      case PERSISTENCE_TYPE.SESSION:
        persistenceMode = browserSessionPersistence;
        break;
      case PERSISTENCE_TYPE.NONE:
        persistenceMode = inMemoryPersistence;
        break;
      default:
        persistenceMode = browserLocalPersistence;
    }
    
    await setPersistence(auth, persistenceMode);
    return true;
  } catch (error) {
    console.error('Error setting auth persistence:', error);
    return false;
  }
};

// Enhanced auth state change listener with role verification and session management
export const onAuthStateChange = (callback) => {
  // Set persistence when auth state changes
  setAuthPersistence();
  
  // Real auth state change listener with role verification
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Get user profile from Firestore to verify role
        const userProfile = await getUserProfile(user.uid);
        
        // If user is admin@mavericks.com, ensure they have admin role
        if (user.email === 'admin@mavericks.com') {
          // If admin user doesn't have admin role in profile, update it
          if (!userProfile || userProfile.role !== 'admin') {
            await updateUserRole(user.uid, 'admin');
          }
          
          // Add role to user object
          user.role = 'admin';
        } else {
          // For non-admin users, use role from profile or default to 'user'
          user.role = userProfile?.role || 'user';
        }
        
        // Add session data to user object
        if (userProfile && userProfile.sessionData) {
          user.sessionData = userProfile.sessionData;
          
          // Update last active timestamp
          await updateDoc(doc(db, 'users', user.uid), {
            lastActive: new Date().toISOString(),
            'sessionData.lastActive': new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error verifying user role:', error);
        // Default to user role if verification fails
        user.role = user.email === 'admin@mavericks.com' ? 'admin' : 'user';
      }
    }
    
    callback(user);
  });
};

// Firestore functions
export const createUserProfile = async (uid, userData) => {
  try {
    // Check if this is the admin email
    const isAdmin = userData.email === 'admin@mavericks.com';
    
    // Check if user already exists
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    // If user exists, preserve their session data
    let existingSessionData = {};
    if (userDoc.exists()) {
      const existingData = userDoc.data();
      existingSessionData = existingData.sessionData || {};
    }
    
    // Create or update user profile
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date().toISOString(),
      role: isAdmin ? 'admin' : 'user', // Set role based on email
      points: 0,
      badges: [],
      progress: {
        assessmentsCompleted: 0,
        skillsAssessed: 0,
        videosCompleted: 0,
        hackathonsJoined: 0
      },
      lastLogin: new Date().toISOString(),
      sessionData: {
        ...existingSessionData,
        resumeUploaded: existingSessionData.resumeUploaded || false,
        resumeURL: existingSessionData.resumeURL || null,
        assessmentStarted: existingSessionData.assessmentStarted || false,
        currentStep: existingSessionData.currentStep || 'profile',
        deviceInfo: navigator.userAgent,
        loginHistory: [...(existingSessionData.loginHistory || []), {
          timestamp: new Date().toISOString(),
          device: navigator.userAgent
        }]
      }
    });
    
    return userRef;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (uid, role) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Update user session data to maintain state between sessions
export const updateUserSession = async (uid, sessionData) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // First check if user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Merge with existing session data to preserve important fields
      const existingData = userDoc.data().sessionData || {};
      
      // Preserve resume upload status if it exists
      if (existingData.resumeUploaded && !sessionData.resumeUploaded) {
        sessionData.resumeUploaded = true;
        sessionData.resumeURL = existingData.resumeURL || null;
      }
      
      // Preserve assessment progress if it exists
      if (existingData.assessmentStarted && !sessionData.assessmentStarted) {
        sessionData.assessmentStarted = true;
        sessionData.assessmentProgress = existingData.assessmentProgress || {};
      }
      
      // Update the document with merged data
      await updateDoc(userRef, { 
        sessionData: { ...existingData, ...sessionData },
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Create new document if it doesn't exist
      await setDoc(userRef, {
        sessionData,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user session:', error);
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No user profile found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadResume = async (file, uid) => {
  try {
    // Firebase Storage uploads have been disabled
    // Return a dummy local URL instead
    console.log('Firebase Storage uploads disabled - returning dummy URL');
    const dummyURL = `local://${file.name}`;
    
    // Update user session to mark resume as uploaded
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const sessionData = userData.sessionData || {};
      
      // Update session data with resume information
      await updateDoc(userRef, {
        sessionData: {
          ...sessionData,
          resumeUploaded: true,
          resumeURL: dummyURL,
          resumeFileName: file.name,
          resumeUploadDate: new Date().toISOString()
        }
      });
    }
    
    return dummyURL;
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const createHackathon = async (hackathonData) => {
  try {
    const hackathonsRef = collection(db, 'hackathons');
    const newHackathonRef = await addDoc(hackathonsRef, {
      ...hackathonData,
      createdAt: new Date().toISOString(),
      participants: [],
      submissions: []
    });
    
    const newHackathonSnap = await getDoc(newHackathonRef);
    return { id: newHackathonSnap.id, ...newHackathonSnap.data() };
  } catch (error) {
    console.error('Error creating hackathon:', error);
    throw error;
  }
};

export const getHackathons = async () => {
  try {
    const hackathonsRef = collection(db, 'hackathons');
    const querySnapshot = await getDocs(hackathonsRef);
    
    const hackathons = [];
    querySnapshot.forEach((doc) => {
      hackathons.push({ id: doc.id, ...doc.data() });
    });
    
    return hackathons;
  } catch (error) {
    console.error('Error getting hackathons:', error);
    throw error;
  }
};

export default app;
