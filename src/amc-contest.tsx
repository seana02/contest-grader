import { doc, Firestore, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { createEffect, createSignal, Index, onCleanup, onMount } from "solid-js";

import styles from './App.module.css';
import Timer from "./Timer";

import { answers as answerKey } from './answers';

interface AMCContestProps {
    db: Firestore
}

export default function AMCContest(props: AMCContestProps) {
    const [year, setYear] = createSignal('');
    const [test, setTest] = createSignal('');
    const documentName = () => test().toLowerCase() + year();
    const docRef = () => doc(props.db, "sessions", documentName());

    const [answers, setAnswers] = createSignal<string[]>([
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
    ]);

    const [timer, setTimer] = createSignal<Date>(new Date());
    const [timerOn, setTimerOn] = createSignal<boolean>(false);
    const [gradingResults, setGradingResults] = createSignal<(boolean | null)[]>(Array(25).fill(null));
    const [gradeMessage, setGradeMessage] = createSignal<string>('');
    const [gradeError, setGradeError] = createSignal<string>('');

    const fetchKey = () => {
        try {
            let y = answerKey[year()];
            return y[test()];
        } catch (error) {
            console.error("Unable to fetch answer key:", error);
        }
    };

    createEffect(() => {
        const unsub = onSnapshot(docRef(), snapshot => {
            const newAnswers = snapshot.data()?.answers;
            setAnswers(newAnswers ? newAnswers : answers());
            const endtime = snapshot.data()?.endtime?.toDate();
            setTimer(endtime ? endtime : timer());
            setTimerOn(snapshot.data()?.timerOn);
        }, error => {
            console.error("Permission denied.", error);
        });

        onCleanup(unsub);
    });

    const gradeAnswers = async () => {
        setGradeError('');
        const key = fetchKey();
        if (!key || key.length === 0) {
            setGradeMessage('');
            setGradingResults(Array(25).fill(null));
            setGradeError(`No answer key found for ${test()} ${year()}.`);
            return;
        }

        const results = answers().map((choice, index) => {
            const correct = key[index];
            if (!correct) return false;
            if (correct === 'x') return true;
            if (choice === '') return null;
            return choice === correct;
        });
        const correctCount = results.filter(r => r === true).length;
        const blankCount = results.filter(r => r === null).length;
        setGradingResults(results);
        setGradeMessage(`Score: ${6 * correctCount + 1.5 * blankCount}/${6 * key.length}`);
    };

    return (
        <div class={styles.App}>
            <Timer
                endTime={timer()}
                enabled={timerOn()}
            />
            <div class={styles.GradeControls}>
                <label class={styles.GradeLabel}>
                    Year
                    <select
                        class={styles.GradeInput}
                        value={year()}
                        onChange={e => setYear(e.currentTarget.value)}
                    >
                        {Object.keys(answerKey).sort().reverse().map(k => (<option value={k}>{k}</option>))}
                    </select>
                </label>
                <label class={styles.GradeLabel}>
                    Test
                    <select
                        class={styles.GradeInput}
                        value={test()}
                        onChange={e => setTest(e.currentTarget.value)}
                    >
                        { year() === "" ? <></> : <option value={test()}>{"Select Test"}</option> }
                        { year() === "" ? <option value={test()}>{"Select Year"}</option> : Object.keys(answerKey[year()]).map(k => (<option value={k}>{k}</option>)) }
                    </select>
                </label>
                <button class={styles.GradeButton} onClick={gradeAnswers}>Grade</button>
            </div>
            {!gradeError() && <div class={styles.GradeSummary}>{gradeMessage() || "Score:"}</div>}
            {gradeError() && <div class={styles.GradeError}>{gradeError()}</div>}
            <div class={styles.Answers}>
                <Index each={answers()}>
                    {(choice, index) => {
                        const result = gradingResults()[index];
                        return (
                            <div class={styles.Cell} classList={{ [styles.Correct]: gradingResults()[index] === true, [styles.Incorrect]: gradingResults()[index] === false }}>
                                {index + 1}
                                <select
                                    class={styles.Select}
                                    value={choice()}
                                    onChange={e => {
                                        const updated = answers().slice();
                                        updated[index] = e.currentTarget.value;
                                        setDoc(docRef(), { answers: updated }, { merge: true });
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
                        );
                    }}
                </Index>
            </div>
            <div class={styles.ButtonGroup}>
                <button onClick={() => {
                    setDoc(docRef(), { endtime: new Date(Date.now() + 75 * 60 * 1000), timerOn: true }, { merge: true });
                    reset();
                }}>Start</button>
                    <button onClick={() => { reset(); setDoc(docRef(), { timerOn: false }, { merge: true }) }}>Reset</button>
            </div>
        </div>
    );

    function reset() {
        setGradeMessage('');
        setGradeError('');
        setGradingResults(Array(25).fill(null));
    }
}
