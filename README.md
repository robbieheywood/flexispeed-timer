# Flexispeed Timer
This is a Typescript library containing a timer that can be easily sped up and slowed down. 
The handling of the timer speed is abstracted away from the user, 
allowing them to treat the timer as if it is always running at 'normal (1x)' speed.

Example Usage:

```
// Create new flexispeed timer with a max speed of 10x
const timer = new FlexispeedTimer(() => console.log('Timed out'), 10);

// Start the timer running for 1000ms
timer.start(1000);

// Update the speed to 2x
timer.updateSpeed(2);

// Retrieve info about the timer
// Note that getTimeSinceStart() and getTimeToExpiry() give values as if the timer is running at 1x speed,
// rather than the actual number of seconds since the timer was started / until the timer goes off
const currentSpeed = timer.getSpeed()
const timeSinceStart = timer.getTimeSinceStart()
const timerToExpiry = timer.getTimeToExpiry()

// Stop the timer before it times out
timer.stop()
```
 