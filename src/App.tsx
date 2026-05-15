import { createSignal, onMount, Show, type Component } from 'solid-js';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";

import styles from './App.module.css';
import AMCContest from './amc-contest';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDzbByDhyDIUEYZHxxNHb6t8h2vwpJEjq8",
    authDomain: "contest-checker-bcd1e.firebaseapp.com",
    projectId: "contest-checker-bcd1e",
    storageBucket: "contest-checker-bcd1e.firebasestorage.app",
    messagingSenderId: "165280433066",
    appId: "1:165280433066:web:7da6f938a5bcda15df61d3",
    measurementId: "G-SFN8XD0XDX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const App: Component = () => {
    const [user, setUser] = createSignal<User | null>(null);
    const [loading, setLoading] = createSignal(true);

    onMount(() => {
        onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
            }
        });
    });

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
        }
    }

    return (
        <Show when={!loading()} fallback={<div>Loading...</div>}>
            <Show
                when={user()}
                fallback={
                    <div style="text-align: center; margin-top: 50px;">
                        <h2>Contest Grader</h2>
                        <button onClick={handleLogin}>Sign in with Google</button>
                    </div>
                }
            >
                <header class={styles.Header}>
                    <div style="margin-left: auto;">{user()?.displayName}</div>
                    <button onClick={() => signOut(auth)}>Logout</button>
                </header>
                <AMCContest
                    db={getFirestore(app)}
                    year={"2025"}
                    test={"AMC12A"}
                />
            </Show>
        </Show>
    );
};

export default App;
