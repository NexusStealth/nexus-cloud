// Firebase configuration using compat version
const firebaseConfig = {
  apiKey: "AIzaSyCtw0Vuf1QmiuBPq-VjgCtLlGw2Vdiy0W8",
  authDomain: "nexus-cloud-aecaf.firebaseapp.com",
  projectId: "nexus-cloud-aecaf",
  storageBucket: "nexus-cloud-aecaf.firebasestorage.app",
  messagingSenderId: "930463700134",
  appId: "1:930463700134:web:fc8793f916e97750e39067",
  measurementId: "G-PYBVTKC38D"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// If you want to use analytics, you can initialize it as well
// const analytics = firebase.analytics();