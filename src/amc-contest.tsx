import { FirebaseApp } from "firebase/app";
import { doc, DocumentData, DocumentReference, Firestore, getFirestore, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { createSignal, Index } from "solid-js";

import styles from './App.module.css';
import Timer from "./Timer";

interface AMCContestProps {
    db: Firestore
    year: string // e.g. 2025
    test: string // e.g. AMC 10A
}


export default function AMCContest(props: AMCContestProps) {
    const documentName = props.test.toLowerCase() + props.year;
    const docRef = doc(props.db, "sessions", documentName);

    const [answers, setAnswers] = createSignal<string[]>([
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
    ]);

    const [timer, setTimer] = createSignal<Date>(new Date());
    const [timerOn, setTimerOn] = createSignal<boolean>(false);

    onSnapshot(doc(props.db, "sessions", documentName), snapshot => {
        let newAnswers = snapshot.data()?.answers;
        setAnswers(newAnswers ? newAnswers : answers);
        let endtime = snapshot.data()?.endtime.toDate();
        setTimer(endtime ? endtime: timer);
    }, error => {
        console.error("Permission denied.", error);
    });

    return (
        <div class={styles.App}>
            <Timer
                endTime={timer()}
                enabled={timerOn()}
            />
            <div class={styles.Answers}>
                <Index each={answers()}>
                    {(choice, index) => (
                        <div class={styles.Cell}>
                            {index + 1}
                            <select
                                class={styles.Select}
                                value={choice()}
                                onChange={e => {
                                    const updated = answers().slice();
                                    updated[index] = e.currentTarget.value;
                                    // setAnswers(updated);
                                    setDoc(docRef, { answers: updated }, { merge: true });
                                }}
                                style={{
                                }}
                            >
                                <option value=''>-</option>
                                <option value='A'>A</option>
                                <option value='B'>B</option>
                                <option value='C'>C</option>
                                <option value='D'>D</option>
                                <option value='E'>E</option>
                            </select>
                        </div>
                    )}
                </Index>
            </div>
            <div class={styles.ButtonGroup}>
                <button onClick={() => {
                    setDoc(docRef, { endtime: new Date(Date.now() + 75 * 60 * 1000) }, { merge: true });
                    setTimerOn(true);
                }}>Start</button>
                <button onClick={() => setTimerOn(false)}>Reset</button>
            </div>
        </div>
    );
}
