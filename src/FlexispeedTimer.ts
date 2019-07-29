// Copyright (c) Improbable Worlds Ltd, All Right Reserved

// Wrap the node timer to allow it to remember when it was set and for how long it was set.
type MemoryTimer = {
    timer: NodeJS.Timer,
    length: number,
    setTime: number,
};

/*
FlexispeedTimer is a wrapper around the node timer that allows it to be sped up / slowed down.
The handling for this is abstracted away from the user,
so they can deal with the timer as if it is always running at 1x speed.
 */
export class FlexispeedTimer {
    private memoryTimer: MemoryTimer | null = null;

    private readonly onTimeout: () => void;
    private readonly maxSpeed: number;
    private speed: number;

    constructor(onTimeout: () => void, maxSpeed: number, initialSpeed: number = 1) {
        this.onTimeout = onTimeout;
        this.maxSpeed = maxSpeed;
        this.speed = initialSpeed;
    }

    start(time: number) {
        this.stop();
        this.memoryTimer = {
            timer: setTimeout(() => this.onTimeout(), time / this.speed),
            length: time,
            setTime: new Date().getTime(),
        };
    }

    stop() {
        if (this.memoryTimer !== null) {
            clearTimeout(this.memoryTimer.timer);
            this.memoryTimer = null;
        }
    }

    getSpeed(): number {
        return this.speed;
    }

    updateSpeed(speed: number) {
        if (speed > this.maxSpeed || speed  < (1 / this.maxSpeed)) {
            return;
        }

        const timeToExpiry = this.getTimeToExpiry();
        let stopped = false;
        if (this.memoryTimer !== null) {
            this.stop();
            stopped = true;
        }
        this.speed = speed;
        if (stopped) {
            this.start(timeToExpiry);
        }
    }

    // This accounts for the speed to give the time since started if running at 1x speed,
    // not the actual number of seconds since the timer was started.
    getTimeSinceStart() {
        if (this.memoryTimer === null) {
            return 0;
        }
        return (new Date().getTime() - this.memoryTimer.setTime) * this.speed;
    }

    // This accounts for the speed to give the time to expiry if running at 1x speed,
    // not the actual number of seconds until the timer fires.
    getTimeToExpiry() {
        if (this.memoryTimer === null) {
            return 0;
        }
        return this.memoryTimer.length - this.getTimeSinceStart();
    }
}