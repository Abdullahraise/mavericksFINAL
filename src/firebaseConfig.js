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

export const onAuthStateChange = (callback) => {
  // Real auth state change listener
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Firestore functions
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date().toISOString(),
      role: 'user',
      points: 0,
      badges: [],
      progress: {
        assessmentsCompleted: 0,
        skillsAssessed: 0,
        videosCompleted: 0,
        hackathonsJoined: 0
      }
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
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
    const storageRef = ref(storage, `resumes/${uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
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
