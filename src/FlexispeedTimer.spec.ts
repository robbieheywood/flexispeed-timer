import { FlexispeedTimer } from './FlexispeedTimer';

jest.useFakeTimers();

describe('FlexispeedTimer', () => {
    // Hacky but useful for this test
    // Mock out Date().getTime() so that we can control the flow of time in this test.
    let testTime = 0;
    jest.spyOn(Date.prototype, 'getTime').mockImplementation(() => testTime);
    function advanceTime(msecs: number) {
        testTime += msecs;
        jest.advanceTimersByTime(msecs);
    }

    beforeEach(() => {
        testTime = 0;
    });

    it.each([
        { speed: 1 },
        { speed: 2 },
        { speed: 4 },
        { speed: 10 },
        { speed: 1.0/2.0 },
        { speed: 1.0/4.0 },
        { speed: 1.0/10.0 },
        ])(
        'should run at the correct speed',
        (test: { speed: number }) => {
            let expectTimeout = false;
            const timeoutFn = jest.fn().mockImplementation(() => expect(expectTimeout).toBeTruthy());
            const timer = new FlexispeedTimer(timeoutFn, 10);

            timer.updateSpeed(test.speed);
            expect(timer.getSpeed()).toEqual(test.speed);

            const waitTime = 1000000;
            timer.start(waitTime);

            // Check that timing is correct to within 1%.
            advanceTime(0.99 * waitTime / test.speed);
            expect(timeoutFn).not.toHaveBeenCalled();
            expectTimeout = true;
            advanceTime(0.02 * waitTime / test.speed);
            expect(timeoutFn).toHaveBeenCalled();
    });

    it('should allow being stopped', () => {
        const timeoutFn = jest.fn().mockImplementation(() => {
            expect('timer should not timeout in this test').toBeFalsy();
        });
        const timer = new FlexispeedTimer(timeoutFn, 10);
        timer.start(1000);
        timer.stop();
        jest.runAllTimers();
        expect(timeoutFn).not.toHaveBeenCalled();
    });

    it('should handle timer correctly before being started', () => {
        const timer = new FlexispeedTimer(jest.fn(), 10);
        expect(() => timer.stop()).not.toThrow();
        expect(timer.getTimeSinceStart()).toEqual(0);
        expect(timer.getTimeToExpiry()).toEqual(0);
    });

    it('should handle timer correctly after being stopped', () => {
        const timer = new FlexispeedTimer(jest.fn(), 10);
        timer.start(1000);
        timer.stop();

        expect(() => timer.stop()).not.toThrow();
        expect(timer.getTimeSinceStart()).toEqual(0);
        expect(timer.getTimeToExpiry()).toEqual(0);
    });

    it('should handle timer correctly after timeout', () => {
        const timeoutFn = jest.fn();
        const timer = new FlexispeedTimer(timeoutFn, 10);
        timer.start(1000);
        jest.runAllTimers();
        expect(timeoutFn).toHaveBeenCalled();

        expect(() => timer.stop()).not.toThrow();
        expect(timer.getTimeSinceStart()).toEqual(0);
        expect(timer.getTimeToExpiry()).toEqual(0);
    });

    it.each([
        { setSpeed: 2, expectedSpeed: 2 },
        { setSpeed: 10, expectedSpeed: 10},
        { setSpeed: 11, expectedSpeed: 1 },
        { setSpeed: 1.0 / 2.0, expectedSpeed: 1.0 / 2.0 },
        { setSpeed: 1.0 / 10.0, expectedSpeed: 1.0 / 10.0 },
        { setSpeed: 1.0 / 11.0, expectedSpeed: 1 },
        ])(
        'should respect limits when updating speed',
        (test: { setSpeed: number, expectedSpeed: number }) => {
            const maxSpeed = 10;
            const timer = new FlexispeedTimer(jest.fn(), maxSpeed);
            timer.updateSpeed(test.setSpeed);
            expect(timer.getSpeed()).toEqual(test.expectedSpeed);
    });

    it.each([
        { speed: 1 },
        { speed: 2 },
        { speed: 4 },
        { speed: 10 },
        { speed: 1.0/2.0 },
        { speed: 1.0/4.0 },
        { speed: 1.0/10.0 },
        ])(
        'should report times correctly',
        (test: { speed: number }) => {
            const timer = new FlexispeedTimer(jest.fn(), 10);
            const waitTime = 1000;
            timer.updateSpeed(test.speed);
            timer.start(waitTime);
            const elapsedTime = 200;
            advanceTime(elapsedTime / test.speed);

            expect(timer.getTimeSinceStart()).toEqual(elapsedTime);
            expect(timer.getTimeToExpiry()).toEqual(waitTime - elapsedTime);
    });

    it('should correctly update speed mid-timer', () => {
        const timeoutFn = jest.fn();
        const timer = new FlexispeedTimer(timeoutFn, 10);
        const waitTime = 1000;
        timer.start(waitTime);

        advanceTime(0.5 * waitTime);
        const newSpeed = 2;
        timer.updateSpeed(newSpeed);

        // Check that timing is correct to within 1%.
        advanceTime(0.49 * waitTime / newSpeed);
        expect(timeoutFn).not.toHaveBeenCalled();
        advanceTime(0.02 * waitTime / newSpeed);
        expect(timeoutFn).toHaveBeenCalled();
    })
});