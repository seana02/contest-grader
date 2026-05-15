import { createSignal, onCleanup } from "solid-js";

import styles from './App.module.css';

type Props = {
    endTime: Date;
    enabled: boolean;
};

export default function Timer(props: Props) {
    const getRemaining = () => {
        if (!props.enabled) return 0;
        return Math.max(0, props.endTime.getTime() - Date.now());
    };

    const [remaining, setRemaining] = createSignal(getRemaining());

    const interval = setInterval(() => setRemaining(getRemaining()), 1000);
    onCleanup(() => clearInterval(interval));

    const format = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    return (
        <div class={styles.Timer}>
            {format(remaining())}
        </div>
    );
}
