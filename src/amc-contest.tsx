import { doc, Firestore, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { createSignal, Index, onMount } from "solid-js";

import styles from './App.module.css';
import Timer from "./Timer";

interface AMCContestProps {
    db: Firestore
    year: string // e.g. 2025
    test: string // e.g. AMC 10A
}

export default function AMCContest(props: AMCContestProps) {
    const [year, setYear] = createSignal(props.year);
    const [test, setTest] = createSignal(props.test);
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

    const localAnswerKeys: Record<string, string[]> = {
        amc12a2025: [
            'B','D','A','C','E','B','D','A','C','E','B','D','A','C','E','B','D','A','C','E','B','D','A','C','E'
        ]
    };

    const fetchKey = async () => {
        try {
            const keyDoc = await getDoc(doc(props.db, "answerKeys", documentName()));
            if (keyDoc.exists()) {
                return keyDoc.data()?.answers as string[] | null;
            }
        } catch (error) {
            console.error("Unable to fetch answer key:", error);
        }
        return localAnswerKeys[documentName()] ?? null;
    };

    onMount(() => {
        onSnapshot(docRef(), snapshot => {
            const newAnswers = snapshot.data()?.answers;
            setAnswers(newAnswers ? newAnswers : answers());
            const endtime = snapshot.data()?.endtime?.toDate?.();
            setTimer(endtime ? endtime : timer());
        }, error => {
            console.error("Permission denied.", error);
        });
    });

    const gradeAnswers = async () => {
        setGradeError('');
        const key = await fetchKey();
        if (!key || key.length === 0) {
            setGradeMessage('');
            setGradingResults(Array(25).fill(null));
            setGradeError(`No answer key found for ${test()} ${year()}.`);
            return;
        }

        const results = answers().map((choice, index) => {
            const correct = key[index];
            if (!correct) return false;
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
                    <input
                        class={styles.GradeInput}
                        value={year()}
                        onInput={e => setYear(e.currentTarget.value)}
                        placeholder="2025"
                    />
                </label>
                <label class={styles.GradeLabel}>
                    Test
                    <input
                        class={styles.GradeInput}
                        value={test()}
                        onInput={e => setTest(e.currentTarget.value)}
                        placeholder="AMC12A"
                    />
                </label>
                <button class={styles.GradeButton} onClick={gradeAnswers}>Grade</button>
            </div>
            {gradeMessage() && <div class={styles.GradeSummary}>{gradeMessage()}</div>}
            {gradeError() && <div class={styles.GradeError}>{gradeError()}</div>}
            <div class={styles.Answers}>
                <Index each={answers()}>
                    {(choice, index) => {
                        const result = gradingResults()[index];
                        return (
                            <div class={styles.Cell} classList={{ [styles.Correct]: result === true, [styles.Incorrect]: result === false }}>
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
                    setDoc(docRef(), { endtime: new Date(Date.now() + 75 * 60 * 1000) }, { merge: true });
                    setTimerOn(true);
                }}>Start</button>
                <button onClick={() => setTimerOn(false)}>Reset</button>
            </div>
        </div>
    );
}
